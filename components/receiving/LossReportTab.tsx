"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Trash2, Search, RefreshCw, Eye, ShieldAlert } from "lucide-react";
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
        r.authorisedBy?.toLowerCase().includes(s)
      );
    });
  }, [lossReports, search]);

  // Paginated list
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
    <div className="space-y-6 animate-page-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Loss Reports & Inventory Disposal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Audited write-off records for non-deliverable shortages and condemned materials with direct stock ledger disposal traceability
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLossReports}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors h-10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Full-width Search Bar: Identical to PR/PO */}
      <div className="mb-6 border border-border rounded-md overflow-hidden bg-card">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/20">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Search loss reports by Report#, Discrepancy#, GRN#, PO#, PR#, Item, or Authoriser..."
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
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm p-12 text-center text-xs text-muted-foreground animate-pulse">
          Loading Loss & Disposal Reports...
        </div>
      ) : paginatedList.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
          <EmptyState
            icon={Trash2}
            title="No Loss / Disposal Reports Found"
            description="When physical count shortages or condemned items are authorized as write-offs, official loss reports are generated here with accounting audit trail."
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm min-h-[300px]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">REPORT NO.</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">DISCREPANCY REF</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PO / GRN NO.</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SUPPLIER</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ITEM</th>
                <th className="px-3 py-3 text-right font-bold text-muted-foreground tracking-wider whitespace-nowrap">LOST QTY</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">REASON</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">AUTHORISED / DATE</th>
                <th className="px-3 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap w-20">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedList.map((r) => (
                <tr key={r.lossReportId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                    {r.lossReportNumber}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                    {r.discrepancyNumber ? (
                      <span className="bg-muted/50 px-2 py-0.5 rounded text-[11px] font-semibold text-foreground">
                        {r.discrepancyNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="font-mono font-medium text-foreground">{r.poNumber || "—"}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{r.grnNumber || "—"}</div>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground max-w-[140px] truncate" title={r.supplierName}>
                    {r.supplierName || "—"}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground max-w-[140px] truncate" title={r.itemName}>
                    {r.itemName}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground whitespace-nowrap">
                    {r.lostQuantity.toLocaleString()} {r.uomName || "Units"}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate" title={r.reason}>
                    {r.reason}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="text-foreground font-medium">{r.authorisedBy}</div>
                    <div className="text-muted-foreground text-[11px]">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectReport(r)}
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors mx-auto"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />

      {/* View Loss Report Details Modal */}
      {selectedReport && (
        <ModalWrapper
          open={modalOpen}
          title={`Loss Report - ${selectedReport.lossReportNumber}`}
          onClose={() => setModalOpen(false)}
          size="max-w-2xl"
        >
          <div className="space-y-6 text-foreground text-xs">
            {/* Summary Box */}
            <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-foreground">
                  Authorized Write-Off Confirmation
                </div>
                <p className="text-muted-foreground mt-0.5">
                  This report certifies stock loss or shortage and adjusts ledger balance without pending supplier re-delivery.
                </p>
              </div>
            </div>

            {/* Traceability Grid */}
            <div className="bg-muted/20 border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Source Discrepancy</div>
                <div className="font-mono font-semibold text-sm mt-0.5">{selectedReport.discrepancyNumber || "Direct"}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Source GRN</div>
                <div className="font-mono font-semibold text-sm mt-0.5">{selectedReport.grnNumber || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Purchase Order</div>
                <div className="font-mono font-semibold text-sm mt-0.5">{selectedReport.poNumber || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Product Requisition</div>
                <div className="font-mono font-semibold text-sm mt-0.5">{selectedReport.prNumber || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Supplier</div>
                <div className="font-medium text-sm mt-0.5">{selectedReport.supplierName || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Stock Ledger Entry ID</div>
                <div className="font-mono text-sm mt-0.5">#{selectedReport.stockLedgerEntryId || "—"}</div>
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
                  <div className="font-mono font-bold text-base text-destructive">
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

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors shadow-sm"
              >
                Close
              </Button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}
