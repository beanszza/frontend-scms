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
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm w-full">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-base font-bold text-foreground">
          Main Table: Logistics & Branch Transfer Velocity Report
        </h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-background/50 text-[11px] uppercase text-muted-foreground border-b border-border">
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
          <tbody className="divide-y divide-border">
            {velocity.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-muted/50 transition-colors">
                <td className="whitespace-nowrap px-3 py-2.5 text-center font-mono text-[11px] font-bold text-muted-foreground">
                  {startIdx + i + 1}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-bold text-foreground">{row.sourceLocation}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground font-medium">{row.destinationBranch}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground text-xs font-mono">{row.dispatchDate}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground text-xs font-mono">{row.receiveDate}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground">{row.transitDuration}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{row.assignedDriver}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center font-bold text-emerald-600">{row.transferStatus}</td>
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
