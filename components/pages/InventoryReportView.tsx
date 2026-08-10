"use client";

import React from "react";
import PaginationFooter from "./PaginationFooter";

interface InventoryReportViewProps {
  data: any;
  searchQuery: string;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage?: number;
}

export default function InventoryReportView({
  data,
  searchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage = 10,
}: InventoryReportViewProps) {
  const filterList = (list: any[]) => {
    if (!list) return [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(q))
    );
  };

  const historicalAll = filterList(data?.historicalAudit || []);
  const forecastAll = filterList(data?.demandForecast || []);

  const startIdx = (currentPage - 1) * itemsPerPage;
  const historical = historicalAll.slice(startIdx, startIdx + itemsPerPage);
  const forecast = forecastAll.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Section A */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm w-full">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">
            Section A: Historical Inventory Audit Table
          </h3>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-background/50 text-[11px] uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center w-10">#</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Period</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Active Items</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Starting Stock</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Ending Stock</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Stock In</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Stock Out</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Wastage</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Velocity %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {historical.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="whitespace-nowrap px-3 py-2.5 text-center font-mono text-[11px] font-bold text-muted-foreground">
                    {startIdx + i + 1}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-bold text-foreground">{row.period}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground">{row.totalActiveItems}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground">{row.startingStockQty}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground">{row.endingStockQty}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-emerald-600 font-semibold">{row.stockInQty}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-indigo-600 font-semibold">{row.stockOutQty}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-rose-600">{row.wastageQty}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground font-bold">{row.inventoryVelocity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationFooter
          totalItems={historicalAll.length}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Section B */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm w-full">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">
            Section B: Inventory Demand Forecast Card
          </h3>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-background/50 text-[11px] uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center w-10">#</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Item Name</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Current Stock</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Avg Daily Usage</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Days Left</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Runout Date</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Urgency</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-center">Reorder Advice Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {forecast.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="whitespace-nowrap px-3 py-2.5 text-center font-mono text-[11px] font-bold text-muted-foreground">
                    {startIdx + i + 1}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-bold text-foreground">{row.itemName}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground font-medium">{row.currentStock}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-indigo-600 font-medium">{row.avgDailyUsage}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground">{row.daysLeft}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-muted-foreground">{row.runoutDate}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center font-semibold">{row.urgencyBadge}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-emerald-600 font-bold">{row.recommendedReorderQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationFooter
          totalItems={forecastAll.length}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
