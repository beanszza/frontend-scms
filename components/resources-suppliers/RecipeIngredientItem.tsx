"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { SupplyItem, Ingredient } from "./types";

interface RecipeIngredientItemProps {
  ingredient: Ingredient;
  index: number;
  canRemove: boolean;
  baseSupplies: SupplyItem[];
  error?: string;
  onRemove: (id: number) => void;
  onItemChange: (id: number, itemId: number, uomId: number) => void;
  onQuantityChange: (id: number, quantity: string) => void;
}

export default function RecipeIngredientItem({
  ingredient,
  index,
  canRemove,
  baseSupplies,
  error,
  onRemove,
  onItemChange,
  onQuantityChange,
}: RecipeIngredientItemProps) {
  return (
    <div className="rounded-xl border border-border p-4 bg-muted/20">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground border border-border">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-foreground">Ingredient Item</span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(ingredient.id)}
            className="p-1 rounded-lg text-foreground hover:text-foreground/70 bg-transparent hover:bg-muted/50 transition-colors"
            title="Remove ingredient"
          >
            <Trash2 size={16} className="text-foreground" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="sm:col-span-6">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Item</label>
          <select
            value={ingredient.itemId}
            onChange={(e) => {
              const newId = Number(e.target.value);
              const supply = baseSupplies.find((s) => s.itemId === newId);
              onItemChange(ingredient.id, newId, supply?.uomId || ingredient.uomId);
            }}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-ring"
          >
            {baseSupplies.map((supply) => (
              <option key={supply.itemId} value={supply.itemId}>
                {supply.itemName}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Quantity</label>
          {/* Ingredients are weighed, so fractions must be enterable: "0.75" kg of sugar. */}
          <Input
            type="number"
            min={0}
            step={0.001}
            placeholder="e.g. 0.75"
            value={ingredient.quantity}
            onChange={(e) => onQuantityChange(ingredient.id, e.target.value)}
            className={`w-full rounded-lg border ${error ? "border-red-500" : "border-border"} bg-card px-3 py-2 text-xs text-foreground`}
          />
        </div>
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Unit</label>
          <select
            value={ingredient.uomId}
            disabled
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground cursor-not-allowed"
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
    </div>
  );
}
