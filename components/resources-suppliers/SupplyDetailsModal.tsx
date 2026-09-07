"use client";

import React, { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { SupplyItem } from "./types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Package, Truck, Layers, AlertTriangle, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

interface SupplyDetailsModalProps {
  item: SupplyItem | null;
  onClose: () => void;
  onEdit?: (item: SupplyItem) => void;
}

interface LinkedSupplier {
  supplierId: number;
  supplierName: string;
  supplierCode?: string;
  unitPrice?: number;
  currency?: string;
  leadTimeDays?: number;
}

export default function SupplyDetailsModal({
  item,
  onClose,
  onEdit,
}: SupplyDetailsModalProps) {
  const [linkedSuppliers, setLinkedSuppliers] = useState<LinkedSupplier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) {
      setLinkedSuppliers([]);
      return;
    }

    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        const res = await api
          .get(`/api/scms/api/SupplierItems/by-item/${item.itemId}`)
          .catch(() => api.get(`/api/SupplierItems/by-item/${item.itemId}`));
        if (res?.data?.success) {
          const list = res.data.data || [];
          setLinkedSuppliers(
            list.map((s: any) => ({
              supplierId: s.supplierId,
              supplierName: s.supplierCompanyName || s.companyName || s.supplierName || `Supplier #${s.supplierId}`,
              supplierCode: s.supplierCode,
              unitPrice: s.unitPrice,
              currency: s.currency || "PHP",
              leadTimeDays: s.leadTimeDays,
            }))
          );
        }
      } catch {
        setLinkedSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [item]);

  if (!item) return null;

  const currentStock = item.currentStock ?? 0;
  const isLowStock = currentStock <= item.minStockLevel;
  const isOverStock = item.maxStockLevel > 0 && currentStock > item.maxStockLevel;

  return (
    <ModalWrapper
      open={!!item}
      title="Supply Item Details"
      onClose={onClose}
      size="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header Summary Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/40 border border-border">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-foreground/5 border border-border flex items-center justify-center shrink-0">
              <Package className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">{item.itemName}</h3>
                <StatusBadge status={item.isActive !== false ? "Active" : "Inactive"} />
              </div>
              <p className="text-xs font-mono font-medium text-muted-foreground mt-0.5">
                {item.itemCode || `ITEM-${item.itemId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-muted text-foreground border border-border px-3 py-1 text-xs font-semibold">
              {item.categoryName || "Raw Materials"}
            </span>
          </div>
        </div>

        {/* Stock Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-border bg-card space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Current Stock</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground">{currentStock}</span>
              <span className="text-xs text-muted-foreground font-semibold">{item.uomName}</span>
            </div>
            <div className="flex items-center gap-1 pt-1 text-[11px]">
              {isLowStock ? (
                <span className="text-amber-500 font-medium flex items-center gap-1">
                  <AlertTriangle size={12} /> Low Stock Alert
                </span>
              ) : isOverStock ? (
                <span className="text-blue-500 font-medium flex items-center gap-1">
                  <Layers size={12} /> Overstock
                </span>
              ) : (
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} /> Healthy Level
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Min Stock Threshold</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground">{item.minStockLevel}</span>
              <span className="text-xs text-muted-foreground font-semibold">{item.uomName}</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">Reorder trigger point</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Max Stock Capacity</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground">{item.maxStockLevel}</span>
              <span className="text-xs text-muted-foreground font-semibold">{item.uomName}</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">Maximum stock holding</p>
          </div>
        </div>

        {/* Specifications & Properties */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Item Specifications
          </h4>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="text-muted-foreground font-medium">Unique Item ID</span>
              <span className="font-mono font-semibold text-foreground">{item.itemCode || "-"}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="text-muted-foreground font-medium">Category</span>
              <span className="font-semibold text-foreground">{item.categoryName}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="text-muted-foreground font-medium">Unit of Measure (UOM)</span>
              <span className="font-semibold text-foreground">{item.uomName}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="text-muted-foreground font-medium">Status</span>
              <span className="font-semibold text-foreground">
                {item.isActive !== false ? "Active (In Circulation)" : "Inactive (Archived)"}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Suppliers Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Truck size={14} /> Linked Suppliers
            </h4>
            <span className="text-[11px] font-medium text-muted-foreground">
              {linkedSuppliers.length} supplier{linkedSuppliers.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Loading linked suppliers...
              </div>
            ) : linkedSuppliers.length === 0 ? (
              <div className="p-6 text-center space-y-1">
                <p className="text-xs font-semibold text-foreground">No suppliers linked yet</p>
                <p className="text-[11px] text-muted-foreground">
                  Suppliers mapped to this item will automatically be displayed here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {linkedSuppliers.map((s) => (
                  <div key={s.supplierId} className="flex items-center justify-between p-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{s.supplierName}</p>
                      {s.supplierCode && (
                        <p className="font-mono text-[10px] text-muted-foreground">{s.supplierCode}</p>
                      )}
                    </div>
                    <div className="text-right space-y-0.5">
                      {s.unitPrice != null && (
                        <p className="font-semibold text-foreground">
                          {s.currency} {s.unitPrice.toFixed(2)}
                        </p>
                      )}
                      {s.leadTimeDays != null && (
                        <p className="text-[10px] text-muted-foreground">
                          {s.leadTimeDays} days lead time
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="rounded-xl bg-foreground text-background px-5 py-2 text-sm font-semibold hover:bg-foreground/85 transition-colors"
            >
              Edit Item
            </button>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
