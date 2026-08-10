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
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Total Batches</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.totalBatches}</span>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Passed QA</span>
          <span className="text-2xl font-bold text-emerald-500 mt-1">{summary.passedQaBatches}</span>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Rejected</span>
          <span className="text-2xl font-bold text-rose-500 mt-1">{summary.rejectedBatches}</span>
        </div>
      </div>

      {/* Section B: Kitchen Yield Efficiency Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm w-full">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Main Table: Kitchen Yield Efficiency & Batch Quality Audit</h3>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-[11px] uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
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
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {yieldEfficiency.length > 0 ? (
                yieldEfficiency.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="whitespace-nowrap px-3 py-2.5 text-center font-mono text-[11px] font-bold text-gray-500 dark:text-gray-400">
                      {startIdx + i + 1}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-bold text-gray-900 dark:text-white">{row.recipeName}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-700 dark:text-gray-300 font-medium">{row.totalBatchesCooked}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-700 dark:text-gray-300 font-medium">{row.totalOutputQty}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">{row.yieldSuccessRate}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-rose-600 dark:text-rose-400 font-medium">{row.totalRejectedQty}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-700 dark:text-gray-300">{row.ingredientWasteQty}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{row.commonFailureReason}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
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
