"use client";

import React from "react";
import PaginationFooter from "./PaginationFooter";

interface DistributionReportViewProps {
  data: any;
  searchQuery: string;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage?: number;
}

export default function DistributionReportView({
  data,
  searchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage = 10,
}: DistributionReportViewProps) {
  const filterList = (list: any[]) => {
    if (!list) return [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(q))
    );
  };

  const velocityAll = filterList(data?.logisticsVelocity || []);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const velocity = velocityAll.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm w-full">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Main Table: Logistics & Branch Transfer Velocity Report
        </h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-[11px] uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center w-10">#</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Source Location</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Destination Branch</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Dispatch Date</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Receive Date</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Transit Duration</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Assigned Driver</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Transfer Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {velocity.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="whitespace-nowrap px-3 py-2.5 text-center font-mono text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  {startIdx + i + 1}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-bold text-gray-900 dark:text-white">{row.sourceLocation}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-gray-300 font-medium">{row.destinationBranch}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-600 dark:text-gray-400 text-xs font-mono">{row.dispatchDate}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-600 dark:text-gray-400 text-xs font-mono">{row.receiveDate}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-700 dark:text-gray-300">{row.transitDuration}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-gray-300">{row.assignedDriver}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">{row.transferStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationFooter
        totalItems={velocityAll.length}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
