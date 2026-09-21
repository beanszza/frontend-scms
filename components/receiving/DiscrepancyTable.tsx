"use client";

import React from "react";
import { AlertTriangle, Eye, ArrowRightCircle } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Discrepancy } from "./types";
import { Button } from "@/components/ui/button";

interface DiscrepancyTableProps {
  discrepancies: Discrepancy[];
  loading: boolean;
  onSelectDiscrepancy: (item: Discrepancy) => void;
}

export default function DiscrepancyTable({
  discrepancies,
  loading,
  onSelectDiscrepancy,
}: DiscrepancyTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm p-12 text-center text-xs text-muted-foreground animate-pulse">
        Loading Discrepancies...
      </div>
    );
  }

  if (discrepancies.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <EmptyState
          icon={AlertTriangle}
          title="No Discrepancies Found"
          description="Variance counts (shortages, over-supplies) from GRN and QA rejections automatically create audit records here."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm min-h-[300px]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">DISCREPANCY NO.</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">TYPE</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">GRN NO.</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SUPPLIER</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ITEM</th>
            <th className="px-3 py-3 text-right font-bold text-muted-foreground tracking-wider whitespace-nowrap">VARIANCE</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">RESOLUTION / DOCS</th>
            <th className="px-3 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
            <th className="px-3 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap w-20">ACTION</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {discrepancies.map((d) => {
            const isOpen = d.status === "Open";
            const isShort = d.discrepancyType === "PartialShort" || d.discrepancyType === "Short";
            const isOver = d.discrepancyType === "OverSupply" || d.discrepancyType === "Over";

            return (
              <tr key={d.discrepancyId} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                  {d.discrepancyNumber}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-[11px] font-semibold bg-muted/60 border border-border px-2 py-0.5 rounded text-foreground">
                    {isShort ? "Partial / Short" : isOver ? "Over Supply" : "Rejected"}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono font-medium text-foreground whitespace-nowrap">
                  {d.grnNumber || "—"}
                </td>
                <td className="px-3 py-2.5 font-medium text-foreground max-w-[130px] truncate" title={d.supplierName}>
                  {d.supplierName || "—"}
                </td>
                <td className="px-3 py-2.5 font-medium text-foreground max-w-[120px] truncate" title={d.itemName}>
                  {d.itemName}
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground whitespace-nowrap">
                  {isOver ? "+" : "-"}
                  {d.discrepancyQuantity.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                  {d.resolutionType ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground text-[11px]">{d.resolutionType}</span>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                        {d.lossReportNumber && (
                          <span className="bg-muted border border-border px-1.5 py-0.2 rounded font-semibold text-foreground">
                            {d.lossReportNumber}
                          </span>
                        )}
                        {d.rtvNumber && (
                          <span className="bg-muted border border-border px-1.5 py-0.2 rounded font-semibold text-foreground">
                            {d.rtvNumber}
                          </span>
                        )}
                        {d.ncrNumber && (
                          <span className="bg-muted border border-border px-1.5 py-0.2 rounded font-semibold text-foreground">
                            {d.ncrNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="italic text-[11px] text-muted-foreground font-medium">
                      Pending Action
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                  <Button
                    size="sm"
                    onClick={() => onSelectDiscrepancy(d)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors mx-auto ${
                      isOpen
                        ? "bg-foreground text-background hover:bg-foreground/85 shadow-sm"
                        : "border border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {isOpen ? "Resolve" : "View"}
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
