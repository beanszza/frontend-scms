"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AlertCircle, Upload, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import ConfirmModal from "@/components/ConfirmModal";
import api from "@/lib/api";
import { PurchaseOrderPO } from "../types";

interface CreateDeliveryModalProps {
  open: boolean;
  initialPo?: PurchaseOrderPO | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemRow {
  poItemId: number;
  itemId: number;
  itemName: string;
  itemCode: string;
  purchaseUomName: string;
  poOrderedQuantity: number;
  poTotalReceivedQuantity: number;
  alreadyScheduledQuantity: number;
  availableToSchedule: number;
  orderQuantity: number;
}

export function CreateDeliveryModal({
  open,
  initialPo,
  onClose,
  onSuccess,
}: CreateDeliveryModalProps) {
  const [deliveryNumber, setDeliveryNumber] = useState("DEL-2026-0001");
  const [orderedPOs, setOrderedPOs] = useState<PurchaseOrderPO[]>([]);
  const [selectedPoId, setSelectedPoId] = useState<number | null>(initialPo?.poId ?? null);
  const [pendingPoId, setPendingPoId] = useState<number | null>(null);
  const [confirmPoChange, setConfirmPoChange] = useState(false);

  const [loadingPOs, setLoadingPOs] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [paymentType, setPaymentType] = useState("Payable");
  const [plannedDispatchDate, setPlannedDispatchDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [expectedArrivalDate, setExpectedArrivalDate] = useState("");
  const [scheduledAttachmentBase64, setScheduledAttachmentBase64] = useState("");
  const [attachmentFileName, setAttachmentFileName] = useState("");

  // Items
  const [items, setItems] = useState<ItemRow[]>([]);

  // Fetch Delivery sequence for unique delivery number preview & Approved/Ordered POs
  useEffect(() => {
    if (!open) return;

    const fetchInitialData = async () => {
      try {
        setLoadingPOs(true);
        const [delivRes, poRes] = await Promise.allSettled([
          api.get("/api/scms/api/deliveries?page=1&pageSize=1000"),
          api.get("/api/scms/api/PurchaseOrders?page=1&pageSize=1000"),
        ]);

        // Calculate next unique Delivery Number
        if (delivRes.status === "fulfilled" && delivRes.value.data?.success) {
          const list: any[] = delivRes.value.data.data?.items || delivRes.value.data.data || [];
          const year = new Date().getFullYear();
          let maxSeq = 0;
          list.forEach((d) => {
            if (d.deliveryNumber) {
              const match = d.deliveryNumber.match(/DEL-\d{4}-(\d+)/);
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxSeq) maxSeq = num;
              }
            }
          });
          const nextSeq = String(maxSeq + 1).padStart(4, "0");
          setDeliveryNumber(`DEL-${year}-${nextSeq}`);
        }

        // Available POs (do NOT auto-select if initialPo is null)
        if (poRes.status === "fulfilled" && poRes.value.data?.success) {
          const raw: any[] = poRes.value.data.data?.items || poRes.value.data.data || [];
          const available = raw.filter(
            (p) => p.status === "Ordered" || p.status === "Approved"
          );
          setOrderedPOs(available);
        }
      } catch (err) {
        console.error("Failed to load initial data for delivery modal:", err);
      } finally {
        setLoadingPOs(false);
      }
    };

    if (initialPo) {
      setSelectedPoId(initialPo.poId);
      if (initialPo.paymentType === "Paid" || initialPo.paymentType === "Payable") {
        setPaymentType(initialPo.paymentType);
      }
      if (initialPo.expectedArrivalDate) {
        setExpectedArrivalDate(
          new Date(initialPo.expectedArrivalDate).toISOString().slice(0, 16)
        );
      }
    } else {
      setSelectedPoId(null);
    }

    fetchInitialData();
  }, [open, initialPo]);

  // Current selected PO object
  const currentPO = useMemo(() => {
    if (!selectedPoId) return null;
    if (initialPo && initialPo.poId === selectedPoId) return initialPo;
    return orderedPOs.find((p) => p.poId === selectedPoId) || null;
  }, [initialPo, orderedPOs, selectedPoId]);

  // Sync payment type when PO changes
  useEffect(() => {
    if (currentPO?.paymentType === "Paid" || currentPO?.paymentType === "Payable") {
      setPaymentType(currentPO.paymentType);
    }
  }, [currentPO]);

