"use client";

import React, { useState } from "react";
import { MoreHorizontal, Truck, Check, XCircle } from "lucide-react";
import { TransferItem } from "./types";

interface StockTransferTableProps {
  transfers: TransferItem[];
  onDispatch: (item: TransferItem) => void;
  onReceive: (item: TransferItem) => void;
  onCancel: (item: TransferItem) => void;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Completed") {
    return <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-foreground text-background border border-foreground">Completed</span>;
  }
  if (status === "In Transit") {
    return <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">In Transit</span>;
  }
  if (status === "Pending") {
    return <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-muted/60 text-foreground border border-border">Pending</span>;
  }
  return <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-muted/30 text-muted-foreground border border-border">{status}</span>;
}

export default function StockTransferTable({
  transfers,
  onDispatch,
  onReceive,
  onCancel,
}: StockTransferTableProps) {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">TRANSFER ID</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PRODUCT</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SOURCE</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">DESTINATION</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">QTY</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">DATE</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
            <th className="px-3 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transfers.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
                No Results Found
              </td>
            </tr>
          ) : (
            transfers.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-3 font-bold text-foreground whitespace-nowrap">{item.id}</td>
                <td className="px-3 py-3 font-medium text-foreground whitespace-nowrap">{item.product}</td>
                <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{item.from}</td>
                <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{item.to}</td>
                <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{item.quantity}</td>
                <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{item.date}</td>
                <td className="px-3 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-3 py-3 text-center relative">
                  <button
                    type="button"
                    onClick={() => setActiveDropdownId(activeDropdownId === item.id ? null : item.id)}
                    className="p-1.5 rounded-lg text-foreground hover:bg-muted transition-colors focus:outline-none"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {activeDropdownId === item.id && (
                    <div className="absolute right-10 top-2 z-[100] w-36 rounded-xl border border-border bg-card shadow-xl py-1.5 text-left">
                      {item.status === "Pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => { onDispatch(item); setActiveDropdownId(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            <Truck size={14} className="shrink-0" /> Dispatch
                          </button>
                          <button
                            type="button"
                            onClick={() => { onCancel(item); setActiveDropdownId(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            <XCircle size={14} className="shrink-0" /> Cancel
                          </button>
                        </>
                      )}
                      {item.status === "In Transit" && (
                        <button
                          type="button"
                          onClick={() => { onReceive(item); setActiveDropdownId(null); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          <Check size={14} className="shrink-0" /> Mark Received
                        </button>
                      )}
                      {item.status === "Completed" && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">Transfer completed</p>
                      )}
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
