"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { EmptyState } from "@/components/shared/EmptyState";
import Pagination from "@/components/Pagination";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import { LossReport } from "./types";

export default function LossReportTab() {
  const [lossReports, setLossReports] = useState<LossReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedReport, setSelectedReport] = useState<LossReport | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLossReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/LossReports");
      if (res.data?.success) {
        setLossReports(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching loss reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLossReports();
  }, [fetchLossReports]);

  const handleAcknowledge = async (reportId: number) => {
    setActionLoadingId(reportId);
    setError(null);
    try {
      const res = await api.post(`/api/LossReports/${reportId}/acknowledge`);
      if (res.data?.success) {
        await fetchLossReports();
        if (selectedReport && selectedReport.lossReportId === reportId) {
          setSelectedReport(res.data.data);
        }
      } else {
        setError(res.data?.message || "Failed to acknowledge loss report.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to acknowledge loss report.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return lossReports;
    const s = search.toLowerCase();
    return lossReports.filter((r) => {
      return (
        r.lossReportNumber?.toLowerCase().includes(s) ||
        r.discrepancyNumber?.toLowerCase().includes(s) ||
        r.grnNumber?.toLowerCase().includes(s) ||
        r.poNumber?.toLowerCase().includes(s) ||
        r.prNumber?.toLowerCase().includes(s) ||
        r.supplierName?.toLowerCase().includes(s) ||
        r.itemName?.toLowerCase().includes(s) ||
        r.reason?.toLowerCase().includes(s) ||
        r.authorisedBy?.toLowerCase().includes(s) ||
        r.acknowledgedBy?.toLowerCase().includes(s)
      );
    });
  }, [lossReports, search]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleSelectReport = (report: LossReport) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Loss & Disposal Reports ({lossReports.length})
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchLossReports}
            disabled={loading}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Refresh
          </Button>
        </div>
      </div>

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

      {/* Full-width Search Bar */}
      <div className="mb-4 border border-border rounded-md overflow-hidden bg-card">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/20">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Search loss reports by Report#, Item, or Supplier..."
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
          Loading Loss & Disposal Reports...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Report No.</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-3 py-3 text-right">Lost Qty</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No loss reports found
                  </td>
                </tr>
              ) : (
                paginatedList.map((r) => {
                const isAck = !!r.isAcknowledged;
                return (
                  <tr key={r.lossReportId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                      {r.lossReportNumber}
                      <div className="text-[10px] text-muted-foreground font-sans">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-foreground max-w-[200px] truncate" title={r.itemName}>
                      {r.itemName}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                      {r.lostQuantity.toLocaleString()} {r.uomName || "Units"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-[220px] truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      {isAck ? (
                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted border border-border text-foreground">
                          Acknowledged
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted/50 border border-border text-muted-foreground">
                          Awaiting Ack
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isAck && (
                          <button
                            type="button"
                            onClick={() => handleAcknowledge(r.lossReportId)}
                            disabled={actionLoadingId === r.lossReportId}
                            className="rounded-xl bg-foreground px-3 py-1 text-xs font-semibold text-background hover:bg-foreground/85 disabled:opacity-40 transition-colors shadow-sm"
                          >
                            {actionLoadingId === r.lossReportId ? "…" : "Ack"}
                          </button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectReport(r)}
                          className="rounded-xl border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                        >
                          View
                        </Button>
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

      {/* View Loss Report Details Modal */}
      {selectedReport && (
        <ModalWrapper
          open={modalOpen}
          title={`Loss Report - ${selectedReport.lossReportNumber}`}
          onClose={() => setModalOpen(false)}
          size="max-w-2xl"
        >
          <div className="space-y-5 text-foreground text-xs">
            {/* Summary Box */}
            <div className="bg-muted/20 border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-foreground">
                  Authorized Write-Off
                </div>
                {selectedReport.isAcknowledged ? (
                  <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-muted border border-border text-foreground">
                    Acknowledged
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-muted/50 border border-border text-muted-foreground">
                    Pending Admin Acknowledgement
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                This report certifies stock loss or shortage and adjusts the ledger balance.
              </p>
              {selectedReport.acknowledgedBy && (
                <div className="text-[11px] text-muted-foreground mt-2 border-t border-border/60 pt-1.5">
                  Acknowledged by <strong className="text-foreground">{selectedReport.acknowledgedBy}</strong>
                  {selectedReport.acknowledgedAt && ` on ${new Date(selectedReport.acknowledgedAt).toLocaleString()}`}
                </div>
              )}
            </div>

            {/* Traceability Grid */}
            <div className="bg-muted/20 border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Source Discrepancy</div>
                <div className="font-mono font-semibold text-xs mt-0.5">{selectedReport.discrepancyNumber || "Direct"}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Source GRN</div>
                <div className="font-mono font-semibold text-xs mt-0.5">{selectedReport.grnNumber || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Purchase Order</div>
                <div className="font-mono font-semibold text-xs mt-0.5">{selectedReport.poNumber || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Supplier</div>
                <div className="font-medium text-xs mt-0.5">{selectedReport.supplierName || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Authorised By</div>
                <div className="font-medium text-xs mt-0.5">{selectedReport.authorisedBy || "—"}</div>
              </div>
            </div>

            {/* Item & Loss Detail */}
            <div className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-muted-foreground">Item Description</div>
                  <div className="font-semibold text-sm">{selectedReport.itemName}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Quantity Written Off</div>
                  <div className="font-mono font-bold text-sm text-foreground">
                    {selectedReport.lostQuantity.toLocaleString()} {selectedReport.uomName || "Units"}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="text-muted-foreground font-semibold mb-1">Reason for Loss / Disposal:</div>
                <div className="bg-card p-3 rounded-lg border border-border text-foreground">
                  {selectedReport.reason}
                </div>
              </div>

              {selectedReport.notes && (
                <div className="border-t border-border pt-3">
                  <div className="text-muted-foreground font-semibold mb-1">Audit Notes:</div>
                  <div className="bg-muted/40 p-2.5 rounded-lg text-muted-foreground text-[11px]">
                    {selectedReport.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <div>
                {!selectedReport.isAcknowledged && (
                  <button
                    type="button"
                    onClick={() => handleAcknowledge(selectedReport.lossReportId)}
                    disabled={actionLoadingId === selectedReport.lossReportId}
                    className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors"
                  >
                    {actionLoadingId === selectedReport.lossReportId ? "Acknowledging..." : "Acknowledge This Report"}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-border bg-card text-foreground px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}
