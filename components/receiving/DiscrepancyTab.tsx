"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, RefreshCw, AlertTriangle, AlertCircle, XCircle, PlusCircle, ListFilter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import DiscrepancyTable from "./DiscrepancyTable";
import DiscrepancyDetailsModal from "./DiscrepancyDetailsModal";
import Pagination from "@/components/Pagination";
import { Discrepancy } from "./types";

type DiscrepancySubTab = "short" | "rejected" | "over" | "all";

export default function DiscrepancyTab() {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<DiscrepancySubTab>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<Discrepancy | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDiscrepancies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/Discrepancies");
      if (res.data?.success) {
        setDiscrepancies(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching discrepancies:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscrepancies();
  }, [fetchDiscrepancies]);

  // Counts for each subtab
  const counts = useMemo(() => {
    let shortCount = 0;
    let rejectedCount = 0;
    let overCount = 0;

    discrepancies.forEach((d) => {
      const t = d.discrepancyType;
      if (t === "PartialShort" || t === "Short") shortCount++;
      else if (t === "Rejected") rejectedCount++;
      else if (t === "OverSupply" || t === "Over") overCount++;
    });

    return {
      short: shortCount,
      rejected: rejectedCount,
      over: overCount,
      all: discrepancies.length,
    };
  }, [discrepancies]);

  // Filtered list
  const filteredDiscrepancies = useMemo(() => {
    return discrepancies.filter((d) => {
      // Subtab filter
      const t = d.discrepancyType;
      if (activeSubTab === "short" && t !== "PartialShort" && t !== "Short") return false;
      if (activeSubTab === "rejected" && t !== "Rejected") return false;
      if (activeSubTab === "over" && t !== "OverSupply" && t !== "Over") return false;

      // Search filter
      if (search.trim()) {
        const s = search.toLowerCase();
        return (
          d.discrepancyNumber?.toLowerCase().includes(s) ||
          d.grnNumber?.toLowerCase().includes(s) ||
          d.poNumber?.toLowerCase().includes(s) ||
          d.prNumber?.toLowerCase().includes(s) ||
          d.supplierName?.toLowerCase().includes(s) ||
          d.itemName?.toLowerCase().includes(s) ||
          d.resolutionType?.toLowerCase().includes(s) ||
          d.lossReportNumber?.toLowerCase().includes(s) ||
          d.rtvNumber?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [discrepancies, activeSubTab, search]);

  // Paginated list
  const totalCount = filteredDiscrepancies.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDiscrepancies.slice(start, start + pageSize);
  }, [filteredDiscrepancies, page, pageSize]);

  const handleSelect = (item: Discrepancy) => {
    setSelectedDiscrepancy(item);
    setModalOpen(true);
  };

  const tabs = [
    { id: "all" as DiscrepancySubTab, label: "All Discrepancies", count: counts.all },
    { id: "short" as DiscrepancySubTab, label: "Partial / Short", count: counts.short },
    { id: "rejected" as DiscrepancySubTab, label: "Rejected", count: counts.rejected },
    { id: "over" as DiscrepancySubTab, label: "Over Supply", count: counts.over },
  ];

  return (
    <div className="space-y-6 animate-page-in">
      {/* Top Header Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Discrepancy Management & Root Cause</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit count shortages, QA rejections, and over-supplies with direct resolution to Supplier Return (RTV) or Loss Write-off
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDiscrepancies}
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
              placeholder="Search discrepancies by Discrepancy#, GRN#, PO#, PR#, Item, or Supplier..."
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

      {/* Subtab Pill Navigation */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max pb-2">
          {tabs.map((t) => {
            const isActive = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveSubTab(t.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-background text-foreground" : "bg-foreground/20 text-foreground"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <DiscrepancyTable
        discrepancies={paginatedList}
        loading={loading}
        onSelectDiscrepancy={handleSelect}
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />

      {/* Details / Resolution Modal */}
      <DiscrepancyDetailsModal
        discrepancy={selectedDiscrepancy}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onResolved={() => {
          fetchDiscrepancies();
        }}
      />
    </div>
  );
}
