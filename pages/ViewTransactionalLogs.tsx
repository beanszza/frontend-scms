"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Clock, User, Info } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type LogEntry = {
  id: string;
  activity: string;
  entityName: string;
  timestamp: string;
  user: string;
};

const fetchLogs = async (type: string | null): Promise<LogEntry[]> => {
  const moduleType = type?.toLowerCase() || "supply";
  try {
    const res = await fetch(`http://localhost:5000/api/AuditLogs?type=${moduleType}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch logs:", error);
  }
  return [];
};

export default function ViewTransactionalLogs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get("type") || "Supply";
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    // Capitalize type for title
    const formattedType = typeParam.charAt(0).toUpperCase() + typeParam.slice(1).toLowerCase();
    setTitle(`${formattedType} Transactional Logs`);
    
    fetchLogs(typeParam).then(data => setLogs(data));
  }, [typeParam]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 font-sans">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {title}
              </h1>
            </div>
            <p className="mt-1 ml-11 text-sm text-gray-500 dark:text-gray-400">
              View-only historical changes and activity for {typeParam.toLowerCase()}s.
            </p>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Activity</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Entity Name</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Timestamp (MM/DD/YYYY)</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No logs found for this module.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Info size={16} className="text-blue-500" />
                          <span className="font-medium text-gray-900 dark:text-white">{log.activity}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {log.entityName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <Clock size={14} />
                          {log.timestamp}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <User size={14} className="text-gray-400" />
                          {log.user}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
