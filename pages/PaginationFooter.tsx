"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationFooterProps {
  totalItems: number;
  currentPage: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}

export default function PaginationFooter({
  totalItems,
  currentPage,
  itemsPerPage = 10,
  onPageChange,
}: PaginationFooterProps) {
  if (totalItems === 0) return null;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Smart Page Window (Prevents button overflow for 10+ pages)
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 text-xs font-medium text-gray-600 dark:text-gray-400">
      <div>
        Showing <span className="font-bold text-gray-900 dark:text-white">{startIndex + 1}</span> to{" "}
        <span className="font-bold text-gray-900 dark:text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of{" "}
        <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} /> Previous
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => (
            typeof p === "number" ? (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg font-bold transition-colors ${
                  currentPage === p
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="w-6 text-center text-gray-400 font-bold select-none">
                ...
              </span>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
