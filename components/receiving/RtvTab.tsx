"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import Pagination from "@/components/Pagination";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import { RtvRecord } from "./types";

export default function RtvTab() {
  const [rtvs, setRtvs] = useState<RtvRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals for actions
  const [rejectingRtv, setRejectingRtv] = useState<RtvRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [dispatchingRtv, setDispatchingRtv] = useState<RtvRecord | null>(null);
  const [creditNoteNumber, setCreditNoteNumber] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRtvs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/ReturnToVendors");
      if (res.data?.success) {
        setRtvs(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching RTVs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRtvs();
  }, [fetchRtvs]);

  const handleApprove = async (rtv: RtvRecord) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.post(`/api/ReturnToVendors/${rtv.rtvId}/approve`);
      if (res.data?.success) {
        await fetchRtvs();
      } else {
        setActionError(res.data?.message || "Failed to approve return request.");
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to approve return request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRtv) return;
    if (!rejectionReason.trim()) {
      setActionError("Please provide a reason for rejecting this return request.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.post(`/api/ReturnToVendors/${rejectingRtv.rtvId}/reject`, {
        reason: rejectionReason.trim(),
      });
      if (res.data?.success) {
        setRejectingRtv(null);
        setRejectionReason("");
        await fetchRtvs();
      } else {
        setActionError(res.data?.message || "Failed to reject return request.");
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to reject return request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchingRtv) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.post(`/api/ReturnToVendors/${dispatchingRtv.rtvId}/dispatch`, {
        creditNoteNumber: creditNoteNumber.trim() || undefined,
      });
      if (res.data?.success) {
        setDispatchingRtv(null);
        setCreditNoteNumber("");
        await fetchRtvs();
      } else {
        setActionError(res.data?.message || "Failed to dispatch return shipment.");
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to dispatch return shipment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return rtvs;
    const s = search.toLowerCase();
    return rtvs.filter((r) => {
      return (
        r.rtvNumber?.toLowerCase().includes(s) ||
        r.ncrNumber?.toLowerCase().includes(s) ||
        r.discrepancyNumber?.toLowerCase().includes(s) ||
        r.grnNumber?.toLowerCase().includes(s) ||
        r.poNumber?.toLowerCase().includes(s) ||
        r.supplierName?.toLowerCase().includes(s) ||
        r.itemName?.toLowerCase().includes(s) ||
        r.returnReason?.toLowerCase().includes(s) ||
        (r as any).reason?.toLowerCase().includes(s) ||
        r.status?.toLowerCase().includes(s)
      );
    });
  }, [rtvs, search]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Supplier Return (RTV) Records ({rtvs.length})
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchRtvs}
            disabled={loading}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Refresh
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-foreground flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-foreground font-bold text-xs hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Full-width Search Bar */}
      <div className="mb-4 border border-border rounded-md overflow-hidden bg-card">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/20">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Search supplier returns by RTV#, Supplier, or Item..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-8 p-0 text-xs flex-1 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-xs text-muted-foreground animate-pulse">
          Loading Supplier Returns...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">RTV No.</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-3 py-3 text-right">Return Qty</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No supplier returns found
                  </td>
                </tr>
              ) : (
                paginatedList.map((rtv) => {
                const isPendingApproval = rtv.status === "PendingApproval" || rtv.status === "Pending Approval";
                const isPendingDispatch = rtv.status === "PendingDispatch" || rtv.status === "Pending Dispatch";
                const isDispatched = rtv.status === "Dispatched" || rtv.status === "CreditNoteReceived";
                const isCancelled = rtv.status === "Cancelled";

                return (
                  <tr key={rtv.rtvId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-foreground whitespace-nowrap">
                      {rtv.rtvNumber}
                      <div className="text-[10px] text-muted-foreground font-sans">
                        {new Date(rtv.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate" title={rtv.supplierName}>
                      {rtv.supplierName || `Supplier #${rtv.supplierId}`}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate" title={rtv.itemName}>
                      {rtv.itemName || `Item #${rtv.itemId}`}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                      {(rtv.returnedQuantity ?? rtv.quantityReturned ?? 0).toLocaleString()} {rtv.uomName || "Units"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate" title={rtv.returnReason || (rtv as any).reason}>
                      {rtv.returnReason || (rtv as any).reason || "Defective stock"}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={rtv.status} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPendingApproval && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(rtv)}
                              disabled={actionLoading}
                              className="rounded-xl bg-foreground text-background hover:bg-foreground/85 px-3 py-1.5 text-xs font-semibold transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingRtv(rtv);
                                setRejectionReason("");
                                setActionError(null);
                              }}
                              disabled={actionLoading}
                              className="rounded-xl border border-border bg-card text-foreground hover:bg-muted px-3 py-1.5 text-xs font-semibold transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isPendingDispatch && (
                          <button
                            type="button"
                            onClick={() => {
                              setDispatchingRtv(rtv);
                              setCreditNoteNumber("");
                              setActionError(null);
                            }}
                            disabled={actionLoading}
                            className="rounded-xl bg-foreground text-background hover:bg-foreground/85 px-3 py-1.5 text-xs font-semibold transition-colors"
                          >
                            Dispatch
                          </button>
                        )}

                        {isDispatched && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {rtv.creditNoteNumber ? `Credit: ${rtv.creditNoteNumber}` : "Dispatched"}
                          </span>
                        )}

                        {isCancelled && (
                          <span className="text-xs text-muted-foreground font-medium">
                            Rejected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* REJECT RTV MODAL */}
      {rejectingRtv && (
        <ModalWrapper
          open={!!rejectingRtv}
          title={`Reject Return Request - ${rejectingRtv.rtvNumber}`}
          onClose={() => {
            setRejectingRtv(null);
            setRejectionReason("");
            setActionError(null);
          }}
          size="max-w-md"
        >
          <div className="space-y-4 text-foreground text-xs">
            {actionError && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground">
                {actionError}
              </div>
            )}

            <div className="bg-muted/20 border border-border rounded-xl p-3 space-y-1">
              <div className="font-semibold text-foreground">{rejectingRtv.itemName}</div>
              <div className="text-muted-foreground">
                Quantity: {(rejectingRtv.returnedQuantity ?? rejectingRtv.quantityReturned ?? 0).toLocaleString()} {rejectingRtv.uomName || "Units"}
              </div>
              <div className="text-muted-foreground">
                Supplier: {rejectingRtv.supplierName}
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Rejection Reason *</label>
              <textarea
                rows={3}
                placeholder="Explain why this supplier return request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingRtv(null)}
                className="rounded-xl border border-border bg-card text-foreground px-5 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* DISPATCH RTV MODAL */}
      {dispatchingRtv && (
        <ModalWrapper
          open={!!dispatchingRtv}
          title={`Dispatch Return Shipment - ${dispatchingRtv.rtvNumber}`}
          onClose={() => {
            setDispatchingRtv(null);
            setCreditNoteNumber("");
            setActionError(null);
          }}
          size="max-w-md"
        >
          <div className="space-y-4 text-foreground text-xs">
            {actionError && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground">
                {actionError}
              </div>
            )}

            <div className="bg-muted/20 border border-border rounded-xl p-3 space-y-1">
              <div className="font-semibold text-foreground">{dispatchingRtv.itemName}</div>
              <div className="text-muted-foreground">
                Returning {(dispatchingRtv.returnedQuantity ?? dispatchingRtv.quantityReturned ?? 0).toLocaleString()} {dispatchingRtv.uomName || "Units"} to {dispatchingRtv.supplierName}
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                Dispatching will physically remove the stock from quarantine/holding and log the transfer in the inventory ledger.
              </p>
            </div>

            <div>
              <label className="font-semibold block mb-1">Supplier Credit Note / Settlement Ref (Optional)</label>
              <input
                type="text"
                placeholder="e.g. CN-2026-9901"
                value={creditNoteNumber}
                onChange={(e) => setCreditNoteNumber(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDispatchingRtv(null)}
                className="rounded-xl border border-border bg-card text-foreground px-5 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={actionLoading}
                className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85"
              >
                {actionLoading ? "Dispatching..." : "Confirm Dispatch"}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}
