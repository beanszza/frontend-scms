"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Eye, Pencil, Truck, XCircle, CheckCircle } from "lucide-react";

type Transfer = {
  id: string;
  displayId?: string;
  productId?: number;
  product: string;
  from: string;
  destLocationId?: number;
  to: string;
  quantity: number;
  date: string;
  rawDate?: string;
  status: "Completed" | "In Transit" | "Pending" | "Cancelled";
};

interface StockTransferTableProps {
  transfers: Transfer[];
  onDispatchClick: (transfer: Transfer) => void;
  onCompleteClick: (id: string) => void;
  onCancelClick?: (transfer: Transfer) => void;
  onEditClick?: (transfer: Transfer) => void;
  onViewClick?: (transfer: Transfer) => void;
}

export default function StockTransferTable({ transfers, onDispatchClick, onCompleteClick, onCancelClick, onEditClick, onViewClick }: StockTransferTableProps) {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              {["TRANSFER NO.", "PRODUCT", "FROM", "TO", "QUANTITY", "TRANSFER DATE", "STATUS", "ACTIONS"].map(h => (
                <th key={h} className={`px-4 py-3 ${h === "ACTIONS" ? "text-center" : "text-left"} font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transfers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                  No Results Found
                </td>
              </tr>
            ) : (
              transfers.map(t => (
                <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{t.displayId || t.id}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{t.product}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.from}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.to}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{t.quantity}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    t.status === "Completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    t.status === "In Transit" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    t.status === "Cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center relative">
                  <div className="relative inline-block text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeDropdownId === t.id) {
                          setActiveDropdownId(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const leftPos = rect.right - 176 + window.scrollX;
                          setDropdownPosition({
                            top: rect.bottom + window.scrollY,
                            left: Math.max(8, leftPos)
                          });
                          setActiveDropdownId(t.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {activeDropdownId === t.id && dropdownPosition && createPortal(
                      <>
                        <div
                          className="fixed inset-0 z-[9998] cursor-default"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(null);
                          }}
                        />
                        <div
                          style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
                          className="absolute w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-[9999] py-1.5 focus:outline-none text-left"
                        >
                          <button
                            onClick={() => {
                              onViewClick?.(t);
                              setActiveDropdownId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Eye size={14} className="text-gray-500" />
                            View
                          </button>
                          {t.status === "Pending" && (
                            <button
                              onClick={() => {
                                onEditClick?.(t);
                                setActiveDropdownId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Pencil size={14} className="text-blue-600 dark:text-blue-400" />
                              Edit
                            </button>
                          )}
                          {t.status === "Pending" && (
                            <button
                              onClick={() => {
                                onDispatchClick(t);
                                setActiveDropdownId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Truck size={14} className="text-blue-600 dark:text-blue-400" />
                              Dispatch
                            </button>
                          )}
                          {t.status === "In Transit" && (
                            <button
                              onClick={() => {
                                onCompleteClick(t.id);
                                setActiveDropdownId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                              Complete
                            </button>
                          )}
                          {t.status === "Pending" && (
                            <button
                              onClick={() => {
                                onCancelClick?.(t);
                                setActiveDropdownId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            >
                              <XCircle size={14} />
                              Cancel
                            </button>
                          )}
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}