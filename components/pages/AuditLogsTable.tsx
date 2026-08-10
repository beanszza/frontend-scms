"use client";

import React from "react";
import { Clock, User } from "lucide-react";
import PaginationFooter from "@/components/pages/PaginationFooter";

export type LogEntry = {
  id: string;
  activity: string;
  entityName: string;
  timestamp: string;
  user: string;
};

interface AuditLogsTableProps {
  logs: LogEntry[];
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage?: number;
}

export default function AuditLogsTable({
  logs,
  currentPage,
  setCurrentPage,
  itemsPerPage = 10,
}: AuditLogsTableProps) {
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = logs.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-background/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="whitespace-nowrap px-4 py-3.5 text-center w-12">#</th>
              <th className="whitespace-nowrap px-4 py-3.5">Action & Event Activity</th>
              <th className="whitespace-nowrap px-4 py-3.5">Target Entity & Details</th>
              <th className="whitespace-nowrap px-4 py-3.5">Date & Exact Time</th>
              <th className="whitespace-nowrap px-4 py-3.5">Performed By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No transaction log records match the selected filters.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log, index) => (
                <tr key={index} className="hover:bg-muted/50 transition-colors">
                  {/* Row Number (#) */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-center font-mono text-xs font-bold text-muted-foreground">
                    {startIdx + index + 1}
                  </td>

                  {/* Activity */}
                  <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-foreground">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.activity.toLowerCase().includes("added") || log.activity.toLowerCase().includes("created") || log.activity.toLowerCase().includes("registered") || log.activity.toLowerCase().includes("onboarded")
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : log.activity.toLowerCase().includes("deducted") || log.activity.toLowerCase().includes("inactive") || log.activity.toLowerCase().includes("removed")
                            ? "bg-rose-50 text-rose-600 border border-rose-200"
                            : "bg-muted text-foreground border border-blue-200"
                      }`}
                    >
                      {log.activity}
                    </span>
                  </td>

                  {/* Entity Name */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground font-medium">
                    {log.entityName}
                  </td>

                  {/* Timestamp (MM/DD/YYYY HH:MM:SS) */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-muted-foreground" />
                      <span>{log.timestamp}</span>
                    </div>
                  </td>

                  {/* Performed By User */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium text-xs">
                      <User size={13} className="text-foreground" />
                      <span>{log.user}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationFooter
        totalItems={logs.length}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
