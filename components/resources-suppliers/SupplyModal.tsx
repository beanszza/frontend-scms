"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ModalWrapper from "./ModalWrapper";
import { SupplyItem } from "./types";

interface Supplier {
  supplierId: number;
  companyName: string;
  supplierCode?: string;
}

interface SupplyModalProps {
  open: boolean;
  editingItem: SupplyItem | null;
  existingSupplies?: SupplyItem[];
  suppliers?: Supplier[];
  onClose: () => void;
  onSave: (data: {
    itemName: string;
    categoryId: number;
    uomId: number;
    minStock: number;
    maxStock: number;
    isActive: boolean;
    supplierIds: number[];
  }) => void;
}

export default function SupplyModal({
  open,
  editingItem,
  existingSupplies = [],
  suppliers = [],
  onClose,
  onSave,
}: SupplyModalProps) {
  const [itemName, setItemName] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [uomId, setUomId] = useState(1);
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [supplyActive, setSupplyActive] = useState(true);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [supplierError, setSupplierError] = useState("");

  const [itemNameError, setItemNameError] = useState("");
  const [minStockError, setMinStockError] = useState("");
  const [maxStockError, setMaxStockError] = useState("");

  const validateItemName = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) { setItemNameError("Supply Name is required."); return false; }
    if (!/^[a-zA-Z\s]+$/.test(val)) { setItemNameError("Supply Name can only contain letters."); return false; }
    if (trimmed.length < 2) { setItemNameError("Supply Name must be at least 2 characters."); return false; }
    if (trimmed.length > 50) { setItemNameError("Supply Name cannot exceed 50 characters."); return false; }
    const isDuplicate = existingSupplies.some(
      (item) => item.itemName.trim().toLowerCase() === trimmed.toLowerCase() && item.itemId !== editingItem?.itemId
    );
    if (isDuplicate) { setItemNameError("Supply item name already exists."); return false; }
    setItemNameError(""); return true;
  };

  const validateMinStock = (val: string, currentMax: string) => {
    const trimmed = val.trim();
    if (!trimmed) { setMinStockError("Min Stock Level is required."); return false; }
    const num = Number(trimmed);
    if (isNaN(num) || num < 1) { setMinStockError("Min Stock Level must be at least 1."); return false; }
    setMinStockError("");
    if (currentMax.trim()) {
      const maxNum = Number(currentMax);
      if (!isNaN(maxNum) && maxNum >= 1 && maxNum < num) setMaxStockError("Max stock cannot be less than min stock.");
      else setMaxStockError("");
    }
    return true;
  };

  const validateMaxStock = (val: string, currentMin: string) => {
    const trimmed = val.trim();
    if (!trimmed) { setMaxStockError("Max Stock Level is required."); return false; }
    const num = Number(trimmed);
    if (isNaN(num) || num < 1) { setMaxStockError("Max Stock Level must be at least 1."); return false; }
    if (currentMin.trim()) {
      const minNum = Number(currentMin);
      if (!isNaN(minNum) && num < minNum) { setMaxStockError("Max stock cannot be less than min stock."); return false; }
    }
    setMaxStockError(""); return true;
  };

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setItemName(editingItem.itemName || "");
        setCategoryId(
          editingItem.categoryName === "Tools and Supplies" || editingItem.categoryName === "Tools & Supplies" ? 2 : 1
        );
        setUomId(editingItem.uomId || 1);
        setMinStock(editingItem.minStockLevel ? editingItem.minStockLevel.toString() : "1");
        setMaxStock(editingItem.maxStockLevel ? editingItem.maxStockLevel.toString() : "1");
        setSupplyActive(editingItem.isActive !== false);
        setSelectedSupplierIds(editingItem.supplierIds || []);
      } else {
        setItemName(""); setCategoryId(1); setUomId(1);
        setMinStock(""); setMaxStock(""); setSupplyActive(true); setSelectedSupplierIds([]);
      }
      setItemNameError(""); setMinStockError(""); setMaxStockError(""); setSupplierError("");
    }
  }, [editingItem, open]);

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E", "."].includes(e.key)) e.preventDefault();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 50);
    setItemName(val); validateItemName(val);
  };

  const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setMinStock(val); validateMinStock(val, maxStock);
  };

  const handleMaxStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setMaxStock(val); validateMaxStock(val, minStock);
  };

  const handleSave = () => {
    const isNameValid = validateItemName(itemName);
    const isMinValid = validateMinStock(minStock, maxStock);
    const isMaxValid = validateMaxStock(maxStock, minStock);
    const hasSupplier = selectedSupplierIds.length > 0;
    if (!hasSupplier) setSupplierError("At least one supplier is required.");
    if (!isNameValid || !isMinValid || !isMaxValid || !hasSupplier) return;
    onSave({
      itemName: itemName.trim(),
      categoryId,
      uomId,
      minStock: Number(minStock),
      maxStock: Number(maxStock),
      isActive: supplyActive,
      supplierIds: selectedSupplierIds,
    });
  };

  const hasErrors =
    !!itemNameError || !!minStockError || !!maxStockError || !!supplierError ||
    !itemName.trim() || !minStock.trim() || !maxStock.trim() ||
    selectedSupplierIds.length === 0;

  return (
    <ModalWrapper
      open={open}
      title={editingItem ? "Edit Supply Item" : "Add New Supply Item"}
      onClose={onClose}
      size="max-w-xl"
    >
      <div className="space-y-4">
        {/* Supply Name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Supply Name <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            maxLength={50}
            value={itemName}
            onChange={handleNameChange}
            aria-invalid={!!itemNameError}
            placeholder="e.g. White Sugar"
            style={itemNameError ? { borderColor: "var(--destructive)" } : undefined}
            className={`w-full rounded-xl border ${
              itemNameError ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
            } bg-card text-foreground px-4 py-2.5 text-sm transition-colors`}
          />
          {itemNameError && (
            <p className="mt-1.5 text-xs font-medium text-destructive animate-in fade-in-50">{itemNameError}</p>
          )}
        </div>

        {/* Category & UOM */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring"
            >
              <option value={1}>Raw Materials</option>
              <option value={2}>Tools &amp; Supplies</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Unit of Measurement</label>
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

        {/* Min & Max Stock */}
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
              aria-invalid={!!minStockError}
              placeholder="e.g. 10"
              style={minStockError ? { borderColor: "var(--destructive)" } : undefined}
              className={`w-full rounded-xl border ${
                minStockError ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
              } bg-card px-4 py-2.5 text-sm transition-colors`}
            />
            {minStockError && (
              <p className="mt-1.5 text-xs font-medium text-destructive animate-in fade-in-50">{minStockError}</p>
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
              aria-invalid={!!maxStockError}
              placeholder="e.g. 100"
              style={maxStockError ? { borderColor: "var(--destructive)" } : undefined}
              className={`w-full rounded-xl border ${
                maxStockError ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
              } bg-card px-4 py-2.5 text-sm transition-colors`}
            />
            {maxStockError && (
              <p className="mt-1.5 text-xs font-medium text-destructive animate-in fade-in-50">{maxStockError}</p>
            )}
          </div>
        </div>

        {/* Linked Suppliers */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              Linked Suppliers <span className="text-destructive">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground">{suppliers.length} available</span>
          </div>
          <Popover
            open={openCombobox}
            onOpenChange={(val) => {
              setOpenCombobox(val);
              if (!val && selectedSupplierIds.length === 0)
                setSupplierError("At least one supplier is required.");
              else
                setSupplierError("");
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                aria-invalid={!!supplierError}
                style={supplierError ? { borderColor: "var(--destructive)" } : undefined}
                className={`w-full justify-between rounded-xl border bg-card text-foreground font-normal hover:bg-muted text-sm ${
                  supplierError ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
                }`}
              >
                {selectedSupplierIds.length === 0
                  ? "Select suppliers..."
                  : `${selectedSupplierIds.length} supplier${selectedSupplierIds.length === 1 ? "" : "s"} selected`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0 z-[100000]"
              align="start"
              sideOffset={4}
            >
              <Command>
                <CommandInput placeholder="Search suppliers..." />
                <CommandList>
                  <CommandEmpty>No suppliers found.</CommandEmpty>
                  <CommandGroup>
                    {suppliers.map((s) => (
                      <CommandItem
                        key={s.supplierId}
                        value={`${s.supplierCode || ""} ${s.companyName}`}
                        onSelect={() => {
                          setSelectedSupplierIds((prev) => {
                            const next = prev.includes(s.supplierId)
                              ? prev.filter((id) => id !== s.supplierId)
                              : [...prev, s.supplierId];
                            if (next.length > 0) setSupplierError("");
                            else setSupplierError("At least one supplier is required.");
                            return next;
                          });
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedSupplierIds.includes(s.supplierId) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {s.supplierCode ? `${s.supplierCode} — ` : ""}
                        {s.companyName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {supplierError && (
            <p className="mt-1 text-xs font-medium text-destructive animate-in fade-in-50">{supplierError}</p>
          )}
          {selectedSupplierIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {selectedSupplierIds.map((id) => {
                const sup = suppliers.find((s) => s.supplierId === id);
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="rounded-md px-2 py-1 flex items-center gap-1 bg-muted border border-border text-foreground"
                  >
                    {sup?.supplierCode ? `${sup.supplierCode} — ` : ""}
                    {sup?.companyName}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                      onClick={() => {
                        setSelectedSupplierIds((prev) => {
                          const next = prev.filter((prevId) => prevId !== id);
                          if (next.length === 0) setSupplierError("At least one supplier is required.");
                          return next;
                        });
                      }}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Status (edit only) */}
        {editingItem && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Status</label>
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
