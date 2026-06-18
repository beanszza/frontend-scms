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

const generateMockLogs = (type: string | null): LogEntry[] => {
  const moduleType = type?.toLowerCase() || "supply";
  
  if (moduleType === "supplier") {
    return [
      { id: "1", activity: "Created new Supplier", entityName: "Acme Supplies Ltd.", timestamp: "06/18/2026 14:30", user: "Admin (John)" },
      { id: "2", activity: "Updated Contact Info", entityName: "Global Packaging Inc.", timestamp: "06/17/2026 09:15", user: "Jane Smith" },
      { id: "3", activity: "Deactivated Supplier", entityName: "Old Reliable Farms", timestamp: "06/15/2026 16:45", user: "Admin (John)" },
      { id: "4", activity: "Created new Supplier", entityName: "TechCorp Resources", timestamp: "06/10/2026 11:20", user: "Mike Johnson" },
      { id: "5", activity: "Updated Address", entityName: "Acme Supplies Ltd.", timestamp: "06/05/2026 08:00", user: "Admin (John)" },
    ];
  } else if (moduleType === "recipe") {
    return [
      { id: "1", activity: "Created new Recipe", entityName: "Classic Longganisa 50pcs", timestamp: "06/18/2026 15:45", user: "Chef Maria" },
      { id: "2", activity: "Updated Ingredients", entityName: "Spicy Tocino 300g", timestamp: "06/17/2026 10:30", user: "Admin (John)" },
      { id: "3", activity: "Created new Recipe", entityName: "Premium Siomai 1000pcs", timestamp: "06/12/2026 13:20", user: "Chef Maria" },
    ];
  } else {
    // Default to Supply
    return [
      { id: "1", activity: "Added New Supply", entityName: "Ground Pork", timestamp: "06/19/2026 08:30", user: "Admin (John)" },
      { id: "2", activity: "Updated Reorder Point", entityName: "Garlic", timestamp: "06/18/2026 11:15", user: "Jane Smith" },
      { id: "3", activity: "Added New Supply", entityName: "Pineapple Juice", timestamp: "06/15/2026 09:00", user: "Mike Johnson" },
      { id: "4", activity: "Deactivated Supply", entityName: "Expired Seasoning", timestamp: "06/14/2026 17:05", user: "Admin (John)" },
    ];
  }
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
    setLogs(generateMockLogs(typeParam));
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
