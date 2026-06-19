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

// ---------- MOCK DATA ----------
const MOCK_VARIANTS: Record<string, Variant[]> = {
  "prod-1": [
    {
      variantId: "v1",
      variantName: "Longganisa 50 pcs",
      targetYield: 50,
      yieldUnit: "pcs",
      ingredients: [
        {
          ingredientId: 1,
          ingredientName: "Ground Pork pork pano pag mahaba",
          requiredQty: 10,
          uom: "kg",
          availableStock: 8,
        },
        { ingredientId: 2, ingredientName: "Garlic", requiredQty: 1, uom: "kg", availableStock: 5 },
        { ingredientId: 3, ingredientName: "Salt", requiredQty: 0.2, uom: "kg", availableStock: 2 },
        { ingredientId: 4, ingredientName: "Sugar", requiredQty: 0.5, uom: "kg", availableStock: 10 },
      ],
    },
    {
      variantId: "v2",
      variantName: "Longganisa 30 pcs",
      targetYield: 30,
      yieldUnit: "pcs",
      ingredients: [
        { ingredientId: 1, ingredientName: "Ground Pork", requiredQty: 6, uom: "kg", availableStock: 8 },
        { ingredientId: 2, ingredientName: "Garlic", requiredQty: 0.6, uom: "kg", availableStock: 5 },
        { ingredientId: 3, ingredientName: "Salt", requiredQty: 0.12, uom: "kg", availableStock: 2 },
        { ingredientId: 4, ingredientName: "Sugar", requiredQty: 0.3, uom: "kg", availableStock: 10 },
      ],
    },
  ],
  "prod-2": [
    {
      variantId: "v3",
      variantName: "Tocino 300 pcs",
      targetYield: 300,
      yieldUnit: "pcs",
      ingredients: [
        { ingredientId: 5, ingredientName: "Pork Belly", requiredQty: 6, uom: "kg", availableStock: 20 },
        { ingredientId: 6, ingredientName: "Pineapple Juice", requiredQty: 1.2, uom: "L", availableStock: 8 },
        { ingredientId: 2, ingredientName: "Garlic", requiredQty: 0.5, uom: "kg", availableStock: 5 },
        { ingredientId: 7, ingredientName: "Annatto Powder", requiredQty: 0.1, uom: "kg", availableStock: 0.5 },
      ],
    },
  ],
  "prod-3": [
    {
      variantId: "v4",
      variantName: "Siomai 1000 pcs",
      targetYield: 1000,
      yieldUnit: "pcs",
      ingredients: [
        { ingredientId: 8, ingredientName: "Shrimp", requiredQty: 5, uom: "kg", availableStock: 40 },
        { ingredientId: 9, ingredientName: "Wrapper", requiredQty: 200, uom: "pcs", availableStock: 1000 },
        { ingredientId: 10, ingredientName: "Soy Sauce", requiredQty: 1, uom: "L", availableStock: 5 },
      ],
    },
  ],
};

const MOCK_PRODUCTS = [
  { id: "prod-1", name: "Longganisa" },
  { id: "prod-2", name: "Tocino" },
  { id: "prod-3", name: "Siomai" },
];

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

  const availableVariants = finishedProduct ? MOCK_VARIANTS[finishedProduct] ?? [] : [];

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
        await new Promise((resolve) => setTimeout(resolve, 300));
        const variants = MOCK_VARIANTS[finishedProduct] || [];
        const variant = variants.find((v) => v.variantId === selectedVariantId);
        if (variant) {
          setRecipeTargetYield(variant.targetYield);
          setYieldUnit(variant.yieldUnit);
          setIngredients(variant.ingredients);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsComputing(false);
      }
    };

    fetchRecipe();
  }, [selectedVariantId, finishedProduct]);

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
    return ingredients.some((ing) => ing.availableStock < ing.requiredQty);
  }, [ingredients]);

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Production Batch
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
                {MOCK_PRODUCTS.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name}
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
                Variant
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
                <option value="">Select variant</option>
                {availableVariants.map((v) => (
                  <option key={v.variantId} value={v.variantId}>
                    {v.variantName}
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
                      const deficit = ing.requiredQty - ing.availableStock;
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
                            {ing.requiredQty} {ing.uom}
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