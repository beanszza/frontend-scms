"use client";

import React, { useState } from "react";
import { AlertOctagon, FileText, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LossReport } from "./types";
import { productionStorage } from "./productionStorage";

export default function LossTab() {
  const [lossReports, setLossReports] = useState<LossReport[]>(() =>
    productionStorage.getLossReports()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<LossReport | null>(null);

  const totalLossBatches = lossReports.length;
  const totalFinancialLoss = lossReports.reduce((sum, r) => sum + r.totalEstimatedLoss, 0);
  const totalUnitsLost = lossReports.reduce((sum, r) => sum + (r.targetYield || 0), 0);

  const filteredReports = lossReports.filter(
    (r) =>
      r.lossId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rejectionReason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Production Loss Reports</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automatic loss tracking and cost accounting for QA-rejected and compromised batches.
          </p>
        </div>
      </div>

      {/* 3 KPI Summary Cards (Clean Inventory Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Total Loss Batches
            </span>
            <svg className="w-20 h-6 text-foreground" viewBox="0 0 80 24" fill="none">
              <path
                d="M 2 8 C 14 10, 24 18, 38 14 C 52 10, 62 20, 76 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="76" cy="18" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {totalLossBatches}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rejected during QA or prep failure
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Estimated Financial Loss
            </span>
            <svg className="w-20 h-6 text-muted-foreground/70" viewBox="0 0 80 24" fill="none">
              <path
                d="M 2 6 C 14 8, 26 18, 40 12 C 54 18, 64 20, 76 22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="76" cy="22" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
              ₱{totalFinancialLoss.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cost of consumed ingredients & supplies
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Target Units Lost
            </span>
            <svg className="w-20 h-6 text-muted-foreground/70" viewBox="0 0 80 24" fill="none">
              <path
                d="M 2 10 C 16 12, 28 16, 42 14 C 56 12, 66 18, 76 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="76" cy="20" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {totalUnitsLost}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total planned product output forfeited
            </p>
          </div>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search by Loss ID, Batch No, product name, or reason..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md h-9 text-xs"
        />
        <span className="text-xs text-muted-foreground">
          Showing {filteredReports.length} of {lossReports.length} records
        </span>
      </div>

      {/* Table of Loss Reports */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            <AlertOctagon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            No production loss reports on file. Rejected batches will automatically appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Loss ID</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Product / Variant</th>
                  <th className="py-3 px-4">Failure Stage</th>
                  <th className="py-3 px-4">Rejection Reason</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 font-mono">Est. Loss Value</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReports.map((report) => (
                  <tr key={report.lossId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {report.lossId}
                    </td>
                    <td className="py-3 px-4 font-mono text-foreground font-semibold">
                      {report.batchNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{report.productName}</div>
                      <div className="text-[10px] text-muted-foreground">{report.variant}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-muted/60 text-foreground">
                        {report.failureStage}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                      {report.rejectionReason}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      ₱{report.totalEstimatedLoss.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                        className="h-7 text-xs font-semibold border-border hover:bg-muted"
                      >
                        <Eye size={12} className="mr-1" /> View Report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Loss Report Breakdown Modal ── */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Loss Report: {selectedReport.lossId}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Batch {selectedReport.batchNumber} &mdash; {selectedReport.productName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Summary details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-border bg-muted/10 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    Product & Variant
                  </span>
                  <span className="font-bold text-foreground">{selectedReport.productName}</span>
                  <div className="text-muted-foreground">{selectedReport.variant}</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    Target Yield
                  </span>
                  <span className="font-bold text-foreground">
                    {selectedReport.targetYield} PCS
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    Logged Date
                  </span>
                  <span className="font-bold text-foreground">
                    {new Date(selectedReport.date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    Estimated Loss
                  </span>
                  <span className="font-mono font-bold text-foreground text-sm">
                    ₱{selectedReport.totalEstimatedLoss.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Rejection reason & inspector */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1.5 text-xs">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                  Rejection Reason & Inspector Assessment
                </span>
                <p className="font-semibold text-foreground">{selectedReport.rejectionReason}</p>
                {selectedReport.notes && (
                  <p className="text-muted-foreground italic">"{selectedReport.notes}"</p>
                )}
                <p className="text-[11px] text-muted-foreground pt-1">
                  Evaluated by: <span className="font-medium text-foreground">{selectedReport.inspector}</span>
                </p>
              </div>

              {/* Lost Ingredients Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Issued Ingredients & Supplies Forfeited ({selectedReport.items.length})
                </h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">Lot Number</th>
                        <th className="py-2.5 px-3">Quantity</th>
                        <th className="py-2.5 px-3">Unit Cost</th>
                        <th className="py-2.5 px-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedReport.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="py-2 px-3 font-semibold text-foreground">
                            {item.itemName}
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">
                            {item.lotNumber}
                          </td>
                          <td className="py-2 px-3">
                            {item.quantity} {item.uom}
                          </td>
                          <td className="py-2 px-3 font-mono">₱{item.unitCost.toFixed(2)}</td>
                          <td className="py-2 px-3 font-mono font-bold text-foreground text-right">
                            ₱{item.totalCost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 font-bold border-t border-border">
                      <tr>
                        <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[10px]">
                          Total Loss Value:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm">
                          ₱{selectedReport.totalEstimatedLoss.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 border-t border-border bg-muted/20">
              <Button
                variant="outline"
                onClick={() => setSelectedReport(null)}
                className="text-xs font-semibold border-border hover:bg-muted"
              >
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
