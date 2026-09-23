"use client";

import React, { useState } from "react";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import { Discrepancy } from "./types";

interface DiscrepancyDetailsModalProps {
  discrepancy: Discrepancy | null;
  open: boolean;
  onClose: () => void;
  onResolved: () => void;
}

export default function DiscrepancyDetailsModal({
  discrepancy,
  open,
  onClose,
  onResolved,
}: DiscrepancyDetailsModalProps) {
  const [activeForm, setActiveForm] = useState<"none" | "loss" | "rtv" | "resolve">("none");
  const [resolutionType, setResolutionType] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Loss Report form state
  const [lossReason, setLossReason] = useState("");
  const [lossNotes, setLossNotes] = useState("");
  const [lossAuthorisedBy, setLossAuthorisedBy] = useState("Warehouse QA Manager");

  // RTV form state
  const [rtvReason, setRtvReason] = useState("");
  const [rtvCarrier, setRtvCarrier] = useState("");
  const [rtvNotes, setRtvNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!discrepancy) return null;

  const isResolved = discrepancy.status === "Resolved" || discrepancy.status === "Closed";

  const handleResolveDirect = async (type: string, defaultNotes: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/api/Discrepancies/${discrepancy.discrepancyId}/resolve`, {
        resolutionType: type,
        resolutionNotes: resolutionNotes || defaultNotes,
      });
      if (res.data?.success) {
        onResolved();
        onClose();
      } else {
        setError(res.data?.message || "Failed to resolve discrepancy.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to resolve discrepancy.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLossReport = async () => {
    if (!lossReason.trim()) {
      setError("Please state the reason for writing off as a loss.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/api/Discrepancies/${discrepancy.discrepancyId}/loss-report`, {
        reason: lossReason.trim(),
        notes: lossNotes.trim() || undefined,
        authorisedBy: lossAuthorisedBy.trim(),
      });
      if (res.data?.success) {
        onResolved();
        onClose();
      } else {
        setError(res.data?.message || "Failed to create Loss Report.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to create Loss Report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRtv = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/api/Discrepancies/${discrepancy.discrepancyId}/return-to-supplier`, {
        reason: rtvReason.trim() || `Return arising from Discrepancy ${discrepancy.discrepancyNumber}`,
        carrier: rtvCarrier.trim() || undefined,
        notes: rtvNotes.trim() || undefined,
      });
      if (res.data?.success) {
        onResolved();
        onClose();
      } else {
        setError(res.data?.message || "Failed to create Return to Supplier.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to create Return to Supplier.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      open={open}
      title={`Discrepancy Report - ${discrepancy.discrepancyNumber}`}
      onClose={onClose}
      size="max-w-4xl"
    >
      <div className="space-y-6 text-foreground">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3">
            {error}
          </div>
        )}

        {/* TRACEABILITY BANNER */}
        <div className="bg-muted/20 border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-6 gap-4">
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Type</div>
            <div className="text-sm font-semibold mt-0.5">
              {discrepancy.discrepancyType === "PartialShort"
                ? "Partial / Short Delivery"
                : discrepancy.discrepancyType === "OverSupply"
                ? "Over Supply"
                : "Rejected in QA"}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Source GRN</div>
            <div className="text-sm font-semibold mt-0.5">{discrepancy.grnNumber}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Purchase Order</div>
            <div className="text-sm font-semibold mt-0.5">{discrepancy.poNumber}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Product Requisition</div>
            <div className="text-sm font-semibold mt-0.5">{discrepancy.prNumber || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Supplier</div>
            <div className="text-sm font-semibold mt-0.5 truncate" title={discrepancy.supplierName}>{discrepancy.supplierName || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Status</div>
            <div className="mt-1">
              <StatusBadge status={discrepancy.status} />
            </div>
          </div>
        </div>

        {/* QUANTITY & ITEM BREAKDOWN */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-card border border-border rounded-xl p-4 text-xs">
          <div>
            <div className="text-muted-foreground">Item Name</div>
            <div className="font-semibold text-sm text-foreground mt-0.5">{discrepancy.itemName}</div>
          </div>
          <div>
            <div className="text-muted-foreground">PO Ordered Qty</div>
            <div className="font-mono font-medium mt-0.5">{discrepancy.orderedQuantity.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Actual Received Qty</div>
            <div className="font-mono font-medium mt-0.5">{discrepancy.currentReceivedQty.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Discrepancy Quantity</div>
            <div className="font-mono font-bold text-sm mt-0.5 text-foreground">
              {discrepancy.discrepancyType === "OverSupply" ? "+" : "-"}
              {discrepancy.discrepancyQuantity.toLocaleString()}
            </div>
          </div>
        </div>

        {/* RESOLUTION HISTORY / STATUS */}
        {isResolved ? (
          <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2 text-xs">
            <div className="font-semibold uppercase tracking-wide text-foreground">Resolution Details</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-muted-foreground">Action Taken:</span>{" "}
                <span className="font-medium text-foreground">{discrepancy.resolutionType || "Resolved"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Resolved By:</span>{" "}
                <span className="font-medium text-foreground">{discrepancy.resolvedBy || "System"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Resolved At:</span>{" "}
                <span className="font-medium text-foreground">
                  {discrepancy.resolvedAt ? new Date(discrepancy.resolvedAt).toLocaleString() : "—"}
                </span>
              </div>
            </div>
            {discrepancy.lossReportNumber && (
              <div className="pt-2 text-foreground font-mono">
                Loss Report: <strong>{discrepancy.lossReportNumber}</strong>
              </div>
            )}
            {discrepancy.rtvNumber && (
              <div className="pt-2 text-foreground font-mono">
                Return to Vendor: <strong>{discrepancy.rtvNumber}</strong>
              </div>
            )}
            {discrepancy.resolutionNotes && (
              <div className="text-muted-foreground pt-1 italic">"{discrepancy.resolutionNotes}"</div>
            )}
          </div>
        ) : (
          /* ACTION SECTIONS FOR OPEN DISCREPANCY */
          <div className="border-t border-border pt-4 space-y-4">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Discrepancy Resolution Options
            </div>

            {/* FORM: CREATE LOSS REPORT */}
            {activeForm === "loss" && (
              <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
                <div className="font-semibold text-xs text-foreground uppercase tracking-wide">
                  Generate Loss Report (LR-YYYY-NNNN)
                </div>
                <p className="text-xs text-muted-foreground">
                  Goods will be permanently written off via Stock Ledger disposal. Quantity removed from inventory.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Reason for Write-Off *</label>
                    <input
                      type="text"
                      placeholder="e.g. Supplier confirmed cannot supply balance / Goods destroyed"
                      value={lossReason}
                      onChange={(e) => setLossReason(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Authorised By *</label>
                    <input
                      type="text"
                      value={lossAuthorisedBy}
                      onChange={(e) => setLossAuthorisedBy(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Additional Notes</label>
                    <input
                      type="text"
                      placeholder="Optional notes or reference document"
                      value={lossNotes}
                      onChange={(e) => setLossNotes(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveForm("none")}
                    className="border border-border bg-card text-foreground rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateLossReport}
                    disabled={submitting}
                    className="bg-foreground text-background rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-foreground/85"
                  >
                    {submitting ? "Writing Off..." : "Confirm Loss Report"}
                  </button>
                </div>
              </div>
            )}

            {/* FORM: RETURN TO SUPPLIER */}
            {activeForm === "rtv" && (
              <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
                <div className="font-semibold text-xs text-foreground uppercase tracking-wide">
                  Request Return to Supplier (RTV-YYYY-NNNN)
                </div>
                <p className="text-xs text-muted-foreground">
                  Creates an official return shipment request submitted for administrator approval prior to dispatch.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Reason for Return</label>
                    <input
                      type="text"
                      placeholder="e.g. Failed incoming QA specifications / Rejected lot"
                      value={rtvReason}
                      onChange={(e) => setRtvReason(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Carrier / Courier (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. DHL / Supplier Pickup"
                      value={rtvCarrier}
                      onChange={(e) => setRtvCarrier(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Approval Request Notes</label>
                    <input
                      type="text"
                      placeholder="Notes for administrator approval or vendor RMA number"
                      value={rtvNotes}
                      onChange={(e) => setRtvNotes(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveForm("none")}
                    className="border border-border bg-card text-foreground rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateRtv}
                    disabled={submitting}
                    className="bg-foreground text-background rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-foreground/85"
                  >
                    {submitting ? "Submitting..." : "Submit Return Request"}
                  </button>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS (when no sub-form active) */}
            {activeForm === "none" && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {discrepancy.discrepancyType === "PartialShort" && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleResolveDirect(
                          "NewDelivery",
                          "Supplier notified to deliver remaining shortage on next shipment."
                        )
                      }
                      className="border border-border bg-card text-foreground rounded-xl px-4 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      Wait for Next Delivery
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleResolveDirect(
                          "CloseRemaining",
                          "Accepted partial delivery. Remaining shortage is closed and not expected."
                        )
                      }
                      className="border border-border bg-card text-foreground rounded-xl px-4 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      Close Remaining (Accept Partial)
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveForm("loss")}
                      className="bg-foreground text-background rounded-xl px-4 py-2 text-xs font-semibold hover:bg-foreground/85"
                    >
                      Create Loss Report (Write Off)
                    </button>
                  </>
                )}

                {discrepancy.discrepancyType === "Rejected" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveForm("rtv")}
                      className="bg-foreground text-background rounded-xl px-4 py-2 text-xs font-semibold hover:bg-foreground/85"
                    >
                      Request Return to Supplier (RTV)
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveForm("loss")}
                      className="border border-border bg-card text-foreground rounded-xl px-4 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      Create Loss Report (Dispose)
                    </button>
                  </>
                )}

                {discrepancy.discrepancyType === "OverSupply" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveForm("rtv")}
                      className="bg-foreground text-background rounded-xl px-4 py-2 text-xs font-semibold hover:bg-foreground/85"
                    >
                      Request Return Excess (RTV)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleResolveDirect(
                          "KeepWithCredit",
                          "Accepted excess inventory; credit note or adjusted invoice applied."
                        )
                      }
                      className="border border-border bg-card text-foreground rounded-xl px-4 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      Keep (With Credit Note)
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* CLOSE BUTTON */}
        <div className="flex justify-end pt-4 border-t border-border mt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
