"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import { Recipe, FinishedProduct, SupplyItem, Ingredient } from "./types";
import RecipeIngredientItem from "./RecipeIngredientItem";

interface RecipeModalProps {
  open: boolean;
  editingRecipe: Recipe | null;
  finishedProducts: FinishedProduct[];
  baseSupplies: SupplyItem[];
  onClose: () => void;
  onSave: (data: {
    recipeName: string;
    productId: number;
    outputQuantity: number;
    ingredients: { itemId: number; standardQuantity: number }[];
    notes: string;
    isActive: boolean;
  }) => void;
}

export default function RecipeModal({ open, editingRecipe, finishedProducts, baseSupplies, onClose, onSave }: RecipeModalProps) {
  const [recipeName, setRecipeName] = useState("");
  const [productId, setProductId] = useState<number>(0);
  const [outputQuantity, setOutputQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [recipeActive, setRecipeActive] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeNameError, setRecipeNameError] = useState("");
  const [recipeYieldError, setRecipeYieldError] = useState("");
  const [ingredientsErrors, setIngredientsErrors] = useState<{ [id: number]: string }>({});

  useEffect(() => {
    if (editingRecipe) {
      setRecipeName(editingRecipe.recipeName || "");
      setProductId(editingRecipe.productId || (finishedProducts[0]?.productId ?? 0));
      setOutputQuantity(editingRecipe.outputQuantity?.toString() || "");
      setNotes(editingRecipe.notes || "");
      setRecipeActive(editingRecipe.isActive);
      if (editingRecipe.ingredients?.length > 0) {
        setIngredients(editingRecipe.ingredients.map((ing, idx) => ({
          id: Date.now() + idx,
          itemId: ing.itemId,
          quantity: ing.standardQuantity.toString(),
          uomId: baseSupplies.find((s) => s.itemId === ing.itemId)?.uomId || 1,
        })));
      } else {
        setIngredients([{ id: Date.now(), itemId: baseSupplies[0]?.itemId ?? 0, quantity: "", uomId: baseSupplies[0]?.uomId ?? 1 }]);
      }
    } else {
      setRecipeName("");
      setProductId(finishedProducts[0]?.productId ?? 0);
      setOutputQuantity("");
      setNotes("");
      setRecipeActive(true);
      setIngredients([{ id: Date.now(), itemId: baseSupplies[0]?.itemId ?? 0, quantity: "", uomId: baseSupplies[0]?.uomId ?? 1 }]);
    }
    setRecipeNameError("");
    setRecipeYieldError("");
    setIngredientsErrors({});
  }, [editingRecipe, open, finishedProducts, baseSupplies]);

  const handleSave = () => {
    let isValid = true;
    if (!recipeName.trim()) { setRecipeNameError("Recipe Name is required."); isValid = false; }
    if (!outputQuantity.trim() || Number(outputQuantity) <= 0) { setRecipeYieldError("Valid Target Yield is required."); isValid = false; }

    const errors: { [id: number]: string } = {};
    ingredients.forEach((ing) => {
      if (!ing.quantity.trim() || Number(ing.quantity) <= 0) { errors[ing.id] = "Quantity must be > 0"; isValid = false; }
    });
    setIngredientsErrors(errors);
    if (!isValid) return;

    onSave({
      recipeName: recipeName.trim(),
      productId: Number(productId),
      outputQuantity: Number(outputQuantity),
      ingredients: ingredients.map((i) => ({ itemId: i.itemId, standardQuantity: Number(i.quantity) })),
      notes: notes.trim(),
      isActive: recipeActive,
    });
  };

  return (
    <ModalWrapper open={open} title={editingRecipe ? "Edit Recipe" : "Create New Recipe"} onClose={onClose} size="max-w-3xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Recipe Name <span className="text-muted-foreground">*</span></label>
          <Input
            type="text"
            value={recipeName}
            onChange={(e) => { setRecipeName(e.target.value); if (e.target.value.trim()) setRecipeNameError(""); }}
            placeholder="e.g. Classic Burger Patty"
            className={`w-full rounded-xl border ${recipeNameError ? "border-red-500" : "border-border"} bg-card text-foreground px-4 py-2.5 text-sm`}
          />
          {recipeNameError && <p className="mt-1 text-xs text-red-500">{recipeNameError}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Finished Product</label>
            <select value={productId} onChange={(e) => setProductId(Number(e.target.value))} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring">
              {finishedProducts.map((fp) => (
                <option key={fp.productId} value={fp.productId}>{fp.itemName}{fp.variant ? `, ${fp.variant}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Target Yield</label>
            <Input
              type="number"
              min={0}
              value={outputQuantity}
              onChange={(e) => { setOutputQuantity(e.target.value); if (e.target.value.trim()) setRecipeYieldError(""); }}
              placeholder="e.g. 100"
              className={`w-full rounded-xl border ${recipeYieldError ? "border-red-500" : "border-border"} bg-card px-4 py-2.5 text-sm`}
            />
            {recipeYieldError && <p className="mt-1 text-xs text-red-500">{recipeYieldError}</p>}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-foreground">Ingredients List</h3>
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <RecipeIngredientItem
                key={ingredient.id}
                ingredient={ingredient}
                index={index}
                canRemove={ingredients.length > 1}
                baseSupplies={baseSupplies}
                error={ingredientsErrors[ingredient.id]}
                onRemove={(id) => setIngredients((prev) => prev.filter((i) => i.id !== id))}
                onItemChange={(id, itemId, uomId) => setIngredients((prev) => prev.map((ing) => (ing.id === id ? { ...ing, itemId, uomId } : ing)))}
                onQuantityChange={(id, quantity) => setIngredients((prev) => prev.map((ing) => (ing.id === id ? { ...ing, quantity } : ing)))}
              />
            ))}
          </div>
          <Button type="button" onClick={() => setIngredients((prev) => [...prev, { id: Date.now(), itemId: baseSupplies[0]?.itemId ?? 0, quantity: "", uomId: baseSupplies[0]?.uomId ?? 1 }])} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground text-background font-semibold py-3 text-sm hover:bg-foreground/85 transition-colors shadow-sm">
            <Plus size={16} className="text-background" /> Add Ingredient
          </Button>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Additional preparation notes..." rows={3} className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-xs text-foreground resize-none" />
        </div>

        {editingRecipe && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Status</label>
            <select value={recipeActive ? "true" : "false"} onChange={(e) => setRecipeActive(e.target.value === "true")} className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors">Cancel</Button>
          <Button type="button" onClick={handleSave} className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors">{editingRecipe ? "Save Recipe" : "Create Recipe"}</Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
