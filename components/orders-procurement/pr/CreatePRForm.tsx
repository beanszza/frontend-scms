"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import api from "@/lib/api";
import { PurchaseRequisition, PRItem } from "../types";
import { useAuth } from "@/context/AuthContext";
import ConfirmModal from "@/components/ConfirmModal";

export interface CreatePRModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: PurchaseRequisition;
  isEdit?: boolean;
}

export interface SupplyOption {
  itemId: number;
  itemCode: string;
  itemName: string;
  uomName: string;
  currentStock: number;
}

export function CreatePRModal({
  open,
  onClose,
  onSuccess,
  initialData,
  isEdit = false,
}: CreatePRModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Supplies list
  const [suppliesList, setSuppliesList] = useState<SupplyOption[]>([]);
  const [loadingSupplies, setLoadingSupplies] = useState(true);

  // Form State
  const [prNumber, setPrNumber] = useState(initialData?.prNumber || "PR-2026-0001");
  const [requestDate, setRequestDate] = useState(
    initialData?.requestDate
      ? new Date(initialData.requestDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
  );
  const defaultAccountName = user?.firstName
    ? `${user.firstName} ${user.lastName}`.trim()
    : (user?.username || "");

  const [requestedBy, setRequestedBy] = useState(
    initialData?.requestedBy && initialData.requestedBy !== "Unauthenticated"
      ? initialData.requestedBy
      : ""
  );

  const [department, setDepartment] = useState(initialData?.department || "");
  const [requestType, setRequestType] = useState(initialData?.requestType || "");
  const [priority, setPriority] = useState(initialData?.priority || "");
  const [requiredDate, setRequiredDate] = useState(
    initialData?.requiredDate
      ? new Date(initialData.requiredDate).toISOString().split("T")[0]
      : ""
  );
  const [statusText, setStatusText] = useState(initialData?.status || "Draft");

  // Items table (starts completely empty when creating new)
  const [items, setItems] = useState<PRItem[]>(
    initialData?.items?.map((it) => ({
      ...it,
      requestedQuantity: it.requestedQuantity || 1,
    })) || []
  );

  // Purpose & Notes
  const [purpose, setPurpose] = useState(initialData?.purpose || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Validation & Modal State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: "draft" | "submit" | "cancel";
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset or populate on open
  useEffect(() => {
    if (open) {
      if (initialData) {
        if (initialData.prNumber) setPrNumber(initialData.prNumber);
        if (initialData.requestDate) {
          setRequestDate(
            new Date(initialData.requestDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          );
        }
        setRequestedBy(
          initialData.requestedBy && initialData.requestedBy !== "Unauthenticated"
            ? initialData.requestedBy
            : defaultAccountName || ""
        );
        setDepartment(initialData.department || "");
        setRequestType(initialData.requestType || "");
        setPriority(initialData.priority || "");
        setRequiredDate(
          initialData.requiredDate
            ? new Date(initialData.requiredDate).toISOString().split("T")[0]
            : ""
        );
        setStatusText(initialData.status || "Draft");
        setPurpose(initialData.purpose || "");
        setNotes(initialData.notes || "");
        setItems(
          initialData.items?.map((it) => ({
            ...it,
            requestedQuantity: it.requestedQuantity || 1,
          })) || []
        );
        setErrors({});
      } else {
        // Completely empty form when creating a new PR
        setRequestDate(
          new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        );
        setRequestedBy("");
        setDepartment("");
        setRequestType("");
        setPriority("");
        setRequiredDate("");
        setStatusText("Draft");
        setPurpose("");
        setNotes("");
        setItems([]);
        setErrors({});
      }
    }
  }, [open, initialData, user, defaultAccountName]);

  // Fetch supplies and next PR number
  useEffect(() => {
    if (!open) return;

    const fetchSuppliesAndNumber = async () => {
      try {
        setLoadingSupplies(true);
        const [itemsRes, invRes, prRes] = await Promise.allSettled([
          api.get("/api/scms/api/Items?page=1&pageSize=1000"),
          api.get("/api/scms/api/Inventories?page=1&pageSize=1000"),
          api.get("/api/scms/api/PurchaseRequisitions"),
        ]);

        let rawItems: any[] = [];
        let stockMap: Record<number, number> = {};

        if (itemsRes.status === "fulfilled" && itemsRes.value.data?.success) {
          rawItems = itemsRes.value.data.data.items || itemsRes.value.data.data || [];
        }

        if (invRes.status === "fulfilled" && invRes.value.data?.success) {
          const rawInv = invRes.value.data.data.items || invRes.value.data.data || [];
          rawInv.forEach((inv: any) => {
            if (inv.itemId) {
              stockMap[inv.itemId] = (stockMap[inv.itemId] || 0) + (Number(inv.currentStock) || 0);
            }
          });
        }

        const formatted: SupplyOption[] = rawItems
          .filter((it: any) => it.categoryName !== "Finished Good" && it.categoryName !== "Finished Goods")
          .map((it: any) => ({
            itemId: it.itemId,
            itemCode: it.itemCode || `SPL-${String(it.itemId).padStart(4, "0")}`,
            itemName: it.itemName,
            uomName: it.uomName || it.uom?.abbreviation || it.stockUom?.abbreviation || "pcs",
            currentStock: stockMap[it.itemId] ?? 0,
          }));

        setSuppliesList(formatted);

        // Preview PR number if creating new
        if (!initialData?.prNumber) {
          if (prRes.status === "fulfilled" && prRes.value.data?.success) {
            const list: any[] = prRes.value.data.data || [];
            const year = new Date().getFullYear();
            let maxSeq = 0;
            list.forEach((pr) => {
              if (pr.prNumber) {
                const match = pr.prNumber.match(/PR-\d{4}-(\d+)/);
                if (match) {
                  const num = parseInt(match[1], 10);
                  if (num > maxSeq) maxSeq = num;
                }
              }
            });
            const nextSeq = String(maxSeq + 1).padStart(4, "0");
            setPrNumber(`PR-${year}-${nextSeq}`);
          }
        }
      } catch (err) {
        console.error("Failed to load supplies for PR:", err);
      } finally {
        setLoadingSupplies(false);
      }
    };

    fetchSuppliesAndNumber();
  }, [open, initialData]);

  // Add Ingredient
  const handleAddIngredient = () => {
    if (suppliesList.length === 0) return;
    const unused = suppliesList.find((s) => !items.some((it) => it.itemId === s.itemId)) || suppliesList[0];
    setItems((prev) => [
      ...prev,
      {
        prItemId: 0,
        itemId: unused.itemId,
        itemCode: unused.itemCode,
        itemName: unused.itemName,
        uomName: unused.uomName,
        actualInventory: unused.currentStock,
        requestedQuantity: 1,
      },
    ]);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.items;
      return copy;
    });
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Select Item in Dropdown
  const handleSelectSupply = (index: number, itemId: number) => {
    const sup = suppliesList.find((s) => s.itemId === itemId);
    if (!sup) return;
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        itemId: sup.itemId,
        itemCode: sup.itemCode,
        itemName: sup.itemName,
        uomName: sup.uomName,
        actualInventory: sup.currentStock,
      };
      return copy;
    });
  };

  // Change Quantity
  const handleQuantityChange = (index: number, val: string) => {
    const num = parseFloat(val);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        requestedQuantity: isNaN(num) ? 0 : num,
      };
      return copy;
    });
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!requestedBy.trim()) newErrors.requestedBy = "Requester name is required.";
    if (!department.trim()) newErrors.department = "Department is required.";
    if (!requestType.trim()) newErrors.requestType = "Request type is required.";
    if (!priority.trim()) newErrors.priority = "Priority is required.";
    if (!requiredDate) {
      newErrors.requiredDate = "Required date is required.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sel = new Date(requiredDate);
      if (sel <= today) {
        newErrors.requiredDate = "Required date must be a future date.";
      }
    }
    if (!purpose.trim()) newErrors.purpose = "Purpose / Justification is required.";

    if (items.length === 0) {
      newErrors.items = "At least one supply or ingredient must be requested.";
    } else {
      items.forEach((it, idx) => {
        if (!it.requestedQuantity || it.requestedQuantity <= 0) {
          newErrors[`item_qty_${idx}`] = "Quantity must be greater than 0.";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Execution
  const executeSave = async (submitForApproval: boolean) => {
    try {
      setSubmitting(true);
      setErrors((prev) => {
        const c = { ...prev };
        delete c.submit;
        return c;
      });
      const payload = {
        department: department.trim(),
        requestedBy: requestedBy.trim(),
        requestType: requestType.trim(),
        priority: priority.trim(),
        requiredDate: new Date(requiredDate).toISOString(),
        purpose: purpose.trim(),
        notes: notes.trim() || null,
        submitForApproval,
        items: items.map((it) => ({
          itemId: it.itemId,
          requestedQuantity: it.requestedQuantity,
        })),
      };

      if (isEdit && initialData?.prId) {
        await api.put(`/api/scms/api/PurchaseRequisitions/${initialData.prId}`, payload);
      } else {
        await api.post("/api/scms/api/PurchaseRequisitions", payload);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/orders-procurement");
      }
    } catch (err: any) {
      console.error("Failed to save PR:", err);
      setErrors((prev) => ({
        ...prev,
        submit: err?.response?.data?.message || "An error occurred while saving the requisition.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAttempt = () => {
    setConfirmModal({
      open: true,
      title: "Discard changes?",
      message: "Are you sure you want to exit? Any unsaved changes will be lost.",
      action: "cancel",
    });
  };

  return (
    <>
      <ModalWrapper
        open={open}
        title={isEdit ? "Edit Purchase Requisition" : "Create Purchase Requisition"}
        onClose={handleCloseAttempt}
        size="max-w-5xl"
      >
        <div className="space-y-4">
          {errors.submit && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between animate-in fade-in-50">
              <span className="font-medium">{errors.submit}</span>
              <button
                type="button"
                onClick={() =>
                  setErrors((prev) => {
                    const c = { ...prev };
                    delete c.submit;
                    return c;
                  })
                }
                className="font-bold underline ml-2 shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
          {/* Row 1: PR Number & Request Date (2 Columns) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                PR Number <span className="text-[10px] text-muted-foreground font-normal">(Auto-generated)</span>
              </label>
              <div className="flex items-center h-10 px-4 rounded-xl border border-border bg-muted/20 font-mono text-xs text-muted-foreground">
                {prNumber || "PR-XXXX-XXXX"}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Request Date
              </label>
              <div className="flex items-center h-10 px-4 rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground">
                {requestDate}
              </div>
            </div>
          </div>

          {/* Row 2: Requested By & Department (2 Columns) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Requested By <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                value={requestedBy}
                onChange={(e) => {
                  setRequestedBy(e.target.value);
                  setErrors((prev) => {
                    const c = { ...prev };
                    delete c.requestedBy;
                    return c;
                  });
                }}
                placeholder="Enter requester's name..."
                className={`w-full rounded-xl border ${
                  errors.requestedBy ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
                } bg-card px-4 py-2.5 text-sm text-foreground shadow-none focus-visible:ring-1 focus-visible:ring-ring`}
              />
              {errors.requestedBy && (
                <p className="mt-1.5 text-xs font-medium text-destructive animate-in fade-in-50">{errors.requestedBy}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Department <span className="text-destructive">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setErrors((prev) => {
                    const c = { ...prev };
                    delete c.department;
                    return c;
                  });
                }}
                className={`w-full rounded-xl border ${
                  errors.department ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
                } bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${
                  department ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <option value="">Select department...</option>
                <option value="Inventory" className="text-foreground">Inventory</option>
                <option value="Production" className="text-foreground">Production</option>
                <option value="Warehouse" className="text-foreground">Warehouse</option>
                <option value="Quality Assurance" className="text-foreground">Quality Assurance</option>
                <option value="Administration" className="text-foreground">Administration</option>
              </select>
              {errors.department && (
                <p className="mt-1.5 text-xs font-medium text-destructive animate-in fade-in-50">{errors.department}</p>
              )}
            </div>
          </div>

          {/* Row 3: Request Type & Priority (2 Columns) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Request Type <span className="text-destructive">*</span>
              </label>
              <select
                value={requestType}
                onChange={(e) => {
                  setRequestType(e.target.value);
                  setErrors((prev) => {
                    const c = { ...prev };
                    delete c.requestType;
                    return c;
                  });
                }}
                className={`w-full rounded-xl border ${
                  errors.requestType ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
                } bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${
                  requestType ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <option value="">Select request type...</option>
                <option value="Stock Replenishment" className="text-foreground">Stock Replenishment</option>
                <option value="Emergency Restock" className="text-foreground">Emergency Restock</option>
                <option value="Production Run" className="text-foreground">Production Run</option>
                <option value="Trial / New Product" className="text-foreground">Trial / New Product</option>
                <option value="Other" className="text-foreground">Other</option>
              </select>
              {errors.requestType && (
                <p className="mt-1.5 text-xs font-medium text-destructive animate-in fade-in-50">{errors.requestType}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Priority <span className="text-destructive">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setErrors((prev) => {
                    const c = { ...prev };
                    delete c.priority;
                    return c;
                  });
                }}
                className={`w-full rounded-xl border ${
                  errors.priority ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
                } bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${
                  priority ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <option value="">Select priority...</option>
                <option value="Normal" className="text-foreground">Normal</option>
                <option value="Low" className="text-foreground">Low</option>
                <option value="High" className="text-foreground">High</option>
                <option value="Urgent" className="text-foreground">Urgent</option>
              </select>
              {errors.priority && (
                <p className="mt-1.5 text-xs font-medium text-destructive animate-in fade-in-50">{errors.priority}</p>
              )}
            </div>
          </div>

          {/* Row 4: Required Date & Requisition Status (2 Columns) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Required Date <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => {
                    setRequiredDate(e.target.value);
                    setErrors((prev) => {
                      const c = { ...prev };
                      delete c.requiredDate;
                      return c;
                    });
                  }}
                  className={`w-full rounded-xl border ${
                    errors.requiredDate ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
                  } bg-card px-4 py-2.5 pr-10 text-sm text-foreground transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                />
                <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {errors.requiredDate && (
                <p className="mt-1.5 text-xs font-medium text-destructive animate-in fade-in-50">{errors.requiredDate}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Requisition Status
              </label>
              <div className="flex items-center h-10 px-4 rounded-xl border border-border bg-muted/20 text-xs font-medium text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-amber-500/70 mr-2 shrink-0" />
                <span>{statusText || "Draft"}</span>
              </div>
            </div>
          </div>

          {/* Supplies & Ingredients Table */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-foreground">
              Requested Supplies &amp; Ingredients <span className="text-destructive">*</span>
            </label>

            {errors.items && (
              <p className="text-xs font-medium text-destructive animate-in fade-in-50">{errors.items}</p>
            )}

            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="px-3.5 py-2.5 text-left font-bold w-1/3">SUPPLY NAME</th>
                    <th className="px-3.5 py-2.5 text-left font-bold">SUPPLY NO.</th>
                    <th className="px-3.5 py-2.5 text-left font-bold">UOM</th>
                    <th className="px-3.5 py-2.5 text-right font-bold">ACTUAL INVENTORY</th>
                    <th className="px-3.5 py-2.5 text-right font-bold w-36">QUANTITY (TO ORDER)</th>
                    <th className="px-3.5 py-2.5 text-center font-bold w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">
                        No supplies added yet. Click &quot;+ Add Ingredient&quot; below.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const qtyErrorKey = `item_qty_${idx}`;
                      const hasQtyError = !!errors[qtyErrorKey];

                      return (
                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                          <td className="px-3.5 py-2">
                            <select
                              value={item.itemId}
                              onChange={(e) => handleSelectSupply(idx, parseInt(e.target.value))}
                              className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-ring"
                            >
                              {suppliesList.map((sup) => (
                                <option key={sup.itemId} value={sup.itemId}>
                                  {sup.itemName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3.5 py-2 font-mono text-muted-foreground">
                            {item.itemCode || `SPL-${item.itemId}`}
                          </td>
                          <td className="px-3.5 py-2 text-muted-foreground">
                            {item.uomName || "pcs"}
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono text-muted-foreground">
                            {Number(item.actualInventory || 0).toLocaleString()}
                          </td>
                          <td className="px-3.5 py-2 text-right">
                            <div className="flex flex-col items-end">
                              <Input
                                type="number"
                                step="any"
                                min="0.001"
                                value={item.requestedQuantity || ""}
                                onChange={(e) => {
                                  handleQuantityChange(idx, e.target.value);
                                  if (errors[qtyErrorKey]) {
                                    setErrors((prev) => {
                                      const copy = { ...prev };
                                      delete copy[qtyErrorKey];
                                      return copy;
                                    });
                                  }
                                }}
                                className={`h-8 text-xs text-right font-mono font-bold rounded-lg ${
                                  hasQtyError ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
                                }`}
                              />
                              {hasQtyError && (
                                <p className="mt-1 text-[10px] font-medium text-destructive text-right whitespace-nowrap animate-in fade-in-50">
                                  {errors[qtyErrorKey]}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleAddIngredient}
              disabled={loadingSupplies || suppliesList.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add Ingredient
            </button>
          </div>

          {/* Row 5: Purpose / Justification & Notes (2 Columns) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-border">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Purpose / Justification <span className="text-destructive">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground">{purpose.length}/500</span>
              </div>
              <Textarea
                rows={3}
                maxLength={500}
                placeholder="Enter purpose or justification..."
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.purpose;
                    return copy;
                  });
                }}
                className={`w-full rounded-xl border ${
                  errors.purpose ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
                } bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring resize-none`}
              />
              {errors.purpose && (
                <p className="mt-1.5 text-xs font-medium text-destructive animate-in fade-in-50">{errors.purpose}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Notes <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">{notes.length}/300</span>
              </div>
              <Textarea
                rows={3}
                maxLength={300}
                placeholder="Enter additional notes (optional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Modal Footer: Matching Resources & Suppliers Modals */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseAttempt}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => {
                if (validateForm()) {
                  setConfirmModal({
                    open: true,
                    title: "Save as Draft?",
                    message: "The requisition will be saved under the Draft tab for later editing.",
                    action: "draft",
                  });
                }
              }}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => {
                if (validateForm()) {
                  setConfirmModal({
                    open: true,
                    title: "Submit for Approval?",
                    message: "The requisition will be submitted to Admin for approval and moved to Pending Approval.",
                    action: "submit",
                  });
                }
              }}
              className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors shadow-sm disabled:opacity-50"
            >
              Submit for Approval
            </Button>
          </div>
        </div>
      </ModalWrapper>

      {/* Action Confirmation Modal */}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={() => {
            const action = confirmModal.action;
            setConfirmModal(null);
            if (action === "cancel") {
              onClose();
            } else if (action === "draft") {
              executeSave(false);
            } else if (action === "submit") {
              executeSave(true);
            }
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </>
  );
}

export interface CreatePRFormProps {
  initialData?: PurchaseRequisition;
  isEdit?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function CreatePRForm({
  initialData,
  isEdit = false,
  onClose,
  onSuccess,
}: CreatePRFormProps) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/orders-procurement");
  };

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    else router.push("/orders-procurement");
  };

  return (
    <CreatePRModal
      open={true}
      onClose={handleClose}
      onSuccess={handleSuccess}
      initialData={initialData}
      isEdit={isEdit}
    />
  );
}
