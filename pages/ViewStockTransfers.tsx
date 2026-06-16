"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, RotateCw, ArrowRight, CheckCircle, Package } from "lucide-react";
import api from "../lib/api";

type StockTransfer = {
  transferId: number;
  productId: number;
  productName: string;
  sourceLocationId: number;
  sourceLocationName: string;
  destLocationId: number;
  destLocationName: string;
  transferQuantity: number;
  status: string;
  transferDate: string;
};

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-y-auto max-h-[95vh] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={22} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default function ViewStockTransfers() {
  useDarkMode();

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [productId, setProductId] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [destLocationId, setDestLocationId] = useState("");
  const [quantity, setQuantity] = useState("");

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/StockTransfers");
      if (res.data.success) {
        setTransfers(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching transfers", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await api.post("/api/StockTransfers", {
        productId: parseInt(productId),
        sourceLocationId: parseInt(sourceLocationId),
        destLocationId: parseInt(destLocationId),
        transferQuantity: parseInt(quantity),
      });

      if (res.data.success) {
        setOpenModal(false);
        fetchTransfers();
        // Reset form
        setProductId("");
        setSourceLocationId("");
        setDestLocationId("");
        setQuantity("");
      } else {
        setErrorMsg(res.data.message || "Failed to create transfer");
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || "An error occurred");
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await api.put(`/api/StockTransfers/${id}/status`, {
        status: newStatus,
      });
      if (res.data.success) {
        fetchTransfers();
      } else {
        alert(res.data.message);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "An error occurred");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <span className="rounded-full bg-yellow-100 dark:bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-400">{status}</span>;
      case "In Transit":
        return <span className="rounded-full bg-blue-100 dark:bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">{status}</span>;
      case "Completed":
        return <span className="rounded-full bg-green-100 dark:bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">{status}</span>;
      default:
        return <span className="rounded-full bg-gray-100 dark:bg-gray-500/10 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-400">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#101828] p-4 sm:p-6 transition-colors">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Inventory & Stock Transfers
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage your stock movements across different locations.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg("");
            setOpenModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Transfer
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1D2939]">
              <th className="px-5 py-4">Transfer No.</th>
              <th className="px-5 py-4">Product</th>
              <th className="px-5 py-4">Source Location</th>
              <th className="px-5 py-4">Dest Location</th>
              <th className="px-5 py-4">Quantity</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">Loading transfers...</td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">No stock transfers found.</td>
              </tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.transferId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-5 py-5 text-sm font-medium text-gray-900 dark:text-white">#{t.transferId}</td>
                  <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      {t.productName}
                    </div>
                  </td>
                  <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{t.sourceLocationName}</td>
                  <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{t.destLocationName}</td>
                  <td className="px-5 py-5 text-sm font-bold text-gray-900 dark:text-white">{t.transferQuantity}</td>
                  <td className="px-5 py-5">{getStatusBadge(t.status)}</td>
                  <td className="px-5 py-5 text-sm text-gray-500">{new Date(t.transferDate).toLocaleString()}</td>
                  <td className="px-5 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {t.status === "Pending" && (
                        <button
                          onClick={() => handleUpdateStatus(t.transferId, "In Transit")}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-2 rounded-lg hover:bg-blue-100"
                        >
                          <ArrowRight size={14} /> Start Transit
                        </button>
                      )}
                      {t.status === "In Transit" && (
                        <button
                          onClick={() => handleUpdateStatus(t.transferId, "Completed")}
                          className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 px-3 py-2 rounded-lg hover:bg-green-100"
                        >
                          <CheckCircle size={14} /> Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={openModal} title="Create Stock Transfer" onClose={() => setOpenModal(false)}>
        <form onSubmit={handleCreateTransfer} className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Product No.</label>
            <input
              type="number"
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
              placeholder="e.g. 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Source Location No.</label>
              <input
                type="number"
                required
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Dest Location No.</label>
              <input
                type="number"
                required
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
                placeholder="e.g. 2"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Transfer Quantity</label>
            <input
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
              placeholder="Amount to transfer"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Create Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
