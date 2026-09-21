"use client";

import React from "react";
import { FileText, Eye } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { GRN } from "./types";
import { Button } from "@/components/ui/button";

interface GrnTableProps {
  grns: GRN[];
  loading: boolean;
  onSelectGrn: (grn: GRN) => void;
}

export default function GrnTable({ grns, loading, onSelectGrn }: GrnTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm p-12 text-center text-xs text-muted-foreground animate-pulse">
        Loading Goods Receipt Notes...
      </div>
    );
  }

  if (grns.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <EmptyState
          icon={FileText}
          title="No Posted Goods Receipt Notes"
          description="Deliveries counted and received will be listed here with immediate QA handover."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm min-h-[300px]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">GRN NO.</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PR REF.</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PO NUMBER</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">DELIVERY #</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SUPPLIER</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">RECEIVED DATE</th>
            <th className="px-4 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
            <th className="px-4 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap w-24">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {grns.map((grn) => (
            <tr key={grn.grnId} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-foreground whitespace-nowrap">
                {grn.grnNumber}
              </td>
              <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                {grn.prNumber ? (
                  <span className="bg-muted/50 border border-border px-2 py-0.5 rounded text-[11px] font-semibold text-foreground">
                    {grn.prNumber}
                  </span>
                ) : (
                  <span className="text-muted-foreground/60">—</span>
                )}
              </td>
              <td className="px-4 py-3 font-mono font-medium text-foreground whitespace-nowrap">
                {grn.poNumber}
              </td>
              <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                {grn.deliveryNumber || "—"}
              </td>
              <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate" title={grn.supplierName}>
                {grn.supplierName}
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {new Date(grn.receivedDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <StatusBadge status={grn.status} />
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectGrn(grn)}
                  className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
