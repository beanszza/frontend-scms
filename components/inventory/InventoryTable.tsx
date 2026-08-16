"use client";

import React from "react";
import { InventoryItem } from "./types";

interface InventoryTableProps {
  items: InventoryItem[];
  currentPage: number;
  pageSize: number;
}

export default function InventoryTable({ items, currentPage, pageSize }: InventoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ITEM NO.</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ITEM NAME</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">LOCATION</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">CURRENT STOCK</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">MIN STOCK</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">MAX STOCK</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
                No Results Found
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.inventoryId} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-3 font-bold text-foreground whitespace-nowrap">
                  {(currentPage - 1) * pageSize + idx + 1}
                </td>
                <td className="px-3 py-3 font-medium text-foreground">{item.itemName}</td>
                <td className="px-3 py-3 text-muted-foreground">{item.locationName}</td>
                <td className="px-3 py-3 font-bold text-foreground">{item.currentStock} {item.uomName}</td>
                <td className="px-3 py-3 text-muted-foreground">{item.minStockLevel}</td>
                <td className="px-3 py-3 text-muted-foreground">{item.maxStockLevel}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    item.isLowStock
                      ? "bg-muted/60 text-foreground border border-border"
                      : "bg-foreground text-background border border-foreground font-semibold"
                  }`}>
                    {item.isLowStock ? "Low Stock" : "In Stock"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
