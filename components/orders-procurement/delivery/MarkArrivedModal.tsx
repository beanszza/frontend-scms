"use client";

import React, { useState } from "react";
import { AlertCircle, Upload, Check, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import api from "@/lib/api";
import { Delivery } from "../types";
import { useAuth } from "@/context/AuthContext";

interface MarkArrivedModalProps {
  delivery: Delivery | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function MarkArrivedModal({
  delivery,
  onClose,
  onSuccess,
}: MarkArrivedModalProps) {
  const { user } = useAuth();
  if (!delivery) return null;

  const defaultReceiver = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : (user?.username || "Warehouse Officer");

  const [actualArrivalDate, setActualArrivalDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [actualArrivalTime, setActualArrivalTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [receivedBy, setReceivedBy] = useState(defaultReceiver);
  const [arrivalAttachmentBase64, setArrivalAttachmentBase64] = useState("");
  const [attachmentFileName, setAttachmentFileName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setArrivalAttachmentBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!actualArrivalDate) {
      setError("Please specify the actual arrival date.");
      return;
    }

    if (!actualArrivalTime) {
      setError("Please specify the actual arrival time.");
      return;
    }

    if (!receivedBy.trim()) {
      setError("Please specify who received the delivery.");
      return;
    }

    if (!arrivalAttachmentBase64) {
      setError("Arrival proof photo is required before confirming arrival.");
      return;
    }

    try {
      setSubmitting(true);
      const combinedDateTime = new Date(`${actualArrivalDate}T${actualArrivalTime}:00`).toISOString();

      const payload = {
        actualArrivalDate: combinedDateTime,
        receivedBy: receivedBy.trim(),
        arrivalAttachmentBase64: arrivalAttachmentBase64,
        attachmentUrl: arrivalAttachmentBase64,
      };

      const res = await api.put(
        `/api/scms/api/deliveries/${delivery.deliveryId}/arrive`,
        payload
      );

      if (res.data?.success) {
        onSuccess();
      } else {
        setError(res.data?.message || "Failed to confirm arrival.");
      }
    } catch (err: any) {
      console.error("Arrival confirmation error:", err);
      setError(
        err?.response?.data?.message ||
          "An unexpected error occurred while confirming delivery arrival."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      open={!!delivery}
      title={`Confirm Delivery Arrival — ${delivery.deliveryNumber}`}
      onClose={onClose}
      size="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Quick Reference Summary */}
        <div className="rounded-xl border border-border bg-muted/20 p-3.5 text-xs grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-muted-foreground block text-[11px]">Delivery No:</span>
            <span className="font-mono font-bold text-foreground">{delivery.deliveryNumber}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">PO Reference:</span>
            <span className="font-mono font-medium text-foreground">{delivery.poNumber}</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-muted-foreground block text-[11px]">Supplier:</span>
            <span className="font-semibold text-foreground truncate block">{delivery.supplierName}</span>
          </div>
        </div>

        {/* Arriving Items Overview */}
        {delivery.items && delivery.items.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Arriving Items (Will update Purchase Order Received Quantity)
            </label>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold text-xs">
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">UOM</th>
                    <th className="px-3 py-2 text-right">Shipment Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {delivery.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="px-3 py-2 font-medium text-foreground">{item.itemName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.purchaseUomName}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-foreground">
                        {item.declaredQuantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Row: Separate Date and Time (3 Columns: Date, Time, Received By) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Actual Arrival Date <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={actualArrivalDate}
              onChange={(e) => setActualArrivalDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Actual Arrival Time <span className="text-destructive">*</span>
            </label>
            <Input
              type="time"
              value={actualArrivalTime}
              onChange={(e) => setActualArrivalTime(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Received By <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Receiver name..."
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground"
              />
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Arrival Proof Photo (Required) */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Arrival Proof / Photo <span className="text-destructive">*</span>
          </label>
          <div className="rounded-xl border border-dashed border-border bg-card p-4 transition-colors">
            {arrivalAttachmentBase64 ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-foreground truncate">
                      {attachmentFileName || "Arrival photo attached"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setArrivalAttachmentBase64("");
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
                  Click to upload arrival proof or photo <span className="text-destructive">*</span>
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
            disabled={submitting || !arrivalAttachmentBase64}
            className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? "Confirming..." : "Confirm Arrival"}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
}
