"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ModalWrapper from "./ModalWrapper";
import { SupplyItem } from "./types";

interface SupplyModalProps {
  open: boolean;
  editingItem: SupplyItem | null;
  onClose: () => void;
  onSave: (data: {
    itemName: string;
    categoryId: number;
    uomId: number;
    minStock: number;
    maxStock: number;
    isActive: boolean;
  }) => void;
}

export default function SupplyModal({ open, editingItem, onClose, onSave }: SupplyModalProps) {
  const [itemName, setItemName] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [uomId, setUomId] = useState(1);
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [supplyActive, setSupplyActive] = useState(true);

  const [itemNameError, setItemNameError] = useState("");
  const [minStockError, setMinStockError] = useState("");
  const [maxStockError, setMaxStockError] = useState("");

  useEffect(() => {
    if (editingItem) {
      setItemName(editingItem.itemName || "");
      setCategoryId(editingItem.categoryName === "Tools and Supplies" || editingItem.categoryName === "Tools & Supplies" ? 2 : 1);
      setUomId(editingItem.uomId || 1);
      setMinStock(editingItem.minStockLevel?.toString() || "0");
      setMaxStock(editingItem.maxStockLevel?.toString() || "0");
      setSupplyActive(editingItem.isActive !== false);
    } else {
      setItemName("");
      setCategoryId(1);
      setUomId(1);
      setMinStock("");
      setMaxStock("");
      setSupplyActive(true);
    }
    setItemNameError("");
    setMinStockError("");
    setMaxStockError("");
  }, [editingItem, open]);

  const handleSave = () => {
    let isValid = true;
    if (!itemName.trim()) {
      setItemNameError("Item Name is required.");
      isValid = false;
    }
    if (!minStock.trim() || Number(minStock) < 0) {
      setMinStockError("Valid Min Stock is required.");
      isValid = false;
    }
    if (!maxStock.trim() || Number(maxStock) < 0) {
      setMaxStockError("Valid Max Stock is required.");
      isValid = false;
    } else if (Number(maxStock) < Number(minStock)) {
      setMaxStockError("Max stock cannot be less than min stock.");
      isValid = false;
    }

    if (!isValid) return;

    onSave({
      itemName: itemName.trim(),
      categoryId,
      uomId,
      minStock: Number(minStock),
      maxStock: Number(maxStock),
      isActive: supplyActive,
    });
  };

  return (
    <ModalWrapper open={open} title={editingItem ? "Edit Supply Item" : "Add New Supply Item"} onClose={onClose} size="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Supply Name <span className="text-muted-foreground">*</span></label>
          <Input
            type="text"
            value={itemName}
            onChange={(e) => { setItemName(e.target.value); if (e.target.value.trim()) setItemNameError(""); }}
            placeholder="e.g. White Sugar"
            className={`w-full rounded-xl border ${itemNameError ? "border-red-500" : "border-border"} bg-card text-foreground px-4 py-2.5 text-sm`}
          />
          {itemNameError && <p className="mt-1 text-xs text-red-500">{itemNameError}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring">
              <option value={1}>Raw Materials</option>
              <option value={2}>Tools & Supplies</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Unit of Measurement</label>
            <select value={uomId} onChange={(e) => setUomId(Number(e.target.value))} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring">
              <option value={1}>kg</option><option value={2}>pcs</option><option value={3}>liters</option><option value={4}>m</option><option value={5}>grams</option><option value={6}>box</option><option value={7}>pack</option><option value={8}>roll</option><option value={9}>bottle</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Min Stock Level</label>
            <Input
              type="number"
              min={0}
              step={0.001}
              value={minStock}
              onChange={(e) => { setMinStock(e.target.value); setMinStockError(""); }}
              placeholder="e.g. 10"
              className={`w-full rounded-xl border ${minStockError ? "border-red-500" : "border-border"} bg-card px-4 py-2.5 text-sm`}
            />
            {minStockError && <p className="mt-1 text-xs text-red-500">{minStockError}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Max Stock Level</label>
            <Input
              type="number"
              min={0}
              step={0.001}
              value={maxStock}
              onChange={(e) => { setMaxStock(e.target.value); setMaxStockError(""); }}
              placeholder="e.g. 100"
              className={`w-full rounded-xl border ${maxStockError ? "border-red-500" : "border-border"} bg-card px-4 py-2.5 text-sm`}
            />
            {maxStockError && <p className="mt-1 text-xs text-red-500">{maxStockError}</p>}
          </div>
        </div>

        {editingItem && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Status</label>
            <select value={supplyActive ? "true" : "false"} onChange={(e) => setSupplyActive(e.target.value === "true")} className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors">Cancel</Button>
          <Button type="button" onClick={handleSave} className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors">{editingItem ? "Save Changes" : "Create Supply"}</Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
