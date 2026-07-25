"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Clock, User, Info, Calendar, Filter, Search, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

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
    let resData = null;
    try {
      const response = await api.get(`/api/scms/api/AuditLogs?type=${moduleType}`);
      resData = response.data;
    } catch (e) {
      const fallbackRes = await fetch(`http://localhost:5006/api/AuditLogs?type=${moduleType}`);
      if (fallbackRes.ok) {
        resData = await fallbackRes.json();
      }
    }
    if (Array.isArray(resData)) {
      return resData;
    } else if (resData?.data && Array.isArray(resData.data)) {
      return resData.data;
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
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  // Date & Search Filter States
  const [filterMode, setFilterMode] = useState<"all" | "specific" | "range">("all");
  const [specificDate, setSpecificDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const formattedType = typeParam.charAt(0).toUpperCase() + typeParam.slice(1).toLowerCase();
    setTitle(`${formattedType} Transactional Logs`);

    setLoading(true);
    fetchLogs(typeParam).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, [typeParam]);

  const handleResetFilters = () => {
    setFilterMode("all");
    setSpecificDate("");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  // Filter logs based on date range, specific date, and search term
  const filteredLogs = logs.filter((log) => {
    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesActivity = log.activity.toLowerCase().includes(q);
      const matchesEntity = log.entityName.toLowerCase().includes(q);
      const matchesUser = log.user.toLowerCase().includes(q);
      if (!matchesActivity && !matchesEntity && !matchesUser) return false;
    }

    // Parse log timestamp (Format expected: MM/DD/YYYY HH:mm or YYYY-MM-DD)
    const logDateStr = log.timestamp.split(" ")[0]; // Get MM/DD/YYYY
    const [month, day, year] = logDateStr.split("/").map(Number);
    const logDate = new Date(year, month - 1, day);

    // 2. Specific Date Filter
    if (filterMode === "specific" && specificDate) {
      const [specYear, specMonth, specDay] = specificDate.split("-").map(Number);
      const targetDate = new Date(specYear, specMonth - 1, specDay);
      if (
        logDate.getFullYear() !== targetDate.getFullYear() ||
        logDate.getMonth() !== targetDate.getMonth() ||
        logDate.getDate() !== targetDate.getDate()
      ) {
        return false;
      }
    }

    // 3. Date Range Filter
    if (filterMode === "range") {
      if (startDate) {
        const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
        const start = new Date(startYear, startMonth - 1, startDay);
        if (logDate < start) return false;
      }
      if (endDate) {
        const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
        const end = new Date(endYear, endMonth - 1, endDay);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 font-sans">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              View-only historical activity and transactional change history for {typeParam.toLowerCase()}s.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Filter Mode Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Filter size={14} className="text-blue-600" /> Filter By:
              </span>
              <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filterMode === "all"
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
                >
                  All History
                </button>
                <button
                  onClick={() => setFilterMode("specific")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filterMode === "specific"
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
                >
                  Specific Date
                </button>
                <button
                  onClick={() => setFilterMode("range")}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filterMode === "range"
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
                >
                  Date Range
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search activity or entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Conditional Date Pickers */}
          {filterMode === "specific" && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" /> Select Specific Date:
              </label>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              {specificDate && (
                <button
                  onClick={() => setSpecificDate("")}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Clear Date
                </button>
              )}
            </div>
          )}

          {filterMode === "range" && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Calendar size={14} className="text-blue-600" /> Start Date:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:underline font-semibold"
                >
                  <RotateCcw size={12} /> Reset Dates
                </button>
              )}
            </div>
          )}
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
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Loading transactional logs...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No matching transaction logs found for the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
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
