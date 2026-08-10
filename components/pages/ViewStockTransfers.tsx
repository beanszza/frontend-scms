"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { Plus, X, RotateCw, ArrowRight, CheckCircle, Package, MoreHorizontal, Eye, Pencil, XCircle, Truck } from "lucide-react";
import api from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="w-[90vw] max-w-[90vw] sm:max-w-[80vw] md:max-w-[700px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto p-md sm:p-lg rounded-lg sm:rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {title}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-red-500">
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
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: number, newStatus: string, message: string } | null>(null);

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
        return <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">{status}</span>;
      case "In Transit":
        return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-foreground">{status}</span>;
      case "Completed":
        return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">{status}</span>;
      case "Cancelled":
        return <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">{status}</span>;
      default:
        return <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 transition-colors">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Inventory & Stock Transfers
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your stock movements across different locations.
          </p>
        </div>

        <Button
          onClick={() => {
            setErrorMsg("");
            setOpenModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={18} />
          Create Transfer
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-border">
            <tr className="text-left text-xs uppercase text-muted-foreground bg-muted">
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
                <td colSpan={8} className="text-center py-10 text-muted-foreground">Loading transfers...</td>
              </tr>
            ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
                    No Results Found
                  </td>
                </tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.transferId} className="border-b border-border hover:bg-muted/50">
                  <td className="px-5 py-5 text-sm font-medium text-foreground">#{t.transferId}</td>
                  <td className="px-5 py-5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-muted-foreground" />
                      {t.productName}
                    </div>
                  </td>
                  <td className="px-5 py-5 text-sm text-muted-foreground">{t.sourceLocationName}</td>
                  <td className="px-5 py-5 text-sm text-muted-foreground">{t.destLocationName}</td>
                  <td className="px-5 py-5 text-sm font-bold text-foreground">{t.transferQuantity}</td>
                  <td className="px-5 py-5">{getStatusBadge(t.status)}</td>
                  <td className="px-5 py-5 text-sm text-muted-foreground">{new Date(t.transferDate).toLocaleString()}</td>
                  <td className="px-5 py-5 text-right relative">
                    <div className="relative inline-block text-center">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeDropdownId === t.transferId) {
                            setActiveDropdownId(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const leftPos = rect.right - 176 + window.scrollX;
                            setDropdownPosition({
                              top: rect.bottom + window.scrollY,
                              left: Math.max(8, leftPos)
                            });
                            setActiveDropdownId(t.transferId);
                          }
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
                      >
                        <MoreHorizontal size={18} />
                      </Button>

                      {activeDropdownId === t.transferId && dropdownPosition && createPortal(
                        <>
                          <div
                            className="fixed inset-0 z-[199] cursor-default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(null);
                            }}
                          />
                          <div
                            style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
                            className="absolute w-44 rounded-xl border border-border bg-card shadow-xl z-[200] py-1.5 focus:outline-none text-left"
                          >
                            <Button
                              onClick={() => {
                                alert("View functionality not implemented yet.");
                                setActiveDropdownId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                            >
                              <Eye size={14} className="text-muted-foreground" />
                              View
                            </Button>
                            {t.status === "Pending" && (
                              <Button
                                onClick={() => {
                                  alert("Edit functionality not implemented yet.");
                                  setActiveDropdownId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                              >
                                <Pencil size={14} className="text-foreground" />
                                Edit
                              </Button>
                            )}
                            {t.status === "Pending" && (
                              <Button
                                onClick={() => {
                                  setConfirmAction({
                                    id: t.transferId,
                                    newStatus: "In Transit",
                                    message: `Are you sure you want to dispatch transfer #${t.transferId}?`
                                  });
                                  setActiveDropdownId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                              >
                                <Truck size={14} className="text-foreground" />
                                Dispatch
                              </Button>
                            )}
                            {t.status === "In Transit" && (
                              <Button
                                onClick={() => {
                                  handleUpdateStatus(t.transferId, "Completed");
                                  setActiveDropdownId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                              >
                                <CheckCircle size={14} className="text-muted-foreground" />
                                Complete
                              </Button>
                            )}
                            {t.status === "Pending" && (
                              <Button
                                onClick={() => {
                                  setConfirmAction({
                                    id: t.transferId,
                                    newStatus: "Cancelled",
                                    message: `Are you sure you want to cancel transfer #${t.transferId}?`
                                  });
                                  setActiveDropdownId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-muted transition-colors"
                              >
                                <XCircle size={14} />
                                Cancel
                              </Button>
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

      <Modal open={openModal} title="Create Stock Transfer" onClose={() => setOpenModal(false)}>
        <form onSubmit={handleCreateTransfer} className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="mb-2 block text-sm font-semibold text-muted-foreground">Product No.</label>
            <Input
              type="number"
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              placeholder="e.g. 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-muted-foreground">Source Location No.</label>
              <Input
                type="number"
                required
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-muted-foreground">Dest Location No.</label>
              <Input
                type="number"
                required
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
                placeholder="e.g. 2"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-muted-foreground">Transfer Quantity</label>
            <Input
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              placeholder="Amount to transfer"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => setOpenModal(false)}
              className="px-5 py-2.5 text-sm font-semibold text-foreground bg-muted hover:bg-muted rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl"
            >
              Create Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          onConfirm={() => {
            handleUpdateStatus(confirmAction.id, confirmAction.newStatus);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
