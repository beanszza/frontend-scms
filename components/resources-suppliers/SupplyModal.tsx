"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ModalWrapper from "./ModalWrapper";
import { SupplyItem } from "./types";

interface SupplyModalProps {
  open: boolean;
  editingItem: SupplyItem | null;
  existingSupplies?: SupplyItem[];
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

export default function SupplyModal({
  open,
  editingItem,
  existingSupplies = [],
  onClose,
  onSave,
}: SupplyModalProps) {
  const [itemName, setItemName] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [uomId, setUomId] = useState(1);
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [supplyActive, setSupplyActive] = useState(true);

  const [itemNameError, setItemNameError] = useState("");
  const [minStockError, setMinStockError] = useState("");
  const [maxStockError, setMaxStockError] = useState("");

  // Helper: validate Supply Name in real time
  const validateItemName = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setItemNameError("Supply Name is required.");
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(val)) {
      setItemNameError("Supply Name can only contain letters.");
      return false;
    }
    if (trimmed.length < 2) {
      setItemNameError("Supply Name must be at least 2 characters.");
      return false;
    }
    if (trimmed.length > 50) {
      setItemNameError("Supply Name cannot exceed 50 characters.");
      return false;
    }

    const lower = trimmed.toLowerCase();
    const isDuplicate = existingSupplies.some(
      (item) =>
        item.itemName.trim().toLowerCase() === lower &&
        item.itemId !== editingItem?.itemId
    );

    if (isDuplicate) {
      setItemNameError("Supply item name already exists (in active or inactive supplies).");
      return false;
    }

    setItemNameError("");
    return true;
  };

  // Helper: validate Min Stock in real time
  const validateMinStock = (val: string, currentMax: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setMinStockError("Min Stock Level is required.");
      return false;
    }
    const num = Number(trimmed);
    if (isNaN(num) || num < 1) {
      setMinStockError("Min Stock Level must be at least 1.");
      return false;
    }

    setMinStockError("");

    // Also re-check max vs min relationship if max is populated
    if (currentMax.trim()) {
      const maxNum = Number(currentMax);
      if (!isNaN(maxNum) && maxNum >= 1) {
        if (maxNum < num) {
          setMaxStockError("Max stock cannot be less than min stock.");
        } else {
          setMaxStockError("");
        }
      }
    }
    return true;
  };

  // Helper: validate Max Stock in real time
  const validateMaxStock = (val: string, currentMin: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setMaxStockError("Max Stock Level is required.");
      return false;
    }
    const num = Number(trimmed);
    if (isNaN(num) || num < 1) {
      setMaxStockError("Max Stock Level must be at least 1.");
      return false;
    }

    if (currentMin.trim()) {
      const minNum = Number(currentMin);
      if (!isNaN(minNum) && num < minNum) {
        setMaxStockError("Max stock cannot be less than min stock.");
        return false;
      }
    }

    setMaxStockError("");
    return true;
  };

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setItemName(editingItem.itemName || "");
        setCategoryId(
          editingItem.categoryName === "Tools and Supplies" ||
            editingItem.categoryName === "Tools & Supplies"
            ? 2
            : 1
        );
        setUomId(editingItem.uomId || 1);
        setMinStock(editingItem.minStockLevel ? editingItem.minStockLevel.toString() : "1");
        setMaxStock(editingItem.maxStockLevel ? editingItem.maxStockLevel.toString() : "1");
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
    }
  }, [editingItem, open]);

  // Prevent invalid keys like '-', '+', 'e', '.' from being typed into integer stock fields
  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Disallow numbers and symbols/signs while typing (only letters and spaces allowed)
    const cleanVal = e.target.value.replace(/[^a-zA-Z\s]/g, "");
    const val = cleanVal.slice(0, 50); // Hard cap at 50 chars
    setItemName(val);
    validateItemName(val);
  };

  const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Strip non-digits
    val = val.replace(/[^0-9]/g, "");
    if (val.length > 10) val = val.slice(0, 10);
    setMinStock(val);
    validateMinStock(val, maxStock);
  };

  const handleMaxStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Strip non-digits
    val = val.replace(/[^0-9]/g, "");
    if (val.length > 10) val = val.slice(0, 10);
    setMaxStock(val);
    validateMaxStock(val, minStock);
  };

  const handleSave = () => {
    const isNameValid = validateItemName(itemName);
    const isMinValid = validateMinStock(minStock, maxStock);
    const isMaxValid = validateMaxStock(maxStock, minStock);

    if (!isNameValid || !isMinValid || !isMaxValid) return;

    const minNum = Number(minStock);
    const maxNum = Number(maxStock);

    onSave({
      itemName: itemName.trim(),
      categoryId,
      uomId,
      minStock: minNum,
      maxStock: maxNum,
      isActive: supplyActive,
    });
  };

  const hasErrors =
    !!itemNameError ||
    !!minStockError ||
    !!maxStockError ||
    !itemName.trim() ||
    !minStock.trim() ||
    !maxStock.trim();

  return (
    <ModalWrapper
      open={open}
      title={editingItem ? "Edit Supply Item" : "Add New Supply Item"}
      onClose={onClose}
      size="max-w-xl"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Supply Name <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            maxLength={50}
            value={itemName}
            onChange={handleNameChange}
            placeholder="e.g. White Sugar"
            className={`w-full rounded-xl border ${
              itemNameError
                ? "border-red-500 focus-visible:ring-red-500"
                : "border-border"
            } bg-card text-foreground px-4 py-2.5 text-sm transition-colors`}
          />
          {itemNameError && (
            <p className="mt-1.5 text-xs font-medium text-red-500 animate-in fade-in-50">
              {itemNameError}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring"
            >
              <option value={1}>Raw Materials</option>
              <option value={2}>Tools & Supplies</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Unit of Measurement
            </label>
            <select
              value={uomId}
              onChange={(e) => setUomId(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring"
            >
              <option value={1}>kg</option>
              <option value={2}>pcs</option>
              <option value={3}>liters</option>
              <option value={4}>m</option>
              <option value={5}>grams</option>
              <option value={6}>box</option>
              <option value={7}>pack</option>
              <option value={8}>roll</option>
              <option value={9}>bottle</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Min Stock Level <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={minStock}
              onKeyDown={handleNumberKeyDown}
              onChange={handleMinStockChange}
              placeholder="e.g. 10"
              className={`w-full rounded-xl border ${
                minStockError
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "border-border"
              } bg-card px-4 py-2.5 text-sm transition-colors`}
            />
            {minStockError && (
              <p className="mt-1.5 text-xs font-medium text-red-500 animate-in fade-in-50">
                {minStockError}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Max Stock Level <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={maxStock}
              onKeyDown={handleNumberKeyDown}
              onChange={handleMaxStockChange}
              placeholder="e.g. 100"
              className={`w-full rounded-xl border ${
                maxStockError
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "border-border"
              } bg-card px-4 py-2.5 text-sm transition-colors`}
            />
            {maxStockError && (
              <p className="mt-1.5 text-xs font-medium text-red-500 animate-in fade-in-50">
                {maxStockError}
              </p>
            )}
          </div>
        </div>

        {editingItem && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Status
            </label>
            <select
              value={supplyActive ? "true" : "false"}
              onChange={(e) => setSupplyActive(e.target.value === "true")}
              className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={hasErrors}
            onClick={handleSave}
            className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingItem ? "Save Changes" : "Create Supply"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

