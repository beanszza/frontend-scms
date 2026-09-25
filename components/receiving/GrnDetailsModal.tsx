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
        setError(res.data?.message || "Failed to post Goods Receipt Note.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to post Goods Receipt Note.");
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
        setError(res.data?.message || "Failed to cancel Goods Receipt Note.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to cancel Goods Receipt Note.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const receivedDate = new Date(grn.receivedDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
      const printedAt = new Date().toLocaleString("en-PH");

      const doc = new jsPDF({ format: "a4", orientation: "portrait" });

      doc.setFontSize(18);
      doc.text("GOODS RECEIPT NOTE", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Commissary / Warehouse Inbound Document", 14, 28);

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(grn.grnNumber, 196, 22, { align: "right" });

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Status: ${grn.status}`, 196, 28, { align: "right" });
      doc.text(`Exported: ${printedAt}`, 196, 33, { align: "right" });

      // Info box
      doc.setDrawColor(200);
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 40, 182, 35, "FD");

      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text(`Supplier: ${grn.supplierName}`, 18, 47);
      doc.text(`Purchase Order Number: ${grn.poNumber}`, 18, 54);
      doc.text(`Purchase Requisition Reference: ${grn.prNumber || "—"}`, 18, 61);
      doc.text(`Delivery No.: ${grn.deliveryNumber || "—"}`, 18, 68);

      doc.text(`Received Date: ${receivedDate}`, 105, 47);
      doc.text(`Receiving Bay: ${grn.receivingBay || "Main Receiving Bay"}`, 105, 54);
      doc.text(`Supplier DR #: ${grn.supplierDrNumber || "N/A"}`, 105, 61);
      doc.text(`Supplier Invoice #: ${grn.supplierInvoiceNumber || "N/A"}`, 105, 68);

      // Table
      const tableData = grn.items.map((item) => {
        const variance = item.varianceType === "Short"
          ? `Short (${item.varianceQuantity})`
          : item.varianceType === "Over"
            ? `Over (+${item.varianceQuantity})`
            : "Match";

        const expiry = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "—";

        return [
          item.itemName,
          item.purchaseUomName,
          item.orderedQuantity,
          item.deliveredQuantity,
          variance,
          item.supplierLotCode || "—",
          expiry
        ];
      });

      autoTable(doc, {
        startY: 85,
        head: [["Item Name", "Unit of Measure", "Purchase Order Quantity", "Delivered Quantity", "Variance", "Supplier Lot #", "Expiry Date"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [244, 244, 245], textColor: 0, fontStyle: "bold" },
      });

      let finalY = (doc as any).lastAutoTable.finalY + 15;

      if (grn.notes) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, finalY, 182, 15, "FD");
        doc.text(`Notes: ${grn.notes}`, 18, finalY + 9);
        finalY += 25;
      }

      // Signatures
      finalY += 20;
      doc.setFontSize(9);
      doc.text("Received By / Signature:", 14, finalY);
      doc.line(14, finalY + 15, 64, finalY + 15);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(grn.receivedBy, 14, finalY + 20);

      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text("Quality Assurance Officer / Signature:", 75, finalY);
      doc.line(75, finalY + 15, 125, finalY + 15);

      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text("Authorized By / Signature:", 136, finalY);
      doc.line(136, finalY + 15, 196, finalY + 15);

      if (grn.postedBy) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(grn.postedBy, 136, finalY + 20);
      }

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`This document is a system-generated Goods Receipt Note: ${grn.grnNumber} · ${receivedDate}`, 105, finalY + 40, { align: "center" });

      doc.save(`${grn.grnNumber}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    }
  };

  return (
    <ModalWrapper open={open} title={`Goods Receipt Note — ${grn.grnNumber}`} onClose={onClose} size="max-w-4xl">
      <div className="space-y-6 text-foreground">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3">
            {error}
          </div>
        )}

        {/* HEADER SUMMARY CARD */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs space-y-3">
          {/* Top Badge & Number Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold text-foreground">
                {grn.grnNumber}
              </span>
              <StatusBadge status={grn.status} />
            </div>
          </div>

          {/* Reference Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Purchase Requisition Number</span>
              <span className="font-mono font-semibold text-foreground">{grn.prNumber || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Purchase Order Number</span>
              <span className="font-mono font-semibold text-foreground">{grn.poNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Delivery Number</span>
              <span className="font-mono font-semibold text-foreground">{grn.deliveryNumber || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Supplier</span>
              <span className="font-semibold text-foreground truncate block" title={grn.supplierName}>
                {grn.supplierName}
              </span>
            </div>
          </div>

          {/* Logistics & Personnel Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2.5 border-t border-border/60">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Received Date</span>
              <span className="font-medium text-foreground">
                {new Date(grn.receivedDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Received By</span>
              <span className="font-medium text-foreground">{grn.receivedBy || "Warehouse Staff"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Receiving Bay</span>
              <span className="font-medium text-foreground">{grn.receivingBay || "Main Bay"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Posted By</span>
              <span className="font-medium text-foreground">{grn.postedBy || (isDraft ? "Not Posted" : "System")}</span>
            </div>
          </div>

          {(grn.supplierDrNumber || grn.supplierInvoiceNumber || grn.carrier) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2.5 border-t border-border/60 text-muted-foreground">
              {grn.supplierDrNumber && grn.supplierDrNumber !== "N/A" && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Supplier DR #</span>
                  <span className="font-mono text-foreground">{grn.supplierDrNumber}</span>
                </div>
              )}
              {grn.supplierInvoiceNumber && grn.supplierInvoiceNumber !== "N/A" && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Supplier Invoice #</span>
                  <span className="font-mono text-foreground">{grn.supplierInvoiceNumber}</span>
                </div>
              )}
              {grn.carrier && grn.carrier !== "N/A" && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">Carrier / Vehicle</span>
                  <span className="text-foreground">{grn.carrier}</span>
                </div>
              )}
            </div>
          )}

          {grn.notes && (
            <div className="pt-2 border-t border-border/60 text-xs">
              <span className="font-bold text-foreground mr-1.5">Dock Notes:</span>
              <span className="text-muted-foreground">{grn.notes}</span>
            </div>
          )}
        </div>

        {/* WORKFLOW STATUS BANNER */}
        {grn.status === "Received" && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-foreground rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <div>
                <div className="font-semibold text-foreground">Awaiting Quality Assurance Inspection</div>
                <div className="text-muted-foreground text-[11px] mt-0.5">
                  Warehouse Put Away tasks and inventory lot codes will be generated automatically once incoming inspection is completed in the QA Tab.
                </div>
              </div>
            </div>
          </div>
        )}

        {(grn.status === "QaCompleted" || grn.status === "PartiallyPutAway" || grn.status === "FullyPutAway") && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-foreground rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <div className="font-semibold text-foreground">Quality Assurance Inspection Completed</div>
                <div className="text-muted-foreground text-[11px] mt-0.5">
                  Accepted items have been queued for warehouse Put Away. View assigned storage locations in the Put Away tab.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ITEMS TABLE */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Received Line Items
          </div>
          <div className="overflow-x-auto border border-border rounded-xl bg-card">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/30 uppercase text-muted-foreground font-bold tracking-wider text-[11px] border-b border-border">
                <tr>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-3 py-3 text-center">Unit of Measure</th>
                  <th className="px-3 py-3 text-right">Purchase Order Ordered</th>
                  <th className="px-3 py-3 text-right">Delivered Qty</th>
                  <th className="px-3 py-3 text-center">Variance</th>
                  <th className="px-4 py-3">Supplier Lot #</th>
                  <th className="px-3 py-3 text-center">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grn.items.map((item) => (
                  <tr key={item.grnItemId} className="hover:bg-muted/15 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div>{item.itemName}</div>
                    </td>
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {item.purchaseUomName}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                      {item.orderedQuantity.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-foreground">
                      {item.deliveredQuantity.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-center font-mono">
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
                    <td className="px-4 py-3 text-foreground font-mono text-xs whitespace-nowrap">
                      {item.supplierLotCode || "—"}
                    </td>
                    <td className="px-3 py-3 text-center text-muted-foreground whitespace-nowrap">
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER ACTIONS - Lower right corner */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border">
          {/* Cancel draft button */}
          {isDraft && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-5 py-2.5 text-sm font-semibold hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Cancelling…" : "Cancel Draft"}
            </button>
          )}

          {/* Print button without logo */}
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Goods Receipt Note
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>

          {/* Post GRN — primary action for Draft */}
          {isDraft && (
            <button
              type="button"
              onClick={handlePost}
              disabled={loading}
              className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Posting…" : "Post Goods Receipt Note"}
            </button>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
