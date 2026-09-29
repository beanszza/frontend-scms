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
    ingredients: { itemId: number; uomId: number; standardQuantity: number }[];
    notes: string;
    isActive: boolean;
  }) => void;
}

export default function RecipeModal({
  open,
  editingRecipe,
  finishedProducts,
  baseSupplies,
  onClose,
  onSave,
}: RecipeModalProps) {
  const hasYieldSuffix = (value: string) =>
    /\s*(?:[-–—]\s*)?(?:good\s+for\s+)?\d+(?:\.\d+)?\s*(?:pcs?|pieces?|g|kg|grams?|kilograms?|ml|l|liters?|litres?|servings?|containers?)\s*$/i.test(value) ||
    /\s+pcs?\s*$/i.test(value);

  const [recipeName, setRecipeName] = useState("");
  const [productId, setProductId] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [recipeActive, setRecipeActive] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Errors
  const [recipeNameError, setRecipeNameError] = useState("");
  const [ingredientsErrors, setIngredientsErrors] = useState<{ [id: number]: string }>({});

  useEffect(() => {
    if (open) {
      if (editingRecipe) {
        setRecipeName(editingRecipe.recipeName || "");
        setProductId(editingRecipe.productId || (finishedProducts[0]?.productId ?? 0));
        setNotes(editingRecipe.notes || "");
        setRecipeActive(editingRecipe.isActive);
        if (editingRecipe.ingredients?.length > 0) {
          setIngredients(
            editingRecipe.ingredients.map((ing, idx) => ({
              id: Date.now() + idx,
              itemId: ing.itemId,
              quantity: ing.standardQuantity.toString(),
              uomId: ing.uomId || baseSupplies.find((s) => s.itemId === ing.itemId)?.uomId || 0,
            }))
          );
        } else {
          setIngredients([
            { id: Date.now(), itemId: baseSupplies[0]?.itemId ?? 0, quantity: "", uomId: baseSupplies[0]?.uomId ?? 0 },
          ]);
        }
      } else {
        setRecipeName("");
        setProductId(finishedProducts[0]?.productId ?? 0);
        setNotes("");
        setRecipeActive(true);
        setIngredients([
          { id: Date.now(), itemId: baseSupplies[0]?.itemId ?? 0, quantity: "", uomId: baseSupplies[0]?.uomId ?? 0 },
        ]);
      }
      setRecipeNameError("");
      setIngredientsErrors({});
    }
  }, [editingRecipe, open, finishedProducts, baseSupplies]);

  // Keep productId selected if products list arrives after mount
  useEffect(() => {
    if (!productId && finishedProducts.length > 0) {
      setProductId(finishedProducts[0].productId);
    }
  }, [finishedProducts, productId]);

  const handleSave = () => {
    let isValid = true;
    if (!recipeName.trim()) {
      setRecipeNameError("Recipe Name is required.");
      isValid = false;
    } else if (hasYieldSuffix(recipeName)) {
      setRecipeNameError("Enter only the dish or product name; do not include yield or unit suffixes.");
      isValid = false;
    }
    const errors: { [id: number]: string } = {};
    ingredients.forEach((ing) => {
      if (!ing.itemId || !ing.quantity.trim() || Number(ing.quantity) <= 0) {
        errors[ing.id] = "Quantity must be greater than 0.";
        isValid = false;
      }
    });
    setIngredientsErrors(errors);
    if (!isValid || !productId || productId <= 0) return;

    onSave({
      recipeName: recipeName.trim(),
      productId: Number(productId),
      ingredients: ingredients.map((i) => ({ itemId: i.itemId, uomId: i.uomId, standardQuantity: Number(i.quantity) })),
      notes: notes.trim(),
      isActive: recipeActive,
    });
  };

  // Check if form is valid to enable/disable button
  const isFormInvalid =
    !recipeName.trim() ||
    hasYieldSuffix(recipeName) ||
    !!recipeNameError ||
    !productId ||
    productId <= 0 ||
    ingredients.length === 0 ||
    ingredients.some((i) => !i.itemId || !i.quantity.trim() || Number(i.quantity) <= 0) ||
    Object.values(ingredientsErrors).some((err) => !!err);

  return (
    <ModalWrapper
      open={open}
      title={editingRecipe ? "Edit Recipe" : "Create New Recipe"}
      onClose={onClose}
      size="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Recipe Name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Recipe Name <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            maxLength={50}
            value={recipeName}
            onChange={(e) => {
              const val = e.target.value.slice(0, 50);
              setRecipeName(val);
              if (!val.trim()) setRecipeNameError("Recipe Name is required.");
              else if (hasYieldSuffix(val)) setRecipeNameError("Enter only the dish or product name; do not include yield or unit suffixes.");
              else setRecipeNameError("");
            }}
            placeholder="e.g. Ube Halaya"
            aria-invalid={!!recipeNameError}
            style={recipeNameError ? { borderColor: "var(--destructive)" } : undefined}
            className={`w-full rounded-xl border ${
              recipeNameError ? "!border-destructive focus-visible:!ring-destructive" : "border-border"
            } bg-card text-foreground px-4 py-2.5 text-sm transition-colors`}
          />
          {recipeNameError && (
            <p className="mt-1 text-xs text-destructive animate-in fade-in-50">{recipeNameError}</p>
          )}
        </div>

        {/* Finished Product */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Finished Product <span className="text-destructive">*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring transition-colors"
            >
              {finishedProducts.length === 0 ? (
                <option value={0}>No finished products found (configure in Production)</option>
              ) : (
                finishedProducts.map((fp) => (
                  <option key={fp.productId} value={fp.productId}>
                    {fp.itemName}
                    {fp.variant ? ` - ${fp.variant}` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

        </div>

        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          Please enter ingredient quantities per piece / per container (Good For One). The system will automatically
          scale quantities based on the production batch size.
        </div>

        {/* Ingredients List */}
        <div>
          <h3 className="mb-2 text-sm font-bold text-foreground">Ingredients List</h3>
          {baseSupplies.length === 0 && (
            <p className="mb-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              Add active supply items under the Ingredients category before creating a recipe.
            </p>
          )}
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <RecipeIngredientItem
                key={ingredient.id}
                ingredient={ingredient}
                index={index}
                canRemove={ingredients.length > 1}
                baseSupplies={baseSupplies}
                error={ingredientsErrors[ingredient.id]}
                onRemove={(id) => {
                  setIngredients((prev) => prev.filter((i) => i.id !== id));
                  setIngredientsErrors((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                  });
                }}
                onItemChange={(id, itemId, uomId) =>
                  setIngredients((prev) =>
                    prev.map((ing) => (ing.id === id ? { ...ing, itemId, uomId } : ing))
                  )
                }
                onQuantityChange={(id, quantity) => {
                  setIngredients((prev) =>
                    prev.map((ing) => (ing.id === id ? { ...ing, quantity } : ing))
                  );
                  if (!quantity.trim() || Number(quantity) <= 0) {
                    setIngredientsErrors((prev) => ({
                      ...prev,
                      [id]: "Quantity must be greater than 0.",
                    }));
                  } else {
                    setIngredientsErrors((prev) => {
                      const next = { ...prev };
                      delete next[id];
                      return next;
                    });
                  }
                }}
              />
            ))}
          </div>
          <Button
            type="button"
            onClick={() =>
              setIngredients((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  itemId: baseSupplies[0]?.itemId ?? 0,
                  quantity: "",
                  uomId: baseSupplies[0]?.uomId ?? 1,
                },
              ])
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground text-background font-semibold py-3 text-sm hover:bg-foreground/85 transition-colors shadow-sm"
          >
            <Plus size={16} className="text-background" /> Add Ingredient
          </Button>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-foreground">Notes</label>
            <span className="text-[11px] text-muted-foreground">{notes.length}/300</span>
          </div>
          <textarea
            value={notes}
            maxLength={300}
            onChange={(e) => setNotes(e.target.value.slice(0, 300))}
            placeholder="e.g. Additional preparation notes..."
            rows={3}
            className="w-full rounded-xl border border-border bg-card text-foreground px-4 py-2.5 text-xs resize-none transition-colors"
          />
        </div>

        {/* Status (when editing) */}
        {editingRecipe && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Status</label>
            <select
              value={recipeActive ? "true" : "false"}
              onChange={(e) => setRecipeActive(e.target.value === "true")}
              className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}

        {/* Modal Actions */}
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
            disabled={isFormInvalid}
            onClick={handleSave}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              isFormInvalid
                ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed border border-border"
                : "bg-foreground text-background hover:bg-foreground/85 shadow-sm"
            }`}
          >
            {editingRecipe ? "Save Recipe" : "Create Recipe"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

