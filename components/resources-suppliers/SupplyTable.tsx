"use client";

import React, { useState } from "react";
import { MoreHorizontal, Pencil } from "lucide-react";
import { SupplyItem } from "./types";

interface SupplyTableProps {
  items: SupplyItem[];
  currentPage: number;
  pageSize: number;
  onEdit: (item: SupplyItem) => void;
}

export default function SupplyTable({ items, currentPage, pageSize, onEdit }: SupplyTableProps) {
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[700px]">
        <thead className="border-b border-border bg-muted/30">
          <tr className="text-left text-xs uppercase text-muted-foreground">
            <th className="px-5 py-4">Item No.</th>
            <th className="px-5 py-4">Name</th>
            <th className="px-5 py-4">Category</th>
            <th className="px-5 py-4">Unit</th>
            <th className="px-5 py-4">Min Stock</th>
            <th className="px-5 py-4">Max Stock</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 text-center">Actions</th>
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
            items.map((item, index) => (
              <tr key={item.itemId} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  {index + 1 + (currentPage - 1) * pageSize}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-foreground">{item.itemName}</td>
                <td className="px-5 py-4">
                  <span className="rounded-md bg-muted text-foreground border border-border px-2.5 py-0.5 text-xs font-semibold">
                    {item.categoryName}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{item.uomName}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{item.minStockLevel}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{item.maxStockLevel}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      item.isActive !== false
                        ? "bg-foreground text-background border border-foreground font-semibold"
                        : "bg-muted/40 text-muted-foreground border border-border"
                    }`}
                  >
                    {item.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4 text-center relative">
                  <button
                    type="button"
                    onClick={() => setActiveDropdownId(activeDropdownId === item.itemId ? null : item.itemId)}
                    className="p-1.5 rounded-lg text-foreground hover:bg-muted transition-colors focus:outline-none"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {activeDropdownId === item.itemId && (
                    <div className="absolute right-10 top-2 z-[100] w-32 rounded-xl border border-border bg-card shadow-xl py-1.5 text-left">
                      <button
                        type="button"
                        onClick={() => {
                          onEdit(item);
                          setActiveDropdownId(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil size={14} className="shrink-0" /> Edit Supply
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
