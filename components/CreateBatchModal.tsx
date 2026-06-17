"use client";

import React, { useEffect, useState, useMemo } from "react";
import { X, Loader2, Check, AlertTriangle, Package } from "lucide-react";
import api from "../lib/api"; // keep import
import ConfirmModal from "./ConfirmModal"; // adjust path if needed

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

// ---------- MOCK DATA ----------
const MOCK_INGREDIENTS: Record<string, IngredientAllocation[]> = {
  "prod-1": [ // Longganisa
    { ingredientId: 1, ingredientName: "Ground Pork", requiredQty: 2, uom: "kg", availableStock: 50 },
    { ingredientId: 2, ingredientName: "Garlic", requiredQty: 0.2, uom: "kg", availableStock: 5 },
    { ingredientId: 3, ingredientName: "Salt", requiredQty: 0.05, uom: "kg", availableStock: 2 },
    { ingredientId: 4, ingredientName: "Sugar", requiredQty: 0.1, uom: "kg", availableStock: 10 },
  ],
  "prod-2": [ // Tocino
    { ingredientId: 5, ingredientName: "Pork Belly", requiredQty: 1.5, uom: "kg", availableStock: 20 },
    { ingredientId: 6, ingredientName: "Pineapple Juice", requiredQty: 0.3, uom: "L", availableStock: 8 },
    { ingredientId: 2, ingredientName: "Garlic", requiredQty: 0.15, uom: "kg", availableStock: 5 },
    { ingredientId: 7, ingredientName: "Annatto Powder", requiredQty: 0.02, uom: "kg", availableStock: 0.1 }, // sufficient
  ],
  "prod-3": [ // Siomai
    { ingredientId: 8, ingredientName: "Shrimp", requiredQty: 1, uom: "kg", availableStock: 400 },
    { ingredientId: 9, ingredientName: "Wrapper", requiredQty: 50, uom: "pcs", availableStock: 400 },
    { ingredientId: 10, ingredientName: "Soy Sauce", requiredQty: 0.1, uom: "L", availableStock: 400 },
  ],
};

const MOCK_PRODUCTS = [
  { id: "prod-1", name: "Longganisa" },
  { id: "prod-2", name: "Tocino" },
  { id: "prod-3", name: "Siomai" },
];

const MOCK_COOKS = [
  { id: "cook-1", name: "Juan Dela Cruz" },
  { id: "cook-2", name: "Maria Santos" },
  { id: "cook-3", name: "Pedro Reyes" },
];

