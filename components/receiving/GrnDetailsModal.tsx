"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import { GRN } from "./types";

interface GrnDetailsModalProps {
  grn: GRN | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onPosted: () => void;
}

export default function GrnDetailsModal({ grn, open, onClose, onUpdated, onPosted }: GrnDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!grn) return null;

  const isDraft = grn.status === "Draft";

  const handlePost = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/api/GoodsReceipts/${grn.grnId}/post`);
      if (res.data?.success) {
        onUpdated();
        onClose();
        onPosted();
      } else {
        setError(res.data?.message || "Failed to post GRN.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to post GRN.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(`Are you sure you want to cancel Draft GRN ${grn.grnNumber}?`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/api/GoodsReceipts/${grn.grnId}/cancel`);
      if (res.data?.success) {
        onUpdated();
        onClose();
      } else {
        setError(res.data?.message || "Failed to cancel GRN.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to cancel GRN.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Inject print styles to display only GRN content
    const style = document.createElement("style");
    style.id = "__grn-print-style";
    style.media = "print";
    style.innerHTML = `
      @media print {
        body > *:not(#grn-print-root) { display: none !important; }
        #grn-print-root { display: block !important; position: fixed; inset: 0; background: white; z-index: 99999; padding: 32px; color: black; font-family: sans-serif; }
        .grn-print-only { display: block !important; }
        .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    // Create a temporary print div
    let printRoot = document.getElementById("grn-print-root");
    if (!printRoot) {
      printRoot = document.createElement("div");
      printRoot.id = "grn-print-root";
      document.body.appendChild(printRoot);
    }

    const receivedDate = new Date(grn.receivedDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    const printedAt = new Date().toLocaleString("en-PH");

    printRoot.innerHTML = `
      <div style="max-width:800px;margin:0 auto;font-size:12px;color:#111">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:20px">
          <div>
            <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px">GOODS RECEIPT NOTE</div>
            <div style="font-size:11px;color:#555;margin-top:4px">Commissary / Warehouse Inbound Document</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:700;font-family:monospace">${grn.grnNumber}</div>
            <div style="font-size:11px;color:#555">Status: <strong>${grn.status}</strong></div>
            <div style="font-size:11px;color:#555">Printed: ${printedAt}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase;margin-bottom:4px">Supplier</div>
            <div style="font-weight:600">${grn.supplierName}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase;margin-bottom:4px">Purchase Order</div>
            <div style="font-family:monospace;font-weight:600">${grn.poNumber}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase;margin-bottom:4px">PR Reference</div>
            <div style="font-family:monospace">${grn.prNumber || "—"}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase;margin-bottom:4px">Delivery No.</div>
            <div style="font-family:monospace">${grn.deliveryNumber || "—"}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase;margin-bottom:4px">Received Date</div>
            <div>${receivedDate}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase;margin-bottom:4px">Receiving Bay</div>
            <div>${grn.receivingBay || "Main Receiving Bay"}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase;margin-bottom:4px">Supplier DR #</div>
            <div style="font-family:monospace">${grn.supplierDrNumber || "N/A"}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase;margin-bottom:4px">Supplier Invoice #</div>
            <div style="font-family:monospace">${grn.supplierInvoiceNumber || "N/A"}</div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase;margin-bottom:4px">Received By</div>
            <div>${grn.receivedBy}</div>
          </div>
          ${grn.postedBy ? `<div>
            <div style="font-size:10px;font-weight:600;color:#777;text-transform:uppercase;margin-bottom:4px">Posted By</div>
            <div>${grn.postedBy}</div>
          </div>` : ""}
        </div>

        ${grn.notes ? `<div style="background:#f5f5f5;border:1px solid #ddd;border-radius:6px;padding:10px;margin-bottom:20px;font-size:11px">
          <strong>Notes:</strong> ${grn.notes}
        </div>` : ""}

        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#777;margin-bottom:8px;letter-spacing:1px">Received Line Items</div>
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="background:#f0f0f0;border-bottom:1px solid #ccc">
              <th style="text-align:left;padding:8px 10px;font-weight:700">Item Name</th>
              <th style="text-align:left;padding:8px 10px;font-weight:700">UOM</th>
              <th style="text-align:right;padding:8px 10px;font-weight:700">PO Ordered</th>
              <th style="text-align:right;padding:8px 10px;font-weight:700">Delivered Qty</th>
              <th style="text-align:center;padding:8px 10px;font-weight:700">Variance</th>
              <th style="text-align:left;padding:8px 10px;font-weight:700">Supplier Lot #</th>
              <th style="text-align:left;padding:8px 10px;font-weight:700">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            ${grn.items.map((item, i) => `
              <tr style="border-bottom:1px solid #eee;background:${i % 2 === 0 ? "#fff" : "#fafafa"}">
                <td style="padding:8px 10px;font-weight:500">${item.itemName}</td>
                <td style="padding:8px 10px;color:#555">${item.purchaseUomName}</td>
                <td style="padding:8px 10px;text-align:right;font-family:monospace">${item.orderedQuantity.toLocaleString()}</td>
                <td style="padding:8px 10px;text-align:right;font-family:monospace;font-weight:700">${item.deliveredQuantity.toLocaleString()}</td>
                <td style="padding:8px 10px;text-align:center;font-family:monospace">
                  ${item.varianceType === "Short" ? `Short (${item.varianceQuantity})` : item.varianceType === "Over" ? `Over (+${item.varianceQuantity})` : "Match"}
                </td>
                <td style="padding:8px 10px;font-family:monospace;color:#555">${item.supplierLotCode || "—"}</td>
                <td style="padding:8px 10px;color:#555">${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div style="margin-top:40px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px">
          <div style="border-top:1px solid #999;padding-top:8px;text-align:center;font-size:11px">
            <div style="color:#777">Received By / Signature</div>
            <div style="margin-top:4px;font-weight:600">${grn.receivedBy}</div>
          </div>
          <div style="border-top:1px solid #999;padding-top:8px;text-align:center;font-size:11px">
            <div style="color:#777">QA Officer / Signature</div>
            <div style="margin-top:4px">&nbsp;</div>
          </div>
          <div style="border-top:1px solid #999;padding-top:8px;text-align:center;font-size:11px">
            <div style="color:#777">Authorized By / Signature</div>
            <div style="margin-top:4px">&nbsp;</div>
          </div>
        </div>

        <div style="margin-top:24px;font-size:10px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:10px">
          This document is a system-generated Goods Receipt Note. GRN: ${grn.grnNumber} · ${receivedDate}
        </div>
      </div>
    `;

    window.print();

    // Cleanup after print dialog
    setTimeout(() => {
      const el = document.getElementById("grn-print-root");
      if (el) el.remove();
      const styleEl = document.getElementById("__grn-print-style");
      if (styleEl) styleEl.remove();
    }, 1000);
  };

  return (
    <ModalWrapper open={open} title={`Goods Receipt Note — ${grn.grnNumber}`} onClose={onClose} size="max-w-4xl">
      <div className="space-y-6 text-foreground">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3">
            {error}
          </div>
        )}

        {/* HEADER SUMMARY */}
        <div className="bg-muted/20 border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">PR Number</div>
            <div className="text-sm font-semibold mt-0.5">{grn.prNumber || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Purchase Order</div>
            <div className="text-sm font-semibold mt-0.5">{grn.poNumber}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Delivery Number</div>
            <div className="text-sm font-semibold mt-0.5">{grn.deliveryNumber || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Supplier</div>
            <div className="text-sm font-semibold mt-0.5 truncate" title={grn.supplierName}>{grn.supplierName}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Status</div>
            <div className="mt-1">
              <StatusBadge status={grn.status} />
            </div>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground">Received Date</div>
            <div className="font-medium mt-0.5">{new Date(grn.receivedDate).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Supplier DR #</div>
            <div className="font-medium mt-0.5">{grn.supplierDrNumber || "N/A"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Supplier Invoice #</div>
            <div className="font-medium mt-0.5">{grn.supplierInvoiceNumber || "N/A"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Receiving Bay</div>
            <div className="font-medium mt-0.5">{grn.receivingBay || "Bay 1"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Carrier / Truck</div>
            <div className="font-medium mt-0.5">{grn.carrier || "N/A"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Received By</div>
            <div className="font-medium mt-0.5">{grn.receivedBy}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Created At</div>
            <div className="font-medium mt-0.5">{new Date(grn.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Posted By</div>
            <div className="font-medium mt-0.5">{grn.postedBy || (isDraft ? "Not posted" : "System")}</div>
          </div>
        </div>

        {grn.notes && (
          <div className="bg-muted/30 border border-border rounded-xl p-3 text-xs">
            <span className="font-semibold text-foreground mr-2">Dock Notes:</span>
            <span className="text-muted-foreground">{grn.notes}</span>
          </div>
        )}

        {/* ITEMS TABLE */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Received Line Items
          </div>
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 uppercase text-muted-foreground font-semibold tracking-wide border-b border-border">
                <tr>
                  <th className="p-3">Item Name</th>
                  <th className="p-3 text-right">PO Ordered</th>
                  <th className="p-3 text-right">Delivered Qty</th>
                  <th className="p-3 text-center">Variance</th>
                  <th className="p-3">Supplier Lot #</th>
                  <th className="p-3">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grn.items.map((item) => (
                  <tr key={item.grnItemId} className="hover:bg-muted/30">
                    <td className="p-3 font-medium">
                      <div>{item.itemName}</div>
                      <div className="text-[10px] text-muted-foreground">{item.purchaseUomName}</div>
                    </td>
                    <td className="p-3 text-right font-mono">{item.orderedQuantity.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-semibold">{item.deliveredQuantity.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      {item.varianceType === "Short" ? (
                        <span className="text-[11px] font-semibold text-foreground bg-muted/60 border border-border px-2 py-0.5 rounded">
                          Short ({item.varianceQuantity})
                        </span>
                      ) : item.varianceType === "Over" ? (
                        <span className="text-[11px] font-semibold text-foreground bg-muted/60 border border-border px-2 py-0.5 rounded">
                          Over (+{item.varianceQuantity})
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-muted-foreground">Match</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground font-mono">{item.supplierLotCode || "—"}</td>
                    <td className="p-3 text-muted-foreground">
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-between items-center gap-3 pt-4 border-t border-border mt-4">
          <div className="flex items-center gap-2">
            {/* Print button — always visible */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Printer className="w-4 h-4" /> Print GRN
            </button>

            {/* Cancel draft button */}
            {isDraft && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-4 py-2.5 text-sm font-semibold hover:bg-destructive/20 transition-colors disabled:opacity-50"
              >
                Cancel Draft
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Close
            </button>

            {/* Post GRN — primary action for Draft */}
            {isDraft && (
              <button
                type="button"
                onClick={handlePost}
                disabled={loading}
                className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? "Posting…" : "Post GRN"}
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
