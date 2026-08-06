"use client";

import React from "react";
import { Filter, Search, Calendar, RotateCcw } from "lucide-react";

interface AuditLogsFilterBarProps {
  filterMode: "all" | "specific" | "range";
  setFilterMode: (mode: "all" | "specific" | "range") => void;
  specificDate: string;
  setSpecificDate: (d: string) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onResetFilters: () => void;
}

export default function AuditLogsFilterBar({
  filterMode,
  setFilterMode,
  specificDate,
  setSpecificDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  searchQuery,
  setSearchQuery,
  onResetFilters,
}: AuditLogsFilterBarProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Mode Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter size={14} className="text-blue-600" /> Filter History:
          </span>
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === "all"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All History
            </button>
            <button
              onClick={() => setFilterMode("specific")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === "specific"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Specific Date
            </button>
            <button
              onClick={() => setFilterMode("range")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === "range"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Date Range
            </button>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search activity, items, users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Specific Date Picker */}
      {filterMode === "specific" && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Calendar size={14} className="text-blue-600" /> Select Date:
          </label>
          <input
            type="date"
            value={specificDate}
            onChange={(e) => setSpecificDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
          {specificDate && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-rose-600 hover:underline font-semibold"
            >
              <RotateCcw size={12} /> Clear Date
            </button>
          )}
        </div>
      )}

      {/* Date Range Pickers */}
      {filterMode === "range" && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Calendar size={14} className="text-blue-600" /> Start:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">End:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-rose-600 hover:underline font-semibold"
            >
              <RotateCcw size={12} /> Clear Range
            </button>
          )}
        </div>
      )}
    </div>
  );
}
