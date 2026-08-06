"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

import AuditLogsFilterBar from "@/pages/AuditLogsFilterBar";
import AuditLogsTable, { LogEntry } from "@/pages/AuditLogsTable";

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

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const formattedType = typeParam.charAt(0).toUpperCase() + typeParam.slice(1).toLowerCase();
    setTitle(`${formattedType} Transactional Audit Logs`);

    setLoading(true);
    fetchLogs(typeParam).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, [typeParam]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode, specificDate, startDate, endDate]);

  const handleResetFilters = () => {
    setFilterMode("all");
    setSpecificDate("");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setCurrentPage(1);
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

    // Parse log timestamp
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
        if (logDate > end) return false;
      }
    }

    return true;
  });

  const handleExportCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;
    const csvRows: string[] = [
      ["Log ID", "Timestamp", "Activity", "Entity", "User", "Details"].join(",")
    ];
    filteredLogs.forEach((log) => {
      csvRows.push([
        `"${log.id || ''}"`,
        `"${log.timestamp || ''}"`,
        `"${log.activity || ''}"`,
        `"${log.entityName || ''}"`,
        `"${log.user || ''}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`
      ].join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transaction_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-gray-50 dark:bg-gray-900 p-2 sm:p-4 transition-colors font-sans text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-full space-y-5">
        {/* Header Navigation */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Audit trail for Supply Add/Edit/Status, Recipe/BOM modifications, and Inventory movements (+/-)
            </p>
          </div>
        </div>

        {/* Filter Bar Component */}
        <AuditLogsFilterBar
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          specificDate={specificDate}
          setSpecificDate={setSpecificDate}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onResetFilters={handleResetFilters}
          onExportCSV={handleExportCSV}
        />

        {/* Audit Logs Content Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span className="ml-3 text-gray-500 dark:text-gray-400 font-medium">Fetching transaction audit logs...</span>
          </div>
        ) : (
          <AuditLogsTable
            logs={filteredLogs}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
