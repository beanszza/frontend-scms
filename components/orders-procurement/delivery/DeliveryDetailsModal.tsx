"use client";

import React from "react";
import { Truck, ShieldCheck, Receipt, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Delivery, DeliveryStatus } from "../types";

interface DeliveryDetailsModalProps {
  delivery: Delivery | null;
  isAdmin?: boolean;
  onClose: () => void;
  onDispatch?: (delivery: Delivery) => void;
  onArrive?: (delivery: Delivery) => void;
  onCancel?: (delivery: Delivery) => void;
  onCreateGrn?: (delivery: Delivery) => void;
}

export function DeliveryDetailsModal({
  delivery,
  isAdmin = false,
  onClose,
  onDispatch,
  onArrive,
  onCancel,
  onCreateGrn,
}: DeliveryDetailsModalProps) {
  if (!delivery) return null;

  const fmtDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const isScheduled = delivery.status === "Scheduled";
  const isInTransit = delivery.status === "In Transit";
  const isArrived = delivery.status === "Arrived";
  const isCancelled = delivery.status === "Cancelled";

  return (
    <ModalWrapper
      open={!!delivery}
      title={`Delivery Order Details — ${delivery.deliveryNumber}`}
      onClose={onClose}
      size="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Top Header Row with Status Badge & Document No */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <StatusBadge status={delivery.status} />
            <span className="font-mono text-sm font-bold text-foreground">{delivery.deliveryNumber}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            PO Ref: <span className="font-mono font-medium text-foreground">{delivery.poNumber}</span>
          </div>
        </div>
        {/* Cancellation Reason Notice */}
        {isCancelled && delivery.notes && (
          <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Order Cancelled</span>
              <span className="text-foreground text-[11px]">{delivery.notes}</span>
            </div>
          </div>
        )}

        {/* Row 1: Delivery Number, PO Reference, Status (3 Columns) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Delivery Number
            </label>
            <Input
              type="text"
              readOnly
              value={delivery.deliveryNumber}
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 font-mono text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0 font-bold"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              PO Reference
            </label>
            <Input
              type="text"
              readOnly
              value={delivery.poNumber}
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 font-mono text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0 font-medium"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Shipment Status
            </label>
            <Input
              type="text"
              readOnly
              value={delivery.status}
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0 font-medium"
            />
          </div>
        </div>

        {/* Row 2: Supplier, Payment Terms, fixed inbound destination (3 Columns) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Supplier
            </label>
            <Input
              type="text"
              readOnly
              value={delivery.supplierName}
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0 font-medium"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Payment Terms
            </label>
            <Input
              type="text"
              readOnly
              value={delivery.paymentType || "Payable"}
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0 font-medium"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Delivery destination
            </label>
            <Input
              type="text"
              readOnly
              value="Commissary"
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0 font-medium"
            />
          </div>
        </div>

        {/* Row 3: Dates (Scheduled, Dispatched, Actual Arrival) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Scheduled Date
            </label>
            <Input
              type="text"
              readOnly
              value={fmtDate(delivery.scheduledDate)}
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Dispatched Date
            </label>
            <Input
              type="text"
              readOnly
              value={fmtDate(delivery.dispatchedDate)}
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Arrival Date
            </label>
            <Input
              type="text"
              readOnly
              value={fmtDate(delivery.actualArrivalDate)}
              className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Row 4: Carrier & Driver (if dispatched or arrived) */}
        {(delivery.carrier || delivery.driverName || delivery.vehiclePlateNumber) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Carrier
              </label>
              <Input
                type="text"
                readOnly
                value={delivery.carrier || "—"}
                className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Driver Name
              </label>
              <Input
                type="text"
                readOnly
                value={delivery.driverName || "—"}
                className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Vehicle Plate Number
              </label>
              <Input
                type="text"
                readOnly
                value={delivery.vehiclePlateNumber || "—"}
                className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0 font-mono"
              />
            </div>
          </div>
        )}

        {/* Row 5: Receiver Info (if arrived) */}
        {isArrived && delivery.receivedBy && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Received By
              </label>
              <Input
                type="text"
                readOnly
                value={delivery.receivedBy}
                className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-not-allowed shadow-none focus-visible:ring-0 font-medium"
              />
            </div>
            {delivery.grnNumber && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Goods Receipt Note (GRN)
                </label>
                <Input
                  type="text"
                  readOnly
                  value={delivery.grnNumber}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm font-mono font-bold text-foreground cursor-not-allowed shadow-none focus-visible:ring-0"
                />
              </div>
            )}
          </div>
        )}

        {/* Attached Proofs (Stored in DB) */}
        {(delivery.scheduledAttachment || delivery.dispatchAttachment || delivery.arrivalAttachment || delivery.attachmentUrl) && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Stored Document Proofs
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(delivery.scheduledAttachment || (isScheduled && delivery.attachmentUrl)) && (
                <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Receipt Proof</span>
                  <a
                    href={delivery.scheduledAttachment || delivery.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" /> View
                  </a>
                </div>
              )}
              {delivery.dispatchAttachment && (
                <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Dispatch Proof</span>
                  <a
                    href={delivery.dispatchAttachment}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" /> View
                  </a>
                </div>
              )}
              {delivery.arrivalAttachment && (
                <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Arrival Proof</span>
                  <a
                    href={delivery.arrivalAttachment}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" /> View
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consignment Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-foreground">
              Consignment Items ({delivery.items.length} Items)
            </label>
            <span className="text-xs text-muted-foreground">
              Total:{" "}
              <span className="font-mono font-bold text-foreground">
                {delivery.items.reduce((acc, i) => acc + i.declaredQuantity, 0)}
              </span>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold text-xs">
                  <th className="px-3.5 py-2.5">Item Description</th>
                  <th className="px-3.5 py-2.5">UOM</th>
                  <th className="px-3.5 py-2.5 text-right">PO Ordered</th>
                  <th className="px-3.5 py-2.5 text-right">Prior Received</th>
                  <th className="px-3.5 py-2.5 text-right font-bold text-foreground">Shipment Qty</th>
                  <th className="px-3.5 py-2.5 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {delivery.items.map((item, idx) => (
                  <tr key={item.deliveryItemId || idx} className="hover:bg-muted/20">
                    <td className="px-3.5 py-2.5">
                      <div className="font-medium text-foreground">{item.itemName}</div>
                      {item.itemCode && (
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {item.itemCode}
                        </div>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-muted-foreground">{item.purchaseUomName}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-muted-foreground">
                      {item.poOrderedQuantity}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-muted-foreground">
                      {item.poTotalReceivedQuantity}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-foreground">
                      {item.declaredQuantity}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-muted-foreground">
                      {item.poOutstandingQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
          <div>
            {!isAdmin && (isScheduled || isInTransit) && onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onCancel(delivery);
                }}
                className="rounded-xl border border-destructive/30 bg-card px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                Cancel Order
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Close
            </Button>

            {!isAdmin && isScheduled && onDispatch && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onDispatch(delivery);
                }}
                className="flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors shadow-sm"
              >
                <Truck className="w-4 h-4" />
                Dispatch
              </Button>
            )}

            {!isAdmin && isInTransit && onArrive && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onArrive(delivery);
                }}
                className="flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Confirm Arrival
              </Button>
            )}

            {!isAdmin && isArrived && !delivery.grnNumber && onCreateGrn && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateGrn(delivery);
                }}
                className="flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors shadow-sm"
              >
                <Receipt className="w-4 h-4" />
                Create GRN
              </Button>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
