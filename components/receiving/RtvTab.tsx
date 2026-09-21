"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { RotateCcw, Search, RefreshCw, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import Pagination from "@/components/Pagination";
import { RtvRecord } from "./types";

export default function RtvTab() {
  const [rtvs, setRtvs] = useState<RtvRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchRtvs = useCallback(async () => {
    setLoading(true);
    try {
      // Discrepancy resolutions and QA NCRs create RTV records in ReturnToVendors
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
        r.prNumber?.toLowerCase().includes(s) ||
        r.supplierName?.toLowerCase().includes(s) ||
        r.itemName?.toLowerCase().includes(s) ||
        r.returnReason?.toLowerCase().includes(s)
      );
    });
  }, [rtvs, search]);

  // Paginated list
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-6 animate-page-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Supplier Returns (RTV) & Vendor Shipbacks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit trail of rejected or surplus merchandise returned to suppliers with linked Non-Conformance Reports (NCR) and credit notes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRtvs}
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
              placeholder="Search supplier returns by RTV#, NCR#, GRN#, PO#, PR#, Supplier, or Item..."
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
          Loading Supplier Returns...
        </div>
      ) : paginatedList.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
          <EmptyState
            icon={RotateCcw}
            title="No Supplier Returns Found"
            description="Supplier returns (RTV) are generated automatically from Discrepancies and QA NCRs when defective or excess goods are approved for vendor return."
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm min-h-[300px]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">RTV NO.</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">NCR REF</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PO / GRN NO.</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SUPPLIER</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ITEM</th>
                <th className="px-3 py-3 text-right font-bold text-muted-foreground tracking-wider whitespace-nowrap">RETURN QTY</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">REASON</th>
                <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">DATE</th>
                <th className="px-3 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedList.map((rtv) => (
                <tr key={rtv.rtvId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                    {rtv.rtvNumber}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                    {rtv.ncrNumber ? (
                      <span className="bg-muted/50 px-2 py-0.5 rounded text-[11px] font-semibold text-foreground">
                        {rtv.ncrNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="font-mono font-medium text-foreground">{rtv.poNumber || "—"}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{rtv.grnNumber || "—"}</div>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground max-w-[140px] truncate" title={rtv.supplierName}>
                    {rtv.supplierName || `Supplier #${rtv.supplierId}`}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground max-w-[140px] truncate" title={rtv.itemName}>
                    {rtv.itemName || `Item #${rtv.itemId}`}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground whitespace-nowrap">
                    {rtv.quantityReturned?.toLocaleString?.() ?? (rtv as any).returnedQuantity?.toLocaleString?.() ?? 0}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate" title={rtv.returnReason || (rtv as any).reason}>
                    {rtv.returnReason || (rtv as any).reason || "Defective stock"}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                    {new Date(rtv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <StatusBadge status={rtv.status} />
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
    </div>
  );
}
