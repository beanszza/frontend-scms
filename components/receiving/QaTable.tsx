"use client";

import React from "react";
import { ClipboardCheck, Eye, MoreHorizontal } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { QAInspection } from "./types";
import { Button } from "@/components/ui/button";

interface QaTableProps {
  inspections: QAInspection[];
  loading: boolean;
  onSelectInspection: (inspection: QAInspection) => void;
  pendingView: boolean;
}

export default function QaTable({ inspections, loading, onSelectInspection, pendingView }: QaTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm p-12 text-center text-xs text-muted-foreground animate-pulse">
        Loading Quality Inspections...
      </div>
    );
  }

  if (inspections.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <EmptyState
          icon={ClipboardCheck}
          title="No Quality Inspections Found"
          description="Posted GRNs automatically hand over items for incoming QA inspection and disposition."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm min-h-[300px]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">{pendingView ? "GRN NO." : "INSPECTION NO."}</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">{pendingView ? "SUPPLIER" : "GRN NO."}</th>
            {!pendingView && <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SUPPLIER</th>}
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">DATE</th>
            {!pendingView && <>
              <th className="px-4 py-3 text-right font-bold text-muted-foreground tracking-wider whitespace-nowrap">RECEIVED</th>
              <th className="px-4 py-3 text-right font-bold text-muted-foreground tracking-wider whitespace-nowrap">PASSED</th>
              <th className="px-4 py-3 text-right font-bold text-muted-foreground tracking-wider whitespace-nowrap">REJECTED</th>
            </>}
            <th className="px-4 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
            <th className="px-4 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap w-28">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {inspections.map((qc) => {
            const isReady =
              qc.status === "Pending" ||
              qc.status === "InInspection" ||
              qc.status === "InProgress" ||
              qc.status === "In Inspection";

            return (
              <tr key={qc.inspectionId} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                  {pendingView ? (qc.referenceNumber || qc.grnNumber) : qc.inspectionNumber}
                </td>
                <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate" title={qc.supplierName}>
                  {pendingView ? (qc.supplierName || "—") : (qc.referenceNumber || qc.grnNumber)}
                </td>
                {!pendingView && <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate" title={qc.supplierName}>{qc.supplierName || "—"}</td>}
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(qc.inspectionDate).toLocaleDateString()}
                </td>
                {!pendingView && <>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-foreground whitespace-nowrap">{qc.totalReceivedQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-foreground whitespace-nowrap">{qc.totalAcceptedQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-foreground whitespace-nowrap">{qc.totalRejectedQuantity.toLocaleString()}</td>
                </>}
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <StatusBadge status={qc.status} />
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <Button
                    size="sm"
                    onClick={() => onSelectInspection(qc)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 mx-auto ${
                      isReady
                        ? "bg-foreground text-background hover:bg-foreground/85 shadow-sm"
                        : "border border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {isReady ? <MoreHorizontal className="w-4 h-4" /> : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> View
                      </>
                    )}
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