  // Fetch PO items whenever selected PO changes
  useEffect(() => {
    if (!selectedPoId || !open) {
      setItems([]);
      return;
    }

    const fetchOutstanding = async () => {
      try {
        setLoadingItems(true);
        setError(null);
        const res = await api.get(`/api/scms/api/deliveries/po/${selectedPoId}/outstanding`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          const rows: ItemRow[] = res.data.data.map((i: any) => {
            const ordered = Number(i.poOrderedQuantity) || 0;
            const received = Number(i.poTotalReceivedQuantity) || 0;
            const inFlight = Number(i.alreadyScheduledQuantity) || 0;
            const available = Math.max(0, ordered - received - inFlight);
            return {
              poItemId: i.poItemId,
              itemId: i.itemId,
              itemName: i.itemName,
              itemCode: i.itemCode || "",
              purchaseUomName: i.purchaseUomName || "pcs",
              poOrderedQuantity: ordered,
              poTotalReceivedQuantity: received,
              alreadyScheduledQuantity: inFlight,
              availableToSchedule: available,
              orderQuantity: available,
            };
          });
          setItems(rows);
        } else if (currentPO?.items) {
          setItems(
            currentPO.items.map((i) => {
              const ordered = Number(i.poItemQuantity) || 0;
              const received = Number(i.receivedQuantity) || 0;
              const available = Math.max(0, ordered - received);
              return {
                poItemId: i.poItemId || 0,
                itemId: i.itemId,
                itemName: i.itemName,
                itemCode: "",
                purchaseUomName: i.purchaseUomName || "pcs",
                poOrderedQuantity: ordered,
                poTotalReceivedQuantity: received,
                alreadyScheduledQuantity: 0,
                availableToSchedule: available,
                orderQuantity: available,
              };
            })
          );
        }
      } catch (err) {
        console.error("Failed to load PO items:", err);
        setError("Failed to load purchase order items.");
      } finally {
        setLoadingItems(false);
      }
    };

    fetchOutstanding();
  }, [selectedPoId, open, currentPO]);

  // Handle PO selection change with discard confirmation
  const handlePoSelectionChange = (newPoId: number | null) => {
    if (selectedPoId && newPoId !== selectedPoId) {
      // Prompt confirmation to discard current PO details
      setPendingPoId(newPoId);
      setConfirmPoChange(true);
    } else {
      setSelectedPoId(newPoId);
    }
  };

  const applyPoChange = () => {
    setSelectedPoId(pendingPoId);
    setPendingPoId(null);
    setConfirmPoChange(false);
    setError(null);
  };

  const cancelPoChange = () => {
    setPendingPoId(null);
    setConfirmPoChange(false);
  };

  // Handle Order Quantity Input change
  const handleQuantityChange = (poItemId: number, value: string) => {
    const num = parseFloat(value);
    setItems((prev) =>
      prev.map((item) =>
        item.poItemId === poItemId
          ? {
              ...item,
              orderQuantity: isNaN(num) ? 0 : num,
            }
          : item
      )
    );
  };

