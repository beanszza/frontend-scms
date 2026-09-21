"use client";

import React from "react";
import { Boxes, Eye, ArrowDownToLine } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PutAwayTask } from "./types";
import { Button } from "@/components/ui/button";

interface PutAwayTableProps {
  tasks: PutAwayTask[];
  loading: boolean;
  onSelectTask: (task: PutAwayTask) => void;
}

export default function PutAwayTable({ tasks, loading, onSelectTask }: PutAwayTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm p-12 text-center text-xs text-muted-foreground animate-pulse">
        Loading Put Away Tasks...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <EmptyState
          icon={Boxes}
          title="No Put Away Tasks Found"
          description="Approved QA inspection lots generate put-away tasks to release materials into available commissary stock."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm min-h-[300px]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">TASK NO.</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">GRN NO.</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PO NO.</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SUPPLIER</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ITEM NAME</th>
            <th className="px-3 py-3 text-right font-bold text-muted-foreground tracking-wider whitespace-nowrap">ACCEPTED QTY</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">LOT CODE</th>
            <th className="px-3 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
            <th className="px-3 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap w-24">ACTION</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((task) => {
            const isPending = task.status === "Pending";
            return (
              <tr key={task.putAwayId} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                  {task.putAwayNumber}
                </td>
                <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                  {task.grnNumber}
                </td>
                <td className="px-3 py-2.5 font-mono font-medium text-foreground whitespace-nowrap">
                  {task.poNumber || "—"}
                </td>
                <td className="px-3 py-2.5 font-medium text-foreground max-w-[150px] truncate" title={task.supplierName}>
                  {task.supplierName || "—"}
                </td>
                <td className="px-3 py-2.5 font-medium text-foreground max-w-[160px] truncate" title={task.itemName}>
                  {task.itemName}
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground whitespace-nowrap">
                  {task.acceptedQuantity.toLocaleString()} {task.uomName}
                </td>
                <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                  {task.lotCode || "—"}
                </td>
                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                  <Button
                    size="sm"
                    onClick={() => onSelectTask(task)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors mx-auto ${
                      isPending
                        ? "bg-foreground text-background hover:bg-foreground/85 shadow-sm"
                        : "border border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {isPending ? "Put Away" : "View"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
