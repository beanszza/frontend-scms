"use client";

import React from "react";
import PaginationFooter from "./PaginationFooter";

interface ProductionReportViewProps {
  data: any;
  searchQuery: string;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage?: number;
}

export default function ProductionReportView({
  data,
  searchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage = 10,
}: ProductionReportViewProps) {
  const filterList = (list: any[]) => {
    if (!list) return [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(q))
    );
  };

  const yieldEfficiencyAll = filterList(data?.yieldEfficiency || []);
  const summary = data?.summary || {
    totalBatches: 0,
    scheduledBatches: 0,
    inProgressBatches: 0,
    passedQaBatches: 0,
    rejectedBatches: 0,
    mostProducedItem: "N/A",
    seldomProducedItem: "N/A",
  };

  const startIdx = (currentPage - 1) * itemsPerPage;
  const yieldEfficiency = yieldEfficiencyAll.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Section A: Production Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-center items-center">
          <span className="text-sm font-medium text-muted-foreground text-center">Total Batches</span>
          <span className="text-2xl font-bold text-foreground mt-1">{summary.totalBatches}</span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-center items-center">
          <span className="text-sm font-medium text-muted-foreground text-center">Passed QA</span>
          <span className="text-2xl font-bold text-emerald-500 mt-1">{summary.passedQaBatches}</span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-center items-center">
          <span className="text-sm font-medium text-muted-foreground text-center">Rejected</span>
          <span className="text-2xl font-bold text-rose-500 mt-1">{summary.rejectedBatches}</span>
        </div>
      </div>

      {/* Section B: Kitchen Yield Efficiency Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm w-full">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">Main Table: Kitchen Yield Efficiency & Batch Quality Audit</h3>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-background/50 text-[11px] uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center w-10">#</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Recipe Name</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Total Batches</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Total Output Qty</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Yield Success Rate %</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Rejected Qty</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Ingredient Waste Qty</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Failure Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {yieldEfficiency.length > 0 ? (
                yieldEfficiency.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    <td className="whitespace-nowrap px-3 py-2.5 text-center font-mono text-[11px] font-bold text-muted-foreground">
                      {startIdx + i + 1}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-bold text-foreground">{row.recipeName}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground font-medium">{row.totalBatchesCooked}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground font-medium">{row.totalOutputQty}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center font-bold text-emerald-600">{row.yieldSuccessRate}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-rose-600 font-medium">{row.totalRejectedQty}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground">{row.ingredientWasteQty}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground text-xs">{row.commonFailureReason}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    No production audits found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationFooter
          totalItems={yieldEfficiencyAll.length}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
