"use client";

import React from "react";
import { Clock, User } from "lucide-react";
import PaginationFooter from "@/pages/PaginationFooter";

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
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="whitespace-nowrap px-4 py-3.5 text-center w-12">#</th>
              <th className="whitespace-nowrap px-4 py-3.5">Action & Event Activity</th>
              <th className="whitespace-nowrap px-4 py-3.5">Target Entity & Details</th>
              <th className="whitespace-nowrap px-4 py-3.5">Date & Exact Time</th>
              <th className="whitespace-nowrap px-4 py-3.5">Performed By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No transaction log records match the selected filters.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Row Number (#) */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-center font-mono text-xs font-bold text-gray-500 dark:text-gray-400">
                    {startIdx + index + 1}
                  </td>

                  {/* Activity */}
                  <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-gray-900 dark:text-white">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.activity.toLowerCase().includes("added") || log.activity.toLowerCase().includes("created") || log.activity.toLowerCase().includes("registered") || log.activity.toLowerCase().includes("onboarded")
                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : log.activity.toLowerCase().includes("deducted") || log.activity.toLowerCase().includes("inactive") || log.activity.toLowerCase().includes("removed")
                            ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                            : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      {log.activity}
                    </span>
                  </td>

                  {/* Entity Name */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-gray-700 dark:text-gray-300 font-medium">
                    {log.entityName}
                  </td>

                  {/* Timestamp (MM/DD/YYYY HH:MM:SS) */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-gray-600 dark:text-gray-400 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-gray-400" />
                      <span>{log.timestamp}</span>
                    </div>
                  </td>

                  {/* Performed By User */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1.5 font-medium text-xs">
                      <User size={13} className="text-blue-500" />
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
