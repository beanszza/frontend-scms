"use client";

import React, { useEffect, useState, useMemo } from "react";
import { X, Loader2, Check, AlertTriangle, Package } from "lucide-react";
import api from "../lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type IngredientAllocation = {
  ingredientId: number;
  ingredientName: string;
  requiredQty: number;
  uom: string;
  availableStock: number;
};

type Variant = {
  variantId: string;
  variantName: string;
  targetYield: number;
  yieldUnit: string;
  ingredients: IngredientAllocation[];
};

// Type definitions for backend responses
type FinishedProductResponse = {
  productId: number;
  itemId: number;
  itemName: string;
  sku: string;
  variant: string;
};

type RecipeIngredientResponse = {
  ingredientId: number;
  itemId: number;
  uomId: number;
  standardQuantity: number;
};

type RecipeResponse = {
  recipeId: number;
  productId: number;
  recipeName: string;
  outputQuantity: number;
  ingredients: RecipeIngredientResponse[];
};

type ItemResponse = {
  itemId: number;
  itemName: string;
  uomName: string;
  currentStock: number;
};

export default function CreateBatchModal({ open, onClose, onCreated }: Props) {
  const [finishedProduct, setFinishedProduct] = useState("");
  const [finishedProductError, setFinishedProductError] = useState("");

  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [variantError, setVariantError] = useState("");

  const [userTargetYield, setUserTargetYield] = useState<number | "">("");
  const [targetYieldError, setTargetYieldError] = useState("");

  const [recipeTargetYield, setRecipeTargetYield] = useState<number | null>(null);
  const [yieldUnit, setYieldUnit] = useState("");

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleDateError, setScheduleDateError] = useState("");

  const [ingredients, setIngredients] = useState<IngredientAllocation[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState<FinishedProductResponse[]>([]);
  const [recipes, setRecipes] = useState<RecipeResponse[]>([]);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const availableVariants = useMemo(() => {
    if (!finishedProduct) return [];
    return recipes.filter(r => r.productId.toString() === finishedProduct);
  }, [finishedProduct, recipes]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setFinishedProduct("");
      setFinishedProductError("");
      setSelectedVariantId("");
      setVariantError("");
      setUserTargetYield("");
      setTargetYieldError("");
      setRecipeTargetYield(null);
      setYieldUnit("");
      setScheduleDate("");
      setScheduleDateError("");
      setIngredients([]);
      setIsComputing(false);
      setIsSubmitting(false);

      // Fetch all required data
      const loadData = async () => {
        setIsLoadingData(true);
        try {
          const [prodRes, recipeRes, itemRes] = await Promise.all([
            api.get("/api/scms/api/FinishedProducts"),
            api.get("/api/scms/api/Recipes"),
            api.get("/api/scms/api/Items?pageSize=1000"),
          ]);
          setProducts(prodRes.data.data?.items || prodRes.data.data || []);
          setRecipes(recipeRes.data.data?.items || recipeRes.data.data || []);
          setItems(itemRes.data.data?.items || itemRes.data.data || []);
        } catch (err) {
          console.error("Failed to load master data for Create Batch Modal", err);
        } finally {
          setIsLoadingData(false);
        }
      };
      loadData();
    }
  }, [open]);

  // Load recipe when variant changes
  useEffect(() => {
    if (!selectedVariantId || !finishedProduct) {
      setRecipeTargetYield(null);
      setYieldUnit("");
      setIngredients([]);
      return;
    }

    const fetchRecipe = async () => {
      setIsComputing(true);
      try {
        const variant = availableVariants.find((v) => v.recipeId.toString() === selectedVariantId);
        if (variant) {
          setRecipeTargetYield(variant.outputQuantity);
          // Get the base unit for the product item
          const prodItem = items.find(i => i.itemId === products.find(p => p.productId.toString() === finishedProduct)?.itemId);
          setYieldUnit(prodItem?.uomName || "units");
          
          // Map ingredients to display shape
          const computedIngredients = variant.ingredients
            .filter(ing => ing.itemId !== prodItem?.itemId)
            .map(ing => {
            const item = items.find(i => i.itemId === ing.itemId);
            return {
              ingredientId: ing.ingredientId,
              ingredientName: item?.itemName || `Item #${ing.itemId}`,
              requiredQty: ing.standardQuantity,
              uom: item?.uomName || "",
              availableStock: item?.currentStock || 0
            };
          });
          setIngredients(computedIngredients);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsComputing(false);
      }
    };

    fetchRecipe();
  }, [selectedVariantId, finishedProduct, availableVariants, items, products]);

  // Validate user target yield against recipe target yield
  useEffect(() => {
    if (recipeTargetYield !== null && userTargetYield !== "" && Number(userTargetYield) > 0) {
      if (Number(userTargetYield) !== recipeTargetYield) {
        setTargetYieldError(`Target yield must be exactly ${recipeTargetYield} ${yieldUnit}`);
      } else {
        setTargetYieldError("");
      }
    } else if (recipeTargetYield !== null && userTargetYield === "") {
      setTargetYieldError("Target yield is required");
    } else {
      setTargetYieldError("");
    }
  }, [userTargetYield, recipeTargetYield, yieldUnit]);

  const hasStockIssue = useMemo(() => {
    const multiplier = recipeTargetYield && userTargetYield !== "" && Number(userTargetYield) > 0 
      ? Math.ceil(Number(userTargetYield) / recipeTargetYield) 
      : 1;
    return ingredients.some((ing) => ing.availableStock < ing.requiredQty * multiplier);
  }, [ingredients, userTargetYield, recipeTargetYield]);

  const isFormValid =
    finishedProduct &&
    selectedVariantId &&
    userTargetYield !== "" &&
    Number(userTargetYield) > 0 &&
    !targetYieldError &&
    scheduleDate &&
    !scheduleDateError &&
    !isSubmitting &&
    !hasStockIssue;

  const submitBatch = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    try {
      const multiplier = Math.ceil(Number(userTargetYield) / (recipeTargetYield || 1));
      
      await api.post("/api/scms/api/ProductionBatches", {
        recipeId: Number(selectedVariantId),
        productId: Number(finishedProduct),
        batchMultiplier: multiplier,
        scheduleDate: scheduleDate + "T00:00:00Z",
        assignedCook: "System Assignment" // Or user selector if available
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create batch", err);
      alert("Failed to create batch due to insufficient stock or server error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBatch = () => {
    let hasError = false;

    if (!finishedProduct) {
      setFinishedProductError("Finished product is required.");
      hasError = true;
    }
    if (!selectedVariantId) {
      setVariantError("Variant is required.");
      hasError = true;
    }
    if (userTargetYield === "" || Number(userTargetYield) <= 0) {
      setTargetYieldError("Target yield must be greater than 0.");
      hasError = true;
    }
    if (!scheduleDate) {
      setScheduleDateError("Schedule date is required.");
      hasError = true;
    }

    if (hasError || scheduleDateError || targetYieldError || hasStockIssue) return;

    submitBatch();
  };

  // ---------- Date validation ----------
  const validateScheduleDate = (val: string) => {
    if (!val) {
      setScheduleDateError("");
      return;
    }
    // Basic format check
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(val)) {
      setScheduleDateError("Invalid date format.");
      return;
    }
    const dateObj = new Date(val + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(dateObj.getTime())) {
      setScheduleDateError("Invalid date.");
    } else if (dateObj < today) {
      setScheduleDateError("Past date is not allowed.");
    } else if (dateObj.getFullYear() > 2100) {
      setScheduleDateError("Year cannot exceed 2100.");
    } else {
      setScheduleDateError("");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#1D2939] border border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Create Production Batch
            {isLoadingData && <Loader2 size={16} className="animate-spin text-gray-400" />}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Finished Product */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Finished Product
              </label>
              <select
                value={finishedProduct}
                onChange={(e) => {
                  setFinishedProduct(e.target.value);
                  setFinishedProductError("");
                  setSelectedVariantId("");
                  setUserTargetYield("");
                  setTargetYieldError("");
                  setVariantError("");
                }}
                className={`w-full rounded-xl border ${
                  finishedProductError
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-700"
                } bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white`}
              >
                <option value="">Select product</option>
                {products.map((prod) => (
                  <option key={prod.productId} value={prod.productId}>
                    {prod.itemName}{prod.variant ? `, ${prod.variant}` : ""}
                  </option>
                ))}
              </select>
              {finishedProductError && (
                <p className="mt-1 text-xs text-red-500">{finishedProductError}</p>
              )}
            </div>

            {/* Variant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipe/BOM
              </label>
              <select
                value={selectedVariantId}
                onChange={(e) => {
                  setSelectedVariantId(e.target.value);
                  setVariantError("");
                  setUserTargetYield("");
                  setTargetYieldError("");
                }}
                disabled={!finishedProduct}
                className={`w-full rounded-xl border ${
                  variantError
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-700"
                } bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">Select recipe/BOM</option>
                {availableVariants.map((v) => (
                  <option key={v.recipeId} value={v.recipeId}>
                    {v.recipeName}
                  </option>
                ))}
              </select>
              {variantError && <p className="mt-1 text-xs text-red-500">{variantError}</p>}
            </div>

            {/* Editable Target Yield */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Yield
              </label>
              <input
                type="number"
                min={1}
                value={userTargetYield}
                onChange={(e) => {
                  const val = e.target.value;
                  setUserTargetYield(val === "" ? "" : Number(val));
                }}
                placeholder="Enter target yield"
                disabled={!recipeTargetYield}
                className={`w-full rounded-xl border ${
                  targetYieldError
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-700"
                } bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {targetYieldError && (
                <p className="mt-1 text-xs text-red-500">{targetYieldError}</p>
              )}
            </div>

            {/* Schedule Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                max="2100-12-31"
                onChange={(e) => {
                  const val = e.target.value;
                  setScheduleDate(val);
                  validateScheduleDate(val);
                }}
                className={`w-full rounded-xl border ${
                  scheduleDateError
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-700"
                } bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white`}
              />
              {scheduleDateError && (
                <p className="mt-1 text-xs text-red-500">{scheduleDateError}</p>
              )}
            </div>
          </div>

          {/* Ingredient Allocation */}
          {isComputing && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" /> Computing ingredients…
            </div>
          )}
          {!isComputing && ingredients.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Ingredients / Bill of Materials</strong>
                </p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr className="text-left text-xs uppercase text-gray-500">
                      <th className="px-4 py-2">Ingredient Item</th>
                      <th className="px-4 py-2">Item Quantity</th>
                      <th className="px-4 py-2">Current Stock &amp; Unit</th>
                      <th className="px-4 py-2">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((ing) => {
                      const multiplier = recipeTargetYield && userTargetYield !== "" && Number(userTargetYield) > 0 
                        ? Math.ceil(Number(userTargetYield) / recipeTargetYield) 
                        : 1;
                      const required = ing.requiredQty * multiplier;
                      const deficit = required - ing.availableStock;
                      const sufficient = deficit <= 0;
                      return (
                        <tr
                          key={ing.ingredientId}
                          className="border-t border-gray-100 dark:border-gray-800"
                        >
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {ing.ingredientName}
                          </td>
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                            {required} {ing.uom}
                          </td>
                          <td className="px-4 py-2">
                            {ing.availableStock} {ing.uom}
                          </td>
                          <td className="px-4 py-2">
                            {sufficient ? (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <Check size={14} /> Sufficient
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-500">
                                <AlertTriangle size={14} /> Insufficient by {deficit.toFixed(2)}{" "}
                                {ing.uom}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {recipeTargetYield !== null && (
                <p className="ml-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Recipe target yield: {recipeTargetYield} {yieldUnit}
                </p>
              )}

              {hasStockIssue && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle size={14} /> Insufficient stock for one or more ingredients. Please
                  restock before creating this batch.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddBatch}
            disabled={!isFormValid}
            className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Add Batch
          </button>
        </div>
      </div>
    </div>
  );
}