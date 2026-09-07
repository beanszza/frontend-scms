"use client";

import React from "react";
import { LotItem } from "./types";

interface LotsTableProps {
  items: LotItem[];
  currentPage: number;
  pageSize: number;
}

const statusStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Available: { bg: "bg-foreground text-background border-foreground", text: "font-semibold", border: "", label: "Available" },
  Quarantine: { bg: "bg-muted/70 text-foreground border-muted-foreground/30", text: "font-semibold", border: "", label: "Quarantine" },
  OnHold: { bg: "bg-muted/70 text-foreground border-muted-foreground/30", text: "font-semibold", border: "", label: "On Hold" },
  Rejected: { bg: "bg-muted/30 text-muted-foreground border-border opacity-75", text: "", border: "", label: "Rejected" },
  Consumed: { bg: "bg-muted/30 text-muted-foreground border-border opacity-75", text: "", border: "", label: "Consumed" },
  Disposed: { bg: "bg-muted/30 text-muted-foreground border-border opacity-75", text: "", border: "", label: "Disposed" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export default function LotsTable({ items, currentPage, pageSize }: LotsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">LOT CODE</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ITEM</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">LOCATION</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SUPPLIER</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">RECEIVED</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">EXPIRY</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">QTY REMAINING</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
                No Results Found
              </td>
            </tr>
          ) : (
            items.map((lot, idx) => {
              const style = statusStyles[lot.status] || statusStyles.Available;
              return (
                <tr key={lot.lotId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-3 font-bold text-foreground whitespace-nowrap">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td className="px-3 py-3 font-medium text-foreground">
                    <div className="font-semibold">{lot.lotCode}</div>
                    <div className="text-muted-foreground text-[10px]">{lot.itemName}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{lot.locationName}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {lot.supplierName || "-"}
                    {lot.supplierLotNo && <span className="text-[10px] ml-1">({lot.supplierLotNo})</span>}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{formatDate(lot.receivedDate)}</td>
                  <td className="px-3 py-3">
                    {lot.expiryDate ? (
                      <span className={lot.isExpired ? "text-red-600 font-semibold" : "text-foreground"}>
                        {formatDate(lot.expiryDate)}
                        {lot.isExpired && " (exp)"}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-3 font-bold text-foreground">
                    {lot.quantityRemaining.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {lot.uomName}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text} ${style.border}`}>
                      {style.label}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}