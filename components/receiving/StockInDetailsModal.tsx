"use client";

import React, { useState, useEffect } from "react";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { StockIn } from "./types";

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

  return (
    <ModalWrapper
      open={open}
      title={`Stock-In Details — ${stockIn.stockInNumber}`}
      onClose={onClose}
      size="max-w-5xl"
    >
      <div className="space-y-5 text-foreground">
        {error && (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-foreground flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-foreground font-bold text-xs hover:underline ml-2"
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
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">GRN Reference</span>
              <span className="font-semibold text-foreground">{stockIn.grnNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Supplier</span>
              <span className="font-semibold text-foreground">{stockIn.supplierName}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Purchase Order</span>
              <span className="font-semibold text-foreground">{stockIn.poNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Created Date</span>
              <span className="font-semibold text-foreground">
                {new Date(stockIn.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {stockIn.approvedBy && (
            <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center gap-2 text-xs text-foreground font-medium">
              <span>
                Approved by <strong>{stockIn.approvedBy}</strong> on{" "}
                {stockIn.approvedAt ? new Date(stockIn.approvedAt).toLocaleDateString() : ""}
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
            Items
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockIn.lines.map((line) => (
                  <tr key={line.stockInLineId} className="hover:bg-muted/15 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {line.itemName}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Review / Approval Gate (ONLY visible to Admin account) */}
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
                {submitting ? "Approving…" : "Approve & Commit Stock"}
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
                className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || submitting}
                onClick={handleReject}
                className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 disabled:opacity-40"
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
                className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 transition-colors shadow-sm"
              >
                {submitting ? "Submitting…" : "Submit for Admin Approval"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