  // Handle File Upload to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError("File exceeds 8MB limit.");
      return;
    }

    setAttachmentFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setScheduledAttachmentBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Validation
  const validationErrors = useMemo(() => {
    const errs: Record<number, string> = {};
    items.forEach((item) => {
      if (item.availableToSchedule > 0) {
        if (item.orderQuantity <= 0) {
          errs[item.poItemId] = "Order quantity must be greater than 0.";
        } else if (item.orderQuantity > item.availableToSchedule) {
          errs[item.poItemId] = `Cannot exceed available balance (${item.availableToSchedule} ${item.purchaseUomName}).`;
        }
      }
    });
    return errs;
  }, [items]);

  const hasAnyOrderQty = items.some(
    (i) => i.availableToSchedule > 0 && i.orderQuantity > 0 && i.orderQuantity <= i.availableToSchedule
  );
  const hasErrors = Object.keys(validationErrors).length > 0;

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPoId) {
      setError("Please select a Purchase Order first.");
      return;
    }

    if (items.length === 0) {
      setError("This Purchase Order has no items available for delivery.");
      return;
    }

    if (hasErrors || !hasAnyOrderQty) {
      setError("Please ensure order quantities are valid and do not exceed available balance.");
      return;
    }

    const itemsToSchedule = items
      .filter((i) => i.availableToSchedule > 0 && i.orderQuantity > 0)
      .map((i) => ({
        poItemId: i.poItemId,
        declaredQuantity: Number(i.orderQuantity),
      }));

    if (itemsToSchedule.length === 0) {
      setError("Please enter a shipment order quantity for at least one item.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        poId: selectedPoId,
        paymentType,
        scheduledDate: plannedDispatchDate ? new Date(plannedDispatchDate).toISOString() : new Date().toISOString(),
        expectedArrivalDate: expectedArrivalDate ? new Date(expectedArrivalDate).toISOString() : null,
        scheduledAttachmentBase64: scheduledAttachmentBase64 || null,
        attachmentUrl: scheduledAttachmentBase64 || null,
        carrier: null,
        driverName: null,
        vehiclePlateNumber: null,
        items: itemsToSchedule,
      };

      const res = await api.post("/api/scms/api/deliveries", payload);
      if (res.data?.success) {
        onSuccess();
      } else {
        setError(res.data?.message || "Failed to schedule delivery order.");
      }
    } catch (err: any) {
      console.error("Failed to schedule delivery order:", err);
      setError(err?.response?.data?.message || "An unexpected error occurred while scheduling delivery.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ModalWrapper
        open={open}
        title="Create Delivery Order"
        onClose={onClose}
        size="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Row 1: Delivery Number & Purchase Order Selector (2 Columns) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Delivery Number
              </label>
              <Input
                type="text"
                readOnly
                value={deliveryNumber}
                className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0 font-mono font-medium"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Purchase Order <span className="text-destructive">*</span>
              </label>
              {initialPo ? (
                <Input
                  type="text"
                  readOnly
                  value={initialPo.poNumber}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0 font-mono font-medium"
                />
              ) : (
                <select
                  value={selectedPoId ?? ""}
                  onChange={(e) =>
                    handlePoSelectionChange(Number(e.target.value) || null)
                  }
                  disabled={loadingPOs}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select Purchase Order...</option>
                  {orderedPOs.map((p) => (
                    <option key={p.poId} value={p.poId}>
                      {p.poNumber}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* If NO PO is selected, show instructional prompt */}
          {!selectedPoId ? (
            <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card">
              Please select a Purchase Order above to view items and configure delivery order.
            </div>
          ) : (
            <>
              {/* PO Details Summary Card */}
              {currentPO && (
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Supplier:</span>
                    <span className="font-semibold text-foreground">{currentPO.supplierName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">PO Status / Date:</span>
                    <span className="font-medium text-foreground">
                      {currentPO.status} {currentPO.orderDate ? `• ${new Date(currentPO.orderDate).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Total PO Amount:</span>
                    <span className="font-semibold text-foreground">
                      {currentPO.totalAmount ? `₱${Number(currentPO.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                    </span>
                  </div>
                </div>
              )}

              {/* Table 1: PO Items Reference (Read-Only Reference) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground">
                    Purchase Order Items Reference
                  </label>
                  <span className="text-[11px] text-muted-foreground">Read-only PO reference</span>
                </div>

                {loadingItems ? (
                  <div className="py-6 text-center text-xs text-muted-foreground rounded-xl border border-border bg-card">
                    Loading purchase order items...
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground rounded-xl border border-border bg-card">
                    No items found for this purchase order.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold text-xs">
                          <th className="px-3 py-2.5 w-10 text-center">#</th>
                          <th className="px-3 py-2.5">Supply</th>
                          <th className="px-3 py-2.5">Supply No</th>
                          <th className="px-3 py-2.5">UOM</th>
                          <th className="px-3 py-2.5 text-right">PO Quantity</th>
                          <th className="px-3 py-2.5 text-right">Previously Received</th>
                          <th className="px-3 py-2.5 text-right">Already Scheduled</th>
                          <th className="px-3 py-2.5 text-right font-semibold text-foreground">Available to Schedule</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {items.map((item, idx) => (
                          <tr key={`ref-${item.poItemId || idx}`} className="hover:bg-muted/20">
                            <td className="px-3 py-2.5 text-center text-muted-foreground font-mono">{idx + 1}</td>
                            <td className="px-3 py-2.5 font-medium text-foreground">{item.itemName}</td>
                            <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{item.itemCode || "—"}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">{item.purchaseUomName}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{item.poOrderedQuantity}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{item.poTotalReceivedQuantity}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{item.alreadyScheduledQuantity}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground">
                              {item.availableToSchedule}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Table 2: Actual Order Quantity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground">
                    Order Quantities <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Specify quantity being ordered for this shipment
                  </span>
                </div>

                {items.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold text-xs">
                          <th className="px-3.5 py-2.5">Ingredient / Supply</th>
                          <th className="px-3.5 py-2.5">UOM</th>
                          <th className="px-3.5 py-2.5 text-right">PO Quantity</th>
                          <th className="px-3.5 py-2.5 text-right font-medium">Left to Order</th>
                          <th className="px-3.5 py-2.5 text-right w-44 font-semibold text-foreground">Quantity to Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {items.map((item) => {
                          const isExhausted = item.availableToSchedule <= 0;
                          const err = validationErrors[item.poItemId];

                          return (
                            <tr
                              key={`order-${item.poItemId}`}
                              className={`hover:bg-muted/20 transition-colors ${
                                isExhausted ? "opacity-50 bg-muted/10" : ""
                              }`}
                            >
                              <td className="px-3.5 py-2.5 font-medium text-foreground">
                                {item.itemName}
                              </td>
                              <td className="px-3.5 py-2.5 text-muted-foreground">
                                {item.purchaseUomName}
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-mono text-muted-foreground">
                                {item.poOrderedQuantity}
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-mono font-medium text-foreground">
                                {item.availableToSchedule}
                              </td>
                              <td className="px-3.5 py-2.5 text-right">
                                {isExhausted ? (
                                  <span className="text-[11px] text-muted-foreground italic">
                                    Fully Scheduled
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Input
                                        type="number"
                                        min="0.01"
                                        max={item.availableToSchedule}
                                        step="any"
                                        value={item.orderQuantity === 0 ? "" : item.orderQuantity}
                                        onChange={(e) =>
                                          handleQuantityChange(item.poItemId, e.target.value)
                                        }
                                        className={`w-28 text-right font-mono text-xs rounded-lg h-8 px-2 bg-card ${
                                          err
                                            ? "!border-destructive focus-visible:!ring-destructive"
                                            : "border-border"
                                        }`}
                                      />
                                      <span className="text-[11px] text-muted-foreground w-8 text-left truncate">
                                        {item.purchaseUomName}
                                      </span>
                                    </div>
                                    {err && (
                                      <p className="text-[10px] text-destructive text-right font-medium animate-in fade-in-50">
                                        {err}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Row 3: Payment Type, Planned Dispatch Date (Date only), Expected Arrival Date (3 Columns) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Payment Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Payable">Payable</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Planned Dispatch Date
                  </label>
                  <Input
                    type="date"
                    value={plannedDispatchDate}
                    onChange={(e) => setPlannedDispatchDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Expected Arrival Date &amp; Time (ETA)
                  </label>
                  <Input
                    type="datetime-local"
                    value={expectedArrivalDate}
                    onChange={(e) => setExpectedArrivalDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground"
                  />
                </div>
              </div>

              {/* Row 4: Proof of Receipt / Attachment */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Proof of Receipt / Attachment
                </label>
                <div className="rounded-xl border border-dashed border-border bg-card p-4 transition-colors">
                  {scheduledAttachmentBase64 ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium text-foreground truncate">
                            {attachmentFileName || "Receipt document uploaded"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setScheduledAttachmentBase64("");
                          setAttachmentFileName("");
                        }}
                        className="text-muted-foreground hover:text-destructive h-8 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-2">
                      <Upload className="w-5 h-5 text-muted-foreground mb-1.5" />
                      <span className="text-xs font-medium text-foreground">
                        Click to upload receipt or proof
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">
                        JPG, PNG, PDF up to 8MB
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Close
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedPoId || hasErrors || !hasAnyOrderQty}
              className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? "Scheduling..." : "Schedule Order"}
            </Button>
          </div>
        </form>
      </ModalWrapper>

      {/* Discard Confirmation when changing selected PO */}
      {confirmPoChange && (
        <ConfirmModal
          message="Changing the Purchase Order will discard any entered delivery quantities and dates for the current PO. Do you wish to continue?"
          onConfirm={applyPoChange}
          onCancel={cancelPoChange}
        />
      )}
    </>
  );
}