export default function CreateBatchModal({ open, onClose, onCreated }: Props) {
  const [productType, setProductType] = useState("");
  const [productTypeError, setProductTypeError] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [quantityError, setQuantityError] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleDateError, setScheduleDateError] = useState("");
  const [batchType, setBatchType] = useState("Retail");
  const [assignedCook, setAssignedCook] = useState("");
  const [assignedCookError, setAssignedCookError] = useState("");
  const [ingredients, setIngredients] = useState<IngredientAllocation[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation state
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCloseAttempt = () => setShowCancelConfirm(true);

  // Reset on open
  useEffect(() => {
    if (open) {
      setProductType("");
      setProductTypeError("");
      setQuantity(0);
      setQuantityError("");
      setScheduleDate("");
      setScheduleDateError("");
      setBatchType("Retail");
      setAssignedCook("");
      setAssignedCookError("");
      setIngredients([]);
      setShowConfirm(false);
    }
  }, [open]);

  // Auto‑compute ingredients (mock)
  useEffect(() => {
    if (!productType || quantity <= 0) {
      setIngredients([]);
      return;
    }

    const fetchRecipe = async () => {
      setIsComputing(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const base = MOCK_INGREDIENTS[productType] || [];
        const scaled: IngredientAllocation[] = base.map((ing) => ({
          ...ing,
          requiredQty: parseFloat((ing.requiredQty * quantity).toFixed(2)),
        }));
        setIngredients(scaled);
      } catch (err) {
        console.error(err);
      } finally {
        setIsComputing(false);
      }
    };

    const debounce = setTimeout(fetchRecipe, 400);
    return () => clearTimeout(debounce);
  }, [productType, quantity]);

  // Stock validation
  const hasStockIssue = useMemo(() => {
    return ingredients.some((ing) => ing.availableStock < ing.requiredQty);
  }, [ingredients]);

  const isFormValid =
    productType &&
    quantity > 0 &&
    scheduleDate &&
    !scheduleDateError &&
    assignedCook &&
    !isSubmitting &&
    !hasStockIssue;

  // The function that actually submits the batch
  const submitBatch = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    setShowConfirm(false);
    try {
      // MOCK SUBMIT
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

    if (!productType) {
      setProductTypeError("Product type is required.");
      hasError = true;
    }
    if (quantity <= 0) {
      setQuantityError("Quantity must be greater than 0.");
      hasError = true;
    }
    if (!scheduleDate) {
      setScheduleDateError("Schedule date is required.");
      hasError = true;
    }
    if (!assignedCook) {
      setAssignedCookError("Assigned cook is required.");
      hasError = true;
    }

    if (hasError || scheduleDateError === "Past date is not allowed." || hasStockIssue) return;
    
    setShowConfirm(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={handleCloseAttempt}>
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#1D2939] border border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Type
              </label>
              <select
                value={productType}
                onChange={(e) => {
                  setProductType(e.target.value);
                  setProductTypeError("");
                }}
                className={`w-full rounded-xl border ${productTypeError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white`}
              >
                <option value="">Select product</option>
                {MOCK_PRODUCTS.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name}
                  </option>
                ))}
              </select>
              {productTypeError && <p className="mt-1 text-xs text-red-500">{productTypeError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                value={quantity || ""}
                onChange={(e) => {
                  setQuantity(Number(e.target.value));
                  if (Number(e.target.value) > 0) setQuantityError("");
                }}
                className={`w-full rounded-xl border ${quantityError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white`}
              />
              {quantityError && <p className="mt-1 text-xs text-red-500">{quantityError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setScheduleDate(val);
                  const today = new Date().toISOString().split("T")[0];
                  if (val && val < today) {
                    setScheduleDateError("Past date is not allowed.");
                  } else {
                    setScheduleDateError("");
                  }
                }}
                className={`w-full rounded-xl border ${scheduleDateError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white`}
              />
              {scheduleDateError && <p className="mt-1 text-xs text-red-500">{scheduleDateError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assigned Cook
              </label>
              <select
                value={assignedCook}
                onChange={(e) => {
                  setAssignedCook(e.target.value);
                  setAssignedCookError("");
                }}
                className={`w-full rounded-xl border ${assignedCookError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white`}
              >
                <option value="">Select cook</option>
                {MOCK_COOKS.map((cook) => (
                  <option key={cook.id} value={cook.id}>
                    {cook.name}
                  </option>
                ))}
              </select>
              {assignedCookError && <p className="mt-1 text-xs text-red-500">{assignedCookError}</p>}
            </div>
          </div>

          {/* Ingredient Allocation */}
          {isComputing && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" /> Computing ingredients…
            </div>
          )}
          {ingredients.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upon batch creation, the following quantities will be <strong>deducted</strong> from inventory once in production:
                </p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr className="text-left text-xs uppercase text-gray-500">
                      <th className="px-4 py-2">Ingredient</th>
                      <th className="px-4 py-2">To Deduct</th>
                      <th className="px-4 py-2">Available</th>
                      <th className="px-4 py-2">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((ing) => {
                      const sufficient = ing.availableStock >= ing.requiredQty;
                      return (
                        <tr key={ing.ingredientId} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="px-4 py-2 text-gray-900 dark:text-white">{ing.ingredientName}</td>
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
                                <AlertTriangle size={14} /> Insufficient
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {hasStockIssue && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle size={14} /> Insufficient stock for one or more ingredients. Please restock before creating this batch.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleCloseAttempt}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
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

      {/* Confirmation Modal */}
      {showConfirm && (
        <ConfirmModal
          message={`Are you sure you want to create this batch? The required ingredients will be deducted from inventory.`}
          onConfirm={submitBatch}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showCancelConfirm && (
        <ConfirmModal
          message="Are you sure you want to cancel? Any unsaved data will be lost."
          onConfirm={onClose}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  );
}