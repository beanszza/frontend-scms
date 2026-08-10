"use client";

import React from "react";
import PaginationFooter from "./PaginationFooter";

interface ProcurementReportViewProps {
  data: any;
  searchQuery: string;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage?: number;
}

export default function ProcurementReportView({
  data,
  searchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage = 10,
}: ProcurementReportViewProps) {
  const filterList = (list: any[]) => {
    if (!list) return [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(q))
    );
  };

  const historicalAll = filterList(data?.historicalAudit || []);
  const summary = data?.orderFulfillmentSummary || {
    totalOrders: 0,
    pendingOrders: 0,
    arrivedOrders: 0,
    completedOrders: 0,
    rejectedOrders: 0,
    cancelledOrders: 0,
  };

  const startIdx = (currentPage - 1) * itemsPerPage;
  const historical = historicalAll.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Section A: Order Fulfillment Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
        <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-center items-center min-w-0">
          <span className="text-xs font-semibold text-muted-foreground text-center truncate">Total Orders</span>
          <span className="text-xl font-bold text-foreground mt-1">{summary.totalOrders}</span>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-center items-center min-w-0">
          <span className="text-xs font-semibold text-muted-foreground text-center truncate">Pending</span>
          <span className="text-xl font-bold text-amber-500 mt-1">{summary.pendingOrders}</span>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-center items-center min-w-0">
          <span className="text-xs font-semibold text-muted-foreground text-center truncate">Arrived (QA)</span>
          <span className="text-xl font-bold text-foreground mt-1">{summary.arrivedOrders}</span>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-center items-center min-w-0">
          <span className="text-xs font-semibold text-muted-foreground text-center truncate">Completed</span>
          <span className="text-xl font-bold text-emerald-500 mt-1">{summary.completedOrders}</span>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-center items-center min-w-0">
          <span className="text-xs font-semibold text-muted-foreground text-center truncate">Rejected</span>
          <span className="text-xl font-bold text-rose-500 mt-1">{summary.rejectedOrders}</span>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-center items-center min-w-0">
          <span className="text-xs font-semibold text-muted-foreground text-center truncate">Cancelled</span>
          <span className="text-xl font-bold text-muted-foreground mt-1">{summary.cancelledOrders}</span>
        </div>
      </div>

      {/* Section B: Historical Procurement Audit Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm w-full">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">Section B: Historical Procurement Audit Table</h3>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-background/50 text-[11px] uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center w-10">#</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Issue Date</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Supplier Name</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Total Items</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Total Ordered Qty</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Delivery Lead Time</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Fulfillment Rate</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Inspection Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {historical.length > 0 ? (
                historical.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    <td className="whitespace-nowrap px-3 py-2.5 text-center font-mono text-[11px] font-bold text-muted-foreground">
                      {startIdx + i + 1}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground font-mono text-xs">{row.issueDate}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-bold text-foreground">{row.supplierName}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground font-medium">{row.totalItemsCount}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground font-medium">{row.totalOrderedQty}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground">{row.deliveryLeadTime}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-emerald-600 font-bold">{row.fulfillmentRate}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center font-bold">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        row.inspectionStatus?.toLowerCase().includes("passed") || row.inspectionStatus?.toLowerCase().includes("completed")
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-amber-50 text-amber-600 border border-amber-200"
                      }`}>
                        {row.inspectionStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    No procurement audits found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationFooter
          totalItems={historicalAll.length}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
