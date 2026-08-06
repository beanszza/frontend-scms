"use client";

import React from "react";
import PaginationFooter from "./PaginationFooter";

interface SupplierReportViewProps {
  data: any;
  searchQuery: string;
  selectedSupplierFilter: string;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  onOpenOrdersModal: (supplier: any) => void;
  itemsPerPage?: number;
}

export default function SupplierReportView({
  data,
  searchQuery,
  selectedSupplierFilter,
  currentPage,
  setCurrentPage,
  onOpenOrdersModal,
  itemsPerPage = 10,
}: SupplierReportViewProps) {
  const filterList = (list: any[]) => {
    if (!list) return [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(q))
    );
  };

  let scorecardAll = filterList(data?.vendorScorecard || []);

  if (selectedSupplierFilter !== "all") {
    scorecardAll = scorecardAll.filter((s: any) => s.supplierName === selectedSupplierFilter);
  }

  const startIdx = (currentPage - 1) * itemsPerPage;
  const scorecard = scorecardAll.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm w-full">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Vendor Scorecard & Delivery Performance Audit
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Detailed vendor performance breakdown and order history metrics.
          </p>
        </div>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          {scorecardAll.length} Vendors
        </span>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-[11px] uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center w-10">#</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Supplier Name</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Total Orders</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">On-Time</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Late Deliveries</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Accuracy Rate</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Avg Lead Time</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Rejection Rate</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Vendor Grade</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Orders History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {scorecard.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="whitespace-nowrap px-3 py-2.5 text-center font-mono text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  {startIdx + i + 1}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-bold text-gray-900 dark:text-white">
                  {row.supplierName}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-700 dark:text-gray-300 font-medium">
                  {row.totalOrdersPlaced}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                  {row.onTimeDeliveries}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-rose-600 dark:text-rose-400 font-bold">
                  {row.lateDeliveries}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-700 dark:text-gray-300">
                  {row.orderAccuracyRate}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-700 dark:text-gray-300">
                  {row.averageLeadTime}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-700 dark:text-gray-300">
                  {row.rejectionRate}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    row.overallVendorGrade?.includes("Grade A")
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : row.overallVendorGrade?.includes("Grade B")
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  }`}>
                    {row.overallVendorGrade}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center">
                  <button
                    onClick={() => onOpenOrdersModal(row)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition-colors"
                  >
                    View Orders
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationFooter
        totalItems={scorecardAll.length}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
