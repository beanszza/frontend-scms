"use client";

import React, { useState } from "react";
import { InventoryItem } from "./types";
import { LotItem } from "../lots/types";
import api from "@/lib/api";
import { ChevronDown, ChevronRight, Layers, AlertTriangle, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface InventoryTableProps {
  items: InventoryItem[];
  currentPage: number;
  pageSize: number;
}

// Lot status display handled by StatusBadge

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function getExpiryBadge(lot: LotItem) {
  if (!lot.expiryDate) {
    return <span className="text-muted-foreground font-medium">-</span>;
  }
  const exp = new Date(lot.expiryDate);
  const now = new Date();
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-foreground text-background border-transparent">
        <AlertTriangle size={12} /> {formatDate(lot.expiryDate)} (Expired)
      </span>
    );
  }
  if (diffDays <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-badge-subtle text-badge-subtle-foreground border-transparent">
        <Clock size={12} /> {formatDate(lot.expiryDate)} ({diffDays}d left)
      </span>
    );
  }
  if (diffDays <= 30) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-badge-muted text-badge-muted-foreground border-transparent">
        <Clock size={12} /> {formatDate(lot.expiryDate)} ({diffDays}d)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-muted-foreground font-medium">
      {formatDate(lot.expiryDate)}
    </span>
  );
}

