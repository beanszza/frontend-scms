"use client";

import React from "react";
import { X, ShoppingCart } from "lucide-react";

interface SupplierOrdersModalProps {
  selectedSupplierModal: any;
  onClose: () => void;
}

export default function SupplierOrdersModal({
  selectedSupplierModal,
  onClose,
}: SupplierOrdersModalProps) {
  if (!selectedSupplierModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart size={20} className="text-blue-600" />
              Order Transactions: {selectedSupplierModal.supplierName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Complete history of purchase order transactions including pending and completed orders
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedSupplierModal.totalOrdersPlaced}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">On-Time Deliveries</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedSupplierModal.onTimeDeliveries}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Late Deliveries</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{selectedSupplierModal.lateDeliveries}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Vendor Grade</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedSupplierModal.overallVendorGrade}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-center w-12">#</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold">Order Date</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold">Expected Arrival</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-center">Items Count</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-center">Order Status</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-center">QA Status</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-center">Inspection Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {!selectedSupplierModal.orders || selectedSupplierModal.orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No purchase order transactions found for this supplier.
                    </td>
                  </tr>
                ) : (
                  selectedSupplierModal.orders.map((po: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3.5 text-center font-mono text-xs font-bold text-gray-500 dark:text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-gray-700 dark:text-gray-300 font-medium">{po.orderDate}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-gray-700 dark:text-gray-300">{po.expectedArrivalDate}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center text-gray-700 dark:text-gray-300 font-medium">{po.totalItemsCount} items</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          po.status?.toLowerCase().includes("completed") || po.status?.toLowerCase().includes("received")
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : po.status?.toLowerCase().includes("pending")
                              ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          po.qaStatus?.toLowerCase().includes("pass")
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : po.qaStatus?.toLowerCase().includes("reject")
                              ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                              : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        }`}>
                          {po.qaStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs text-gray-500 dark:text-gray-400">{po.inspectedDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
