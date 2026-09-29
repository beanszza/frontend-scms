"use client";

import React from "react";
import { MoreHorizontal, Eye } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PutAwayTask } from "./types";

interface PutAwayTableProps {
  tasks: PutAwayTask[];
  loading: boolean;
  onSelectTask: (task: PutAwayTask) => void;
}

export default function PutAwayTable({ tasks, loading, onSelectTask }: PutAwayTableProps) {
  const [activeMenuId, setActiveMenuId] = React.useState<number | null>(null);
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm p-12 text-center text-xs text-muted-foreground animate-pulse">
        Loading Put Away Tasks...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm overflow-visible">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">TASK NO.</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">GOODS RECEIPT NOTE NO.</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PURCHASE ORDER NO.</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SUPPLIER</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ITEM NAME</th>
            <th className="px-3 py-3 text-right font-bold text-muted-foreground tracking-wider whitespace-nowrap">ACCEPTED QTY</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">LOT CODE</th>
            <th className="px-3 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
            <th className="px-3 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap w-24">ACTION</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-xs text-muted-foreground">
                No put-away tasks found
              </td>
            </tr>
          ) : (
            tasks.map((task) => {
              const isPending = task.status === "Pending";
              return (
                <tr
                  key={task.putAwayId}
                  onClick={() => onSelectTask(task)}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                    {task.putAwayNumber}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                    {task.grnNumber}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                    {task.poNumber || "—"}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground max-w-[150px] truncate" title={task.supplierName}>
                    {task.supplierName}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground max-w-[150px] truncate" title={task.itemName}>
                    {task.itemName}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                    {task.acceptedQuantity.toLocaleString()} {task.uomName || "Units"}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">
                    {task.lotCode || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === task.putAwayId ? null : task.putAwayId)}
                      className="p-1.5 rounded-lg text-foreground hover:bg-muted transition-colors focus:outline-none"
                      title="Actions"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {activeMenuId === task.putAwayId && (
                      <div className="absolute right-6 top-2 z-[100] w-36 rounded-xl border border-border bg-card shadow-xl py-1.5 text-left">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTask(task);
                            setActiveMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          <Eye size={14} className="shrink-0" /> {isPending ? "Put Away" : "View Task"}
                        </button>
                      </div>
                    )}
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