export default function InventoryTable({ items, currentPage, pageSize }: InventoryTableProps) {
  const [expandedItemIds, setExpandedItemIds] = useState<Record<number, boolean>>({});
  const [itemLots, setItemLots] = useState<Record<number, LotItem[]>>({});
  const [loadingLots, setLoadingLots] = useState<Record<number, boolean>>({});

  const toggleRow = async (itemId: number) => {
    const isExpanded = !!expandedItemIds[itemId];
    const nextState = !isExpanded;
    setExpandedItemIds((prev) => ({ ...prev, [itemId]: nextState }));

    if (nextState && !itemLots[itemId]) {
      setLoadingLots((prev) => ({ ...prev, [itemId]: true }));
      try {
        // Try the route with prefix or direct controller route
        let res;
        try {
          res = await api.get(`/api/scms/api/Lots/byitem/${itemId}`);
        } catch {
          res = await api.get(`/api/Lots/byitem/${itemId}`);
        }

        if (res.data?.success) {
          setItemLots((prev) => ({ ...prev, [itemId]: res.data.data || [] }));
        } else {
          setItemLots((prev) => ({ ...prev, [itemId]: [] }));
        }
      } catch (err) {
        console.error("Failed to load lots for item", itemId, err);
        setItemLots((prev) => ({ ...prev, [itemId]: [] }));
      } finally {
        setLoadingLots((prev) => ({ ...prev, [itemId]: false }));
      }
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-muted-foreground">
            <th className="w-10 px-3 py-3 text-center"></th>
            <th className="px-3 py-3 text-left font-bold tracking-wider whitespace-nowrap">ITEM NO.</th>
            <th className="px-3 py-3 text-left font-bold tracking-wider whitespace-nowrap">ITEM NAME</th>
            <th className="px-3 py-3 text-left font-bold tracking-wider whitespace-nowrap">LOCATION</th>
            <th className="px-3 py-3 text-left font-bold tracking-wider whitespace-nowrap">CURRENT STOCK</th>
            <th className="px-3 py-3 text-left font-bold tracking-wider whitespace-nowrap">MIN STOCK</th>
            <th className="px-3 py-3 text-left font-bold tracking-wider whitespace-nowrap">MAX STOCK</th>
            <th className="px-3 py-3 text-left font-bold tracking-wider whitespace-nowrap">STATUS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-5 py-12 text-center text-sm font-semibold text-muted-foreground">
                No Inventory Records Found
              </td>
            </tr>
          ) : (
            items.map((item, idx) => {
              const isExpanded = !!expandedItemIds[item.itemId];
              const lots = itemLots[item.itemId] || [];
              const isLoading = !!loadingLots[item.itemId];

              return (
                <React.Fragment key={item.inventoryId}>
                  <tr
                    onClick={() => toggleRow(item.itemId)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer select-none group"
                  >
                    <td className="px-3 py-3.5 text-center text-muted-foreground group-hover:text-foreground">
                      {isExpanded ? (
                        <ChevronDown size={16} className="transition-transform text-primary" />
                      ) : (
                        <ChevronRight size={16} className="transition-transform" />
                      )}
                    </td>
                    <td className="px-3 py-3.5 font-bold text-foreground whitespace-nowrap">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="px-3 py-3.5 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{item.itemName}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                          <Layers size={10} /> Lots
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-muted-foreground">{item.locationName}</td>
                    <td className="px-3 py-3.5 font-bold text-foreground">
                      {item.currentStock.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}{" "}
                      <span className="text-xs font-normal text-muted-foreground">{item.uomName}</span>
                    </td>
                    <td className="px-3 py-3.5 text-muted-foreground">{item.minStockLevel}</td>
                    <td className="px-3 py-3.5 text-muted-foreground">{item.maxStockLevel}</td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={item.isLowStock ? "Submitted" : "Available"} />
                    </td>
                  </tr>

                  {/* Expandable Lot Detail Row */}
                  {isExpanded && (
                    <tr className="bg-muted/15 border-b border-border">
                      <td colSpan={8} className="p-4 sm:p-5">
                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={16} className="text-primary" />
                              <span className="font-bold text-sm text-foreground">
                                Lot-Level Traceability & FEFO Allocation
                              </span>
                              <span className="text-xs text-muted-foreground">({item.itemName})</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Sorted by <span className="font-semibold text-foreground">FEFO Priority</span> (Earliest Expiry First)
                            </div>
                          </div>

                          {isLoading ? (
                            <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                              Loading lot breakdown and expiry data...
                            </div>
                          ) : lots.length === 0 ? (
                            <div className="py-6 text-center text-xs text-muted-foreground">
                              No active inventory lots found for this item at this location.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border text-muted-foreground bg-muted/20">
                                    <th className="px-2.5 py-2 text-left font-semibold">FEFO PRIORITY</th>
                                    <th className="px-2.5 py-2 text-left font-semibold">LOT CODE</th>
                                    <th className="px-2.5 py-2 text-left font-semibold">SOURCE / SUPPLIER</th>
                                    <th className="px-2.5 py-2 text-left font-semibold">RECEIVED / MFG</th>
                                    <th className="px-2.5 py-2 text-left font-semibold">EXPIRY DATE</th>
                                    <th className="px-2.5 py-2 text-left font-semibold">QUANTITY REMAINING</th>
                                    <th className="px-2.5 py-2 text-left font-semibold">% SHARE</th>
                                    <th className="px-2.5 py-2 text-left font-semibold">STATUS</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                  {lots.map((lot) => {
                                    return (
                                      <tr
                                        key={lot.lotId}
                                        className={`hover:bg-muted/30 transition-colors ${
                                          lot.isFefoNext ? "bg-primary/5 font-medium" : ""
                                        }`}
                                      >
                                        <td className="px-2.5 py-2.5">
                                          {lot.isFefoNext ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-xs animate-pulse">
                                              <Sparkles size={11} /> Consume Next
                                            </span>
                                          ) : (
                                            <span className="text-[11px] text-muted-foreground font-mono">-</span>
                                          )}
                                        </td>
                                        <td className="px-2.5 py-2.5">
                                          <div className="font-bold text-foreground font-mono">{lot.lotCode}</div>
                                          <div className="text-[10px] text-muted-foreground">{lot.sourceType}</div>
                                        </td>
                                        <td className="px-2.5 py-2.5 text-muted-foreground">
                                          {lot.supplierName || "-"}
                                          {lot.supplierLotNo && (
                                            <div className="text-[10px] text-muted-foreground">
                                              Lot: {lot.supplierLotNo}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-2.5 py-2.5 text-muted-foreground">
                                          <div>Rec: {formatDate(lot.receivedDate)}</div>
                                          {lot.manufactureDate && (
                                            <div className="text-[10px]">Mfg: {formatDate(lot.manufactureDate)}</div>
                                          )}
                                        </td>
                                        <td className="px-2.5 py-2.5">{getExpiryBadge(lot)}</td>
                                        <td className="px-2.5 py-2.5 font-bold text-foreground">
                                          {lot.quantityRemaining.toLocaleString(undefined, {
                                            minimumFractionDigits: 3,
                                            maximumFractionDigits: 3,
                                          })}{" "}
                                          <span className="text-[10px] font-normal text-muted-foreground">
                                            {lot.uomName}
                                          </span>
                                        </td>
                                        <td className="px-2.5 py-2.5">
                                          {lot.sharePercent !== null && lot.sharePercent !== undefined ? (
                                            <div className="space-y-1 w-24">
                                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                                <span>{lot.sharePercent}%</span>
                                              </div>
                                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                  className="h-full bg-primary rounded-full transition-all"
                                                  style={{ width: `${Math.min(lot.sharePercent, 100)}%` }}
                                                />
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </td>
                                        <td className="px-2.5 py-2.5">
                                          <StatusBadge status={lot.status} />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
