"use client";

import React from "react";
import { Button } from "@/components/ui/button";
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
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm w-full">
      <div className="px-5 py-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Vendor Scorecard & Delivery Performance Audit
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Detailed vendor performance breakdown and order history metrics.
          </p>
        </div>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-muted text-foreground">
          {scorecardAll.length} Vendors
        </span>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-background/50 text-[11px] uppercase text-muted-foreground border-b border-border">
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
          <tbody className="divide-y divide-border">
            {scorecard.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-muted/50 transition-colors">
                <td className="whitespace-nowrap px-3 py-2.5 text-center font-mono text-[11px] font-bold text-muted-foreground">
                  {startIdx + i + 1}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-bold text-foreground">
                  {row.supplierName}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground font-medium">
                  {row.totalOrdersPlaced}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-emerald-600 font-bold">
                  {row.onTimeDeliveries}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-rose-600 font-bold">
                  {row.lateDeliveries}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground">
                  {row.orderAccuracyRate}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground">
                  {row.averageLeadTime}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground">
                  {row.rejectionRate}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    row.overallVendorGrade?.includes("Grade A")
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : row.overallVendorGrade?.includes("Grade B")
                        ? "bg-muted text-foreground border border-blue-200"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                  }`}>
                    {row.overallVendorGrade}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center">
                  <Button
                    onClick={() => onOpenOrdersModal(row)}
                    className="px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-accent border border-border text-xs font-semibold transition-colors"
                  >
                    View Orders
                  </Button>
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
