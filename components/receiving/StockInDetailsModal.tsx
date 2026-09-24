"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Download, Tag, CheckCircle2, ShieldCheck } from "lucide-react";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { StockIn, StockInLine } from "./types";

interface Props {
  stockIn: StockIn | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockInDetailsModal({ stockIn, open, onClose, onSuccess }: Props) {
  const { user, isAdmin } = useAuth();
  const [approverName, setApproverName] = useState("System Admin");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rejection dialog
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (user) {
      const name =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.username || "System Admin";
      setApproverName(name);
    }
  }, [user]);

  if (!stockIn) return null;

  const isPending = stockIn.status === "PendingApproval" || stockIn.status === "Pending";
  const isDraft = stockIn.status === "Draft";
  const isApproved = stockIn.status === "Approved";
  const isCommitted = stockIn.status === "Committed";
  const isRejected = stockIn.status === "Rejected";

  const handleApprove = async () => {
    if (!approverName.trim()) {
      setError("Please provide the Approver Name.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/api/StockIns/${stockIn.stockInId}/approve`, {
        approverName: approverName.trim(),
        notes: approvalNotes.trim() || undefined,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to approve Stock-In.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to approve Stock-In.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    setError(null);
    try {
      const res = await api.post(`/api/StockIns/${stockIn.stockInId}/commit`, {
        committerName: approverName.trim() || undefined,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to commit Stock-In to inventory.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to commit Stock-In to inventory.");
    } finally {
      setCommitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please enter a rejection reason.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/api/StockIns/${stockIn.stockInId}/reject`, {
        rejectionReason: rejectionReason.trim(),
        rejectedBy: approverName.trim() || undefined,
        notes: approvalNotes.trim() || undefined,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to reject Stock-In.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to reject Stock-In.");
    } finally {
      setSubmitting(false);
      setShowRejectBox(false);
    }
  };

  const handleSubmitDraft = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/api/StockIns/${stockIn.stockInId}/submit`);
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to submit Stock-In.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to submit Stock-In.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to extract SVG markup for a line
  const getLineSvgHtml = (lineId: number) => {
    const el = document.getElementById(`stockin-qr-svg-${lineId}`);
    return el ? el.outerHTML : "";
  };

  // Build single label HTML
  const buildSingleLabelHtml = (line: StockInLine) => {
    const svgHtml = getLineSvgHtml(line.stockInLineId);
    return `
      <div style="width:360px;margin:0 auto 20px auto;border:2px solid #000;border-radius:10px;padding:16px;font-family:sans-serif;color:#111;page-break-after:always;background:#fff;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px;">
          <div>
            <div style="font-size:13px;font-weight:900;letter-spacing:0.5px;text-transform:uppercase;">COMMISSARY INVENTORY LABEL</div>
            <div style="font-size:10px;color:#555;">Receiving Lot Traceability Tag</div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:monospace;font-size:11px;font-weight:800;">${stockIn.stockInNumber}</div>
            <div style="font-size:9px;color:#777;">GRN: ${stockIn.grnNumber}</div>
          </div>
        </div>

        <div style="margin-bottom:8px;">
          <div style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase;">Supply / Ingredient Name</div>
          <div style="font-size:14px;font-weight:800;color:#000;">${line.itemName}</div>
          ${line.itemCode ? `<div style="font-size:10px;font-family:monospace;color:#555;">Code: ${line.itemCode}</div>` : ""}
        </div>

        <div style="display:flex;gap:12px;margin-bottom:8px;">
          <div style="flex:1;">
            <div style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase;">Supplier</div>
            <div style="font-size:11px;font-weight:700;">${stockIn.supplierName || "—"}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase;">Quantity & UOM</div>
            <div style="font-size:12px;font-weight:800;color:#000;">${line.quantityToStock} ${line.purchaseUomName}</div>
          </div>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:12px;padding:8px;background:#f5f5f5;border-radius:6px;">
          <div style="flex:1;">
            <div style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase;">Lot Number</div>
            <div style="font-family:monospace;font-size:12px;font-weight:800;color:#000;">${line.lotCode}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase;">Expiry Date</div>
            <div style="font-family:monospace;font-size:12px;font-weight:800;color:#000;">${
              line.expiryDate ? new Date(line.expiryDate).toLocaleDateString() : "N/A"
            }</div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;border-top:1px dashed #bbb;padding-top:10px;">
          <div style="margin-bottom:4px;">${svgHtml}</div>
          <div style="font-family:monospace;font-size:9px;color:#666;">Scan for lot & expiry verification</div>
        </div>
      </div>
    `;
  };

  // Download individual label HTML
  const handleDownloadLabel = (line: StockInLine) => {
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Lot Label - ${line.lotCode}</title>
  <style>
    body { margin: 20px; background: #fafafa; }
    @media print {
      body { margin: 0; background: #fff; }
    }
  </style>
</head>
<body>
  ${buildSingleLabelHtml(line)}
</body>
</html>`;

    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Label-${line.lotCode || line.stockInLineId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print all labels or single label
  const handlePrintLabels = (targetLine?: StockInLine) => {
    const linesToPrint = targetLine ? [targetLine] : stockIn.lines;
    const bodyHtml = linesToPrint.map((l) => buildSingleLabelHtml(l)).join("");

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) {
      alert("Please allow popups to print labels.");
      return;
    }

    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Print Labels — ${stockIn.stockInNumber}</title>
  <style>
    body { font-family: sans-serif; margin: 20px; background: #fff; }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  ${bodyHtml}
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <ModalWrapper
      open={open}
      title={`Stock-In Details — ${stockIn.stockInNumber}`}
      onClose={onClose}
      size="max-w-5xl"
    >
      <div className="space-y-5 text-foreground">
        {/* Hidden QR Code SVGs for print/download extraction */}
        <div className="hidden" aria-hidden="true">
          {stockIn.lines.map((line) => {
            const qrPayload = JSON.stringify({
              stockIn: stockIn.stockInNumber,
              grn: stockIn.grnNumber,
              supply: line.itemName,
              supplier: stockIn.supplierName,
              lot: line.lotCode,
              expiry: line.expiryDate ? line.expiryDate.split("T")[0] : "N/A",
              qty: line.quantityToStock,
              uom: line.purchaseUomName,
            });
            return (
              <div key={line.stockInLineId}>
                <QRCodeSVG
                  id={`stockin-qr-svg-${line.stockInLineId}`}
                  value={qrPayload}
                  size={100}
                  level="M"
                />
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs text-destructive flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="font-bold text-xs hover:underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header Summary */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold text-foreground">
                {stockIn.stockInNumber}
              </span>
              <StatusBadge status={stockIn.status} />
            </div>
            {(isApproved || isCommitted) && (
              <button
                type="button"
                onClick={() => handlePrintLabels()}
                className="px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-xs"
              >
                <span>Print All Labels</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">GRN Reference</span>
              <span className="font-semibold text-foreground">{stockIn.grnNumber}</span>
            </div>
            {stockIn.supplierName && stockIn.supplierName !== "—" && (
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Supplier</span>
                <span className="font-semibold text-foreground">{stockIn.supplierName}</span>
              </div>
            )}
            {stockIn.poNumber && stockIn.poNumber !== "—" && (
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Purchase Order</span>
                <span className="font-semibold text-foreground">{stockIn.poNumber}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Created Date</span>
              <span className="font-semibold text-foreground">
                {new Date(stockIn.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {stockIn.approvedBy && (
            <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center gap-2 text-xs text-foreground font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>
                Approved by <strong>{stockIn.approvedBy}</strong> on{" "}
                {stockIn.approvedAt ? new Date(stockIn.approvedAt).toLocaleDateString() : ""}
              </span>
            </div>
          )}

          {stockIn.committedBy && (
            <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-2 text-xs text-foreground font-medium">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>
                Committed to Inventory by <strong>{stockIn.committedBy}</strong> on{" "}
                {stockIn.committedAt ? new Date(stockIn.committedAt).toLocaleDateString() : ""}
              </span>
            </div>
          )}

          {isRejected && (
            <div className="mt-3 pt-2.5 border-t border-border/60 text-xs text-foreground space-y-1">
              <div className="font-semibold">
                Rejected by {stockIn.rejectedBy || "Admin"}
              </div>
              <div>
                <strong>Reason:</strong> {stockIn.rejectionReason}
              </div>
            </div>
          )}
        </div>


        {/* Lines Table */}
        <div className="space-y-2">
          <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground block">
            Ingredients & Traceability Lots
          </span>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Supply Name</th>
                  <th className="px-3 py-3 text-center">UOM</th>
                  <th className="px-3 py-3 text-right">Stocked Qty</th>
                  <th className="px-3 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3">Lot No.</th>
                  <th className="px-3 py-3 text-center">Expiry Date</th>
                  {(isApproved || isCommitted) && (
                    <th className="px-4 py-3 text-center">Printable Tag</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockIn.lines.map((line) => (
                  <tr key={line.stockInLineId} className="hover:bg-muted/15 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div>{line.itemName}</div>
                      {line.itemCode && (
                        <div className="text-[10px] font-mono text-muted-foreground">{line.itemCode}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {line.purchaseUomName}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-foreground">
                      {line.quantityToStock}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                      {line.currentStockBeforeCommit}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground whitespace-nowrap">
                      {line.lotCode}
                    </td>
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {line.expiryDate ? new Date(line.expiryDate).toLocaleDateString() : "—"}
                    </td>
                    {(isApproved || isCommitted) && (
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="Print Label"
                            onClick={() => handlePrintLabels(line)}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Download HTML Label"
                            onClick={() => handleDownloadLabel(line)}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


        {/* Admin Review / Approval Gate (ONLY visible to Admin account when Pending) */}
        {isPending && isAdmin && !showRejectBox && (
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin Approval Review
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-foreground">Approver Name *</span>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-foreground">Approval Notes</span>
                <input
                  type="text"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Optional approval notes..."
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectBox(true)}
                className="rounded-xl border border-border bg-card text-foreground hover:bg-muted px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleApprove}
                className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 transition-colors shadow-sm"
              >
                {submitting ? "Approving…" : "Approve Stock-In"}
              </button>
            </div>
          </div>
        )}

        {/* Reject Box Prompt (Admin only) */}
        {showRejectBox && isAdmin && (
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 text-xs">
            <div className="font-semibold text-foreground text-sm">
              Confirm Stock-In Rejection
            </div>
            <label className="block space-y-1">
              <span className="font-semibold text-foreground">Rejection Reason *</span>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                placeholder="State the reason for rejecting this stock-in request..."
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectBox(false)}
                disabled={submitting}
                className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || submitting}
                onClick={handleReject}
                className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {submitting ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div>
            {isDraft && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitDraft}
                className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {submitting ? "Submitting…" : "Submit for Admin Approval"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || committing}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Close
            </button>
            {isApproved && (
              <button
                type="button"
                disabled={committing}
                onClick={handleCommit}
                className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
              >
                {committing ? "Committing…" : "Commit to Inventory"}
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
