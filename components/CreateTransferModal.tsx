"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

type LocationItem = {
  id: string;
  name: string;
  type: string;
  address: string;
  status: string;
};

interface CreateTransferModalProps {
  onClose: () => void;
  onSave: (transfer: any) => void;
  locations: LocationItem[];
  mode?: "create" | "edit" | "view";
  initialData?: any;
}

type InventoryEntry = {
  inventoryId: number;
  itemId: number;
  itemName: string;
  locationId: number;
  locationName: string;
  currentStock: number;
};

type FinishedProductEntry = {
  productId: number;
  itemId: number;
  itemName: string;
  sku: string;
  variant?: string;
};

export default function CreateTransferModal({
  onClose,
  onSave,
  locations,
  mode = "create",
  initialData,
}: CreateTransferModalProps) {
  const [product, setProduct] = useState("");
  const [productError, setProductError] = useState("");
  const [to, setTo] = useState("");
  const [toError, setToError] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [date, setDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [products, setProducts] = useState<FinishedProductEntry[]>([]);
  const [inventories, setInventories] = useState<InventoryEntry[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Derived: the inventory entry for the selected product (determines source location & available stock)
  const selectedInventory = (() => {
    if (!product || products.length === 0 || inventories.length === 0) return null;
    const fp = products.find((p) => p.productId.toString() === product);
    if (!fp) return null;
    // Strictly find the inventory at the Commissary
    return inventories.find((inv) => inv.itemId === fp.itemId && inv.locationName.toLowerCase().includes("commissary")) 
           ?? inventories.find((inv) => inv.itemId === fp.itemId) // fallback
           ?? null;
  })();

  const availableStock = selectedInventory?.currentStock ?? null;
  const sourceLocationId = selectedInventory?.locationId ?? null;
  const sourceLocationName = selectedInventory?.locationName ?? "N/A";

  const isReadOnly = mode === "view";

  // Populate form when editing/viewing
  useEffect(() => {
    if (initialData) {
      setProduct(initialData.productId?.toString() || "");
      setTo(initialData.destLocationId?.toString() || "");
      setQuantity(initialData.quantity?.toString() || "");

      let dateVal = initialData.rawDate || initialData.date || "";
      if (dateVal.includes("/")) {
        const parts = dateVal.split("/");
        // Handle DD/MM/YYYY or M/D/YYYY
        if (parts.length === 3) {
          const [d, m, y] = parts;
          dateVal = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      } else if (dateVal.includes("-") && dateVal.length > 10) {
        dateVal = dateVal.substring(0, 10);
      }
      setDate(dateVal);
    }
  }, [initialData]);

  // Fetch finished products + inventory on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingProducts(true);
      try {
        const [prodRes, invRes] = await Promise.all([
          api.get("/api/scms/api/FinishedProducts"),
          api.get("/api/scms/api/Inventories?pageSize=100"),
        ]);
        if (prodRes.data.success) {
          setProducts(prodRes.data.data || []);
        }
        if (invRes.data.success) {
          setInventories(invRes.data.data?.items || []);
        }
      } catch (err) {
        console.error("Error fetching transfer modal data", err);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchData();
  }, []);

  // Reset quantity error when available stock changes
  useEffect(() => {
    if (quantity && availableStock !== null && Number(quantity) > availableStock) {
      setQuantityError(`Cannot exceed available stock of ${availableStock}.`);
    } else if (quantity && Number(quantity) > 0) {
      setQuantityError("");
    }
  }, [availableStock, quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!product) {
      setProductError("Product is required.");
      hasError = true;
    }
    if (!to) {
      setToError("Destination is required.");
      hasError = true;
    }
    if (!quantity || Number(quantity) <= 0) {
      setQuantityError("Quantity must be greater than 0.");
      hasError = true;
    } else if (availableStock !== null && Number(quantity) > availableStock) {
      setQuantityError(`Cannot exceed available stock of ${availableStock}.`);
      hasError = true;
    }
    if (!date) {
      setDateError("Transfer date is required.");
      hasError = true;
    }

    if (hasError || dateError === "Past date is not allowed.") return;

    setSubmitError("");

    try {
      if (mode === "edit" && initialData?.id) {
        await api.put(`/api/scms/api/StockTransfers/${initialData.id}`, {
          productId: Number(product),
          sourceLocationId: sourceLocationId ?? initialData.sourceLocationId ?? 1,
          destLocationId: Number(to),
          transferQuantity: Number(quantity),
          transferDate: date,
        });
      } else {
        if (!sourceLocationId) {
          setSubmitError("Could not determine source location. Ensure the product has inventory.");
          return;
        }
        await api.post("/api/scms/api/StockTransfers", {
          productId: Number(product),
          sourceLocationId: sourceLocationId,
          destLocationId: Number(to),
          transferQuantity: Number(quantity),
          transferDate: date,
        });
      }
      onSave({} as any);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Failed to save transfer. Please try again.";
      setSubmitError(msg);
    }
  };

  // Destination locations: exclude the source location for the selected product
  const destinationLocations = locations.filter(
    (loc) => !sourceLocationId || loc.id !== sourceLocationId.toString()
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#1a2232] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col p-6 text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-slate-700 pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === "create"
                ? "Create Stock Transfer"
                : mode === "edit"
                ? "Edit Stock Transfer"
                : "View Stock Transfer"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {mode === "view"
                ? "Details of stock transfer"
                : "Transfer finished stock goods across enterprise branches"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Finished Product */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Finished Product <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                productError
                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-gray-300 dark:border-slate-600"
              } bg-white dark:bg-[#24303f] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isReadOnly ? "opacity-60 cursor-not-allowed" : ""
              }`}
              value={product}
              onChange={(e) => {
                setProduct(e.target.value);
                setProductError("");
                setQuantity("");
                setQuantityError("");
                setTo("");
                setToError("");
                setSubmitError("");
              }}
              disabled={isReadOnly || isLoadingProducts}
            >
              <option value="" className="dark:bg-[#24303f]">
                {isLoadingProducts ? "Loading products…" : "Select product..."}
              </option>
              {products.map((p) => (
                <option key={p.productId} value={p.productId} className="dark:bg-[#24303f]">
                  {p.itemName}{p.variant ? `, ${p.variant}` : ""}
                </option>
              ))}
            </select>
            {productError && <p className="mt-1 text-xs text-red-500">{productError}</p>}
          </div>

          {/* Source info (read-only) */}
          {product && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">From Location:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedInventory ? sourceLocationName : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Available Stock:</span>
                <span
                  className={`font-bold ${
                    availableStock !== null && availableStock > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500"
                  }`}
                >
                  {availableStock !== null ? `${availableStock} units` : "No inventory found"}
                </span>
              </div>
            </div>
          )}

          {/* Destination */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              To Location <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                toError
                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-gray-300 dark:border-slate-600"
              } bg-white dark:bg-[#24303f] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isReadOnly ? "opacity-60 cursor-not-allowed" : ""
              }`}
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setToError("");
              }}
              disabled={isReadOnly}
            >
              <option value="" className="dark:bg-[#24303f]">
                Select destination...
              </option>
              {destinationLocations.map((loc) => (
                <option key={loc.id} value={loc.id} className="dark:bg-[#24303f]">
                  {loc.name}
                </option>
              ))}
            </select>
            {toError && <p className="mt-1 text-xs text-red-500">{toError}</p>}
          </div>

          {/* Quantity & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={availableStock ?? undefined}
                placeholder="e.g., 50"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  quantityError
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 dark:border-slate-600"
                } bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70`}
                value={quantity}
                disabled={isReadOnly}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") e.preventDefault();
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantity(val);
                  const num = Number(val);
                  if (!val || num <= 0) {
                    setQuantityError("Quantity must be greater than 0.");
                  } else if (availableStock !== null && num > availableStock) {
                    setQuantityError(`Cannot exceed available stock of ${availableStock}.`);
                  } else {
                    setQuantityError("");
                  }
                }}
              />
              {quantityError && <p className="mt-1 text-xs text-red-500">{quantityError}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Transfer Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  dateError
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 dark:border-slate-600"
                } bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70`}
                value={date}
                disabled={isReadOnly}
                onChange={(e) => {
                  const val = e.target.value;
                  setDate(val);
                  const today = new Date().toISOString().split("T")[0];
                  if (val && val < today) {
                    setDateError("Past date is not allowed.");
                  } else {
                    setDateError("");
                  }
                }}
              />
              {dateError && <p className="mt-1 text-xs text-red-500">{dateError}</p>}
            </div>
          </div>

          {/* Backend error */}
          {submitError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">⚠ {submitError}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700">
            {isReadOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !product ||
                    !to ||
                    !quantity ||
                    Number(quantity) <= 0 ||
                    !!quantityError ||
                    !!dateError ||
                    (availableStock !== null && availableStock <= 0)
                  }
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mode === "edit" ? "Save Changes" : "Create Transfer"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}