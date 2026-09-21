"use client";

import React, { useEffect, useState } from "react";
import { Package, FileText, AlertTriangle } from "lucide-react";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import ConfirmModal from "@/components/ConfirmModal";
import api from "@/lib/api";
import { ArrivedDelivery, GRN } from "./types";

interface Props {
  open: boolean;
  initialDeliveryId?: number;
  onClose: () => void;
  onSuccess: (grn: GRN) => void;
}

interface ItemRow {
  poItemId: number;
  deliveryItemId: number;
  itemId: number;
  itemName: string;
  categoryName: string;
  ordered: number;
  previous: number;
  declared: number;
  actual: number | "";
  uom: string;
}

const checks = [
  ["physicalQuantityVerified", "Physical quantity verified"],
  ["itemsMatchPurchaseOrder", "Items match the PO"],
  ["supplierDocumentsChecked", "Supplier documents checked"],
  ["packagingConditionChecked", "Packaging / condition checked"],
] as const;

export default function CreateGrnModal({ open, initialDeliveryId, onClose, onSuccess }: Props) {
  const [deliveries, setDeliveries] = useState<ArrivedDelivery[]>([]);
  const [selected, setSelected] = useState<ArrivedDelivery | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewGrnNo, setPreviewGrnNo] = useState<string>("GRN-Pending");
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Checkboxes start unchecked by default so operator must manually verify
  const [verified, setVerified] = useState<Record<string, boolean>>({
    physicalQuantityVerified: false,
    itemsMatchPurchaseOrder: false,
    supplierDocumentsChecked: false,
    packagingConditionChecked: false,
  });

  // On open: load available arrived deliveries and preview next GRN number
  useEffect(() => {
    if (!open) return;
    setError(null);
    setItems([]);
    setSelected(null);
    setNotes("");
    setShowConfirm(false);
    setVerified({
      physicalQuantityVerified: false,
      itemsMatchPurchaseOrder: false,
      supplierDocumentsChecked: false,
      packagingConditionChecked: false,
    });

    // 1. Fetch arrived deliveries
    api
      .get("/api/Deliveries")
      .then(({ data }) => {
        const payload = data?.data;
        const list = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
        const arrived = list.filter((d: ArrivedDelivery) => d.status === "Arrived");
        setDeliveries(arrived);

        if (initialDeliveryId) {
          const target = arrived.find((d: ArrivedDelivery) => d.deliveryId === initialDeliveryId);
          if (target) loadSource(target);
        }
      })
      .catch(() => setError("Unable to load arrived deliveries. Please refresh and try again."));

    // 2. Fetch existing GRNs to preview next GRN number
    api
      .get("/api/GoodsReceipts")
      .then(({ data }) => {
        const allGrns: GRN[] = Array.isArray(data?.data) ? data.data : [];
        const year = new Date().getFullYear();
        const nextSeq = allGrns.length + 1;
        setPreviewGrnNo(`GRN-${year}-${String(nextSeq).padStart(4, "0")}`);
      })
      .catch(() => {
        const year = new Date().getFullYear();
        setPreviewGrnNo(`GRN-${year}-0001`);
      });
  }, [open, initialDeliveryId]);

  const loadSource = async (delivery: ArrivedDelivery) => {
    setSelected(delivery);
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      const [deliveryResult, poResult, itemsCatalogRes] = await Promise.all([
        api.get(`/api/Deliveries/${delivery.deliveryId}`),
        api.get(`/api/PurchaseOrders/${delivery.poId}`),
        api.get("/api/Items?pageSize=1000").catch(() => ({ data: { data: [] } })),
      ]);

      // Build item category lookup map
      const catalogItems = Array.isArray(itemsCatalogRes.data?.data?.items)
        ? itemsCatalogRes.data.data.items
        : Array.isArray(itemsCatalogRes.data?.data)
        ? itemsCatalogRes.data.data
        : [];
      const categoryMap: Record<number, string> = {};
      catalogItems.forEach((catItem: any) => {
        if (catItem.itemId) {
          categoryMap[catItem.itemId] = catItem.categoryName || "";
        }
      });

      const poItems = poResult.data?.data?.items || [];
      const rows = (deliveryResult.data?.data?.items || []).map((line: any) => {
        const po = poItems.find((p: any) => p.poItemId === line.poItemId) || line;
        const declared = Number(line.declaredQuantity);
        const resolvedCategory =
          categoryMap[line.itemId] ||
          po.categoryName ||
          line.categoryName ||
          "Raw Materials";

        return {
          poItemId: line.poItemId,
          deliveryItemId: line.deliveryItemId,
          itemId: line.itemId,
          itemName: line.itemName || `Item #${line.itemId}`,
          categoryName: resolvedCategory,
          ordered: Number(po.quantity ?? line.poOrderedQuantity ?? 0),
          previous: Number(po.receivedQuantity ?? line.poTotalReceivedQuantity ?? 0),
          declared,
          actual: "", // Blank so operator must manually enter count
          uom: line.purchaseUomName || line.uomName || "Unit",
        };
      });
      setItems(rows);
    } catch {
      setError("Unable to load delivery source lines.");
    } finally {
      setLoading(false);
    }
  };

  const setActual = (index: number, value: string) => {
    if (value.trim() === "") {
      setItems((current) => current.map((item, i) => (i === index ? { ...item, actual: "" } : item)));
      return;
    }
    const num = Math.max(0, Number(value));
    setItems((current) => current.map((item, i) => (i === index ? { ...item, actual: num } : item)));
  };

  // Checks are optional checklist items (can check some, all, or none). Form is ready as long as delivery is selected, items exist, and counts are valid non-negative numbers (0 is allowed).
  const isReadyToFinish = Boolean(
    selected &&
      items.length > 0 &&
      items.every((i) => typeof i.actual === "number" && !isNaN(i.actual) && i.actual >= 0)
  );

  // Split items into Raw Materials vs Tools and Supplies
  const rawMaterials = items.filter(
    (i) =>
      !i.categoryName?.toLowerCase().includes("tool") &&
      !i.categoryName?.toLowerCase().includes("suppl")
  );
  const toolsAndSupplies = items.filter(
    (i) =>
      i.categoryName?.toLowerCase().includes("tool") ||
      i.categoryName?.toLowerCase().includes("suppl")
  );

  // Print function
  const handlePrint = () => {
    if (!isReadyToFinish) return;

    const style = document.createElement("style");
    style.id = "__grn-create-print-style";
    style.media = "print";
    style.innerHTML = `
      @media print {
        body > *:not(#grn-create-print-root) { display: none !important; }
        #grn-create-print-root { display: block !important; position: fixed; inset: 0; background: white; z-index: 99999; padding: 32px; color: black; font-family: sans-serif; }
      }
    `;
    document.head.appendChild(style);

    let printRoot = document.getElementById("grn-create-print-root");
    if (!printRoot) {
      printRoot = document.createElement("div");
      printRoot.id = "grn-create-print-root";
      document.body.appendChild(printRoot);
    }

    const now = new Date().toLocaleString("en-PH");

    const renderPrintTable = (groupItems: ItemRow[], title: string) => {
      return `
        <div style="margin-bottom:16px">
          <div style="font-size:13px;font-weight:800;text-transform:uppercase;color:#222;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:8px">
            ${title}
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px">
            <thead>
              <tr style="border-bottom:2px solid #ddd;background:#f5f5f5">
                <th style="text-align:left;padding:6px">Item Name</th>
                <th style="text-align:right;padding:6px">PO Ordered</th>
                <th style="text-align:right;padding:6px">Del. Declared</th>
                <th style="text-align:right;padding:6px">Actual Received</th>
                <th style="text-align:center;padding:6px">Shipment Variance</th>
              </tr>
            </thead>
            <tbody>
              ${
                groupItems.length === 0
                  ? `<tr><td colspan="5" style="padding:10px;text-align:center;color:#888">No items in this category.</td></tr>`
                  : groupItems
                      .map((i) => {
                        const act = typeof i.actual === "number" ? i.actual : 0;
                        const diff = act - i.declared;
                        const varianceHtml =
                          diff === 0
                            ? `<span style="color:#555">Match</span>`
                            : diff < 0
                            ? `<span style="color:#dc2626;font-weight:700">Short ${Math.abs(diff)} (Discrepancy)</span>`
                            : `<span style="color:#dc2626;font-weight:700">Over +${diff} (Discrepancy)</span>`;
                        return `
                        <tr style="border-bottom:1px solid #eee">
                          <td style="padding:6px;font-weight:600">${i.itemName} <span style="font-weight:400;color:#777">(${i.uom})</span></td>
                          <td style="text-align:right;padding:6px;font-family:monospace">${i.ordered}</td>
                          <td style="text-align:right;padding:6px;font-family:monospace">${i.declared}</td>
                          <td style="text-align:right;padding:6px;font-family:monospace;font-weight:700">${act}</td>
                          <td style="text-align:center;padding:6px">${varianceHtml}</td>
                        </tr>`;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>
      `;
    };

    printRoot.innerHTML = `
      <div style="max-width:800px;margin:0 auto;font-size:12px;color:#111">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:20px">
          <div>
            <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px">GOODS RECEIPT NOTE</div>
            <div style="font-size:11px;color:#555;margin-top:4px">Inbound Physical Receiving & Discrepancy Verification</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:15px;font-weight:800;font-family:monospace">${previewGrnNo}</div>
            <div style="font-size:12px;font-weight:700;color:#333;margin-top:2px">DEL: ${selected?.deliveryNumber || "—"}</div>
            <div style="font-size:11px;color:#555">Printed: ${now}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;background:#f9f9f9;padding:12px;border:1px solid #eee;border-radius:6px">
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase">Supplier</div>
            <div style="font-weight:700">${selected?.supplierName || "—"}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase">Purchase Order</div>
            <div style="font-family:monospace;font-weight:600">${selected?.poNumber || "—"}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase">Carrier</div>
            <div>${selected?.carrier || "Supplier Logistics"}</div>
          </div>
        </div>

        ${renderPrintTable(rawMaterials, "Raw Materials")}
        ${renderPrintTable(toolsAndSupplies, "Tools and Supplies")}

        ${
          notes
            ? `<div style="margin-bottom:20px;padding:10px;border:1px solid #ddd;border-radius:4px">
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase">Receiving Notes</div>
            <div style="margin-top:4px">${notes}</div>
          </div>`
            : ""
        }

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;padding-top:20px;border-top:1px solid #ddd">
          <div>
            <div style="font-size:10px;color:#777;text-transform:uppercase">Received & Counted By:</div>
            <div style="margin-top:30px;border-bottom:1px solid #333;width:200px"></div>
            <div style="font-size:10px;color:#555;margin-top:4px">Receiving Officer Signature</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:10px;color:#777;text-transform:uppercase">Acknowledged By Carrier:</div>
            <div style="margin-top:30px;border-bottom:1px solid #333;width:200px;margin-left:auto"></div>
            <div style="font-size:10px;color:#555;margin-top:4px">Driver / Courier Signature</div>
          </div>
        </div>
      </div>
    `;

    window.print();

    setTimeout(() => {
      style.remove();
      printRoot?.remove();
    }, 1000);
  };

  const handleFinishGrn = async () => {
    if (!isReadyToFinish || !selected) {
      setError("Please select an arrived delivery and enter physical counts for every item.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // 1. Create the GRN
      const { data } = await api.post("/api/GoodsReceipts", {
        deliveryId: selected.deliveryId,
        notes: notes.trim() || undefined,
        ...verified,
        items: items.map((i) => ({
          poItemId: i.poItemId,
          deliveryItemId: i.deliveryItemId,
          itemId: i.itemId,
          deliveredQuantity: Number(i.actual),
        })),
      });

      if (!data?.success) throw new Error(data?.message || "Failed to create GRN.");
      const createdGrn = data.data;

      // 2. Automatically Post the GRN to finish it
      const postRes = await api.post(`/api/GoodsReceipts/${createdGrn.grnId}/post`);
      if (postRes.data?.success && postRes.data?.data) {
        onSuccess(postRes.data.data);
        onClose();
      } else {
        throw new Error(postRes.data?.message || "GRN was created, but failed to post.");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper renderer for a table section (Always visible even if 0 items)
  const renderItemTableSection = (groupItems: ItemRow[], title: string) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            {title}
          </span>
          <span className="text-[11px] text-muted-foreground font-semibold">
            ({groupItems.length} {groupItems.length === 1 ? "item" : "items"})
          </span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="px-4 py-3 font-bold">Item</th>
                <th className="px-4 py-3 text-right font-bold">PO ordered</th>
                <th className="px-4 py-3 text-right font-bold">Previously received</th>
                <th className="px-4 py-3 text-right font-bold">PO outstanding</th>
                <th className="px-4 py-3 text-right font-bold">Delivery declared</th>
                <th className="px-4 py-3 text-right font-bold">Actual received</th>
                <th className="px-4 py-3 text-center font-bold">Shipment variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groupItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground font-medium">
                    No {title.toLowerCase()} in this delivery.
                  </td>
                </tr>
              ) : (
                groupItems.map((item) => {
                  const itemIndex = items.findIndex(
                    (x) => x.deliveryItemId === item.deliveryItemId
                  );
                  const outstanding = Math.max(0, item.ordered - item.previous);
                  const isCounted = typeof item.actual === "number" && !isNaN(item.actual);
                  const variance = isCounted ? (item.actual as number) - item.declared : null;

                  return (
                    <tr key={item.deliveryItemId} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        {item.itemName}
                        <span className="ml-2 text-muted-foreground font-normal">
                          ({item.uom})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{item.ordered}</td>
                      <td className="px-4 py-3 text-right font-mono">{item.previous}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {outstanding}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{item.declared}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.actual === "" ? "" : item.actual}
                          placeholder="0"
                          onKeyDown={(e) => {
                            if (e.key === "-" || e.key === "e") {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => setActual(itemIndex, e.target.value)}
                          className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-right font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground"
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {variance === null ? (
                          <span className="text-muted-foreground/60 text-xs">—</span>
                        ) : variance === 0 ? (
                          <span className="text-muted-foreground font-medium text-xs">
                            Match
                          </span>
                        ) : variance < 0 ? (
                          <span className="text-destructive font-bold bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded text-xs">
                            Short {Math.abs(variance)} (Discrepancy)
                          </span>
                        ) : (
                          <span className="text-destructive font-bold bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded text-xs">
                            Over +{variance} (Discrepancy)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <ModalWrapper
        open={open}
        title="Create Goods Receipt Note"
        onClose={onClose}
        size="max-w-5xl"
      >
      <div className="space-y-4 text-foreground">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Select Delivery Section */}
        <section className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
          <div className="space-y-1 pb-1">
            <div className="font-mono text-xl font-extrabold text-foreground tracking-tight">
              {previewGrnNo}
            </div>
            <p className="text-sm font-bold text-foreground">Select Arrived Delivery</p>
            <p className="text-xs text-muted-foreground">
              Choose the Delivery No. associated with the shipment at your gate.
            </p>
          </div>

          <div style={{ width: "100%", maxWidth: "240px", minWidth: "200px" }}>
            <label className="block space-y-1.5" style={{ width: "100%" }}>
              <span className="text-xs font-bold text-foreground whitespace-nowrap block">
                Delivery No. *
              </span>
              <select
                value={selected?.deliveryId || ""}
                onChange={(e) => {
                  const delivery = deliveries.find((d) => d.deliveryId === Number(e.target.value));
                  if (delivery) loadSource(delivery);
                  else {
                    setSelected(null);
                    setItems([]);
                  }
                }}
                style={{
                  width: "100%",
                  minWidth: "200px",
                  height: "40px",
                  display: "block",
                }}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-foreground cursor-pointer"
                disabled={loading || submitting}
              >
                <option value="">— Select Delivery —</option>
                {deliveries.map((d) => (
                  <option key={d.deliveryId} value={d.deliveryId}>
                    {d.deliveryNumber}
                  </option>
                ))}
              </select>
            </label>
            {deliveries.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground mt-1.5">
                No arrived shipments currently awaiting gate receipt note.
              </p>
            )}
          </div>

          {/* Organized Order Details Summary Card */}
          {selected && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Order &amp; Shipment Details
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                  {selected.deliveryNumber}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                    PO Number
                  </span>
                  <span className="font-mono font-bold text-foreground text-xs">
                    {selected.poNumber || "—"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Supplier
                  </span>
                  <span
                    className="font-semibold text-foreground text-xs block truncate"
                    title={selected.supplierName}
                  >
                    {selected.supplierName || "—"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Carrier / Logistics
                  </span>
                  <span className="text-foreground text-xs font-medium block">
                    {selected.carrier || "Supplier Logistics"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Arrival Date
                  </span>
                  <span className="text-foreground text-xs font-medium block">
                    {selected.actualArrival
                      ? new Date(selected.actualArrival).toLocaleDateString()
                      : selected.estimatedArrival
                      ? new Date(selected.estimatedArrival).toLocaleDateString()
                      : "Today"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Empty state when no delivery is chosen */}
        {!selected && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-2xl bg-muted/10">
            <Package className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No delivery selected</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Choose an arrived delivery above to load its physical count sheet.
            </p>
          </div>
        )}

        {loading && (
          <div className="py-10 text-center text-xs text-muted-foreground animate-pulse">
            Loading delivery items…
          </div>
        )}

        {selected && !loading && (
          <>
            {/* Physical Count Section: Both tables always visible */}
            <section className="space-y-4">
              <div>
                <p className="text-sm font-bold text-foreground">Physical Count</p>
                <p className="text-xs text-muted-foreground">
                  Enter physical gate counts for each item. Any shortage or overage will be highlighted in red.
                </p>
              </div>

              {renderItemTableSection(rawMaterials, "Raw Materials")}
              {renderItemTableSection(toolsAndSupplies, "Tools and Supplies")}
            </section>

            {/* Receiving Checks Section (starts unchecked) */}
            <section className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="mb-3 text-sm font-bold text-foreground">Receiving Check</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {checks.map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!verified[key]}
                      onChange={(e) => setVerified((v) => ({ ...v, [key]: e.target.checked }))}
                      className="h-4 w-4 rounded border-border text-foreground accent-foreground"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Receiving Notes */}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Receiving notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                placeholder="Document quantity differences, packaging condition, or gate inspection notes."
              />
            </label>
          </>
        )}

        {/* Footer: Action buttons placed on the right */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4 pb-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!isReadyToFinish || submitting}
            onClick={handlePrint}
            title={
              !isReadyToFinish
                ? "Select delivery and enter counts for all items to enable printing."
                : undefined
            }
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Print GRN
          </button>
          <button
            type="button"
            disabled={!isReadyToFinish || submitting}
            onClick={() => setShowConfirm(true)}
            title={
              !isReadyToFinish
                ? "Select delivery and enter physical counts to finish GRN."
                : undefined
            }
            className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? "Finishing GRN…" : "Finish GRN"}
          </button>
        </div>
      </div>
    </ModalWrapper>

    {/* Confirmation popup based on PR/PO pattern */}
    {showConfirm && (
      <ConfirmModal
        message={`Are you sure you want to finish and post ${previewGrnNo} for Delivery ${selected?.deliveryNumber}?`}
        onConfirm={() => {
          setShowConfirm(false);
          handleFinishGrn();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    )}
    </>
  );
}
