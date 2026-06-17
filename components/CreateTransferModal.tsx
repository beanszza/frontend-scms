"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import ConfirmModal from "./ConfirmModal";

type LocationItem = {
  id: string;
  name: string;
  type: string;
  address: string;
  status: string;
};

type NewTransferData = {
  id: string;
  product: string;
  from: string;
  to: string;
  quantity: number;
  date: string;
  status: "Pending";
};

interface CreateTransferModalProps {
  onClose: () => void;
  onSave: (transfer: any) => void;
  locations: LocationItem[];
  mode?: "create" | "edit" | "view";
  initialData?: any;
}

export default function CreateTransferModal({ onClose, onSave, locations, mode = "create", initialData }: CreateTransferModalProps) {
  const [product, setProduct] = useState("");
  const [productError, setProductError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [toError, setToError] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [date, setDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isReadOnly = mode === "view";

  const handleCloseAttempt = () => {
    if (isReadOnly) {
      onClose();
    } else {
      setShowCancelConfirm(true);
    }
  };

  useEffect(() => {
    if (initialData) {
      setProduct(initialData.productId?.toString() || "");
      setFrom("1");
      setTo(initialData.destLocationId?.toString() || "");
      setQuantity(initialData.quantity?.toString() || "");
      
      let dateVal = initialData.rawDate || initialData.date || "";
      if (dateVal.includes("/")) {
        const [m, d, y] = dateVal.split("/");
        if (m && d && y) {
          dateVal = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      } else if (dateVal.includes("-") && dateVal.length > 10) {
          dateVal = dateVal.substring(0, 10);
      }
      setDate(dateVal);
    }
  }, [initialData]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch FinishedProducts directly since StockTransfers expects ProductId
        const res = await api.get("/api/scms/api/FinishedProducts");
        if (res.data.success) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching products", err);
      }
    };
    fetchProducts();
  }, []);

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
    if (!quantity) {
      setQuantityError("Quantity is required.");
      hasError = true;
    } else if (Number(quantity) <= 0) {
      setQuantityError("Quantity must be greater than 0.");
      hasError = true;
    }
    if (!date) {
      setDateError("Transfer date is required.");
      hasError = true;
    }

    if (hasError || dateError === "Past date is not allowed.") return;

    try {
      if (mode === "edit" && initialData?.id) {
        await api.put(`/api/scms/api/StockTransfers/${initialData.id}`, {
          productId: Number(product),
          sourceLocationId: 1, // Fixed to Commissary Kitchen
          destLocationId: Number(to),
          transferQuantity: Number(quantity),
          transferDate: date,
        });
      } else {
        await api.post("/api/scms/api/StockTransfers", {
          productId: Number(product),
          sourceLocationId: 1, // Fixed to Commissary Kitchen
          destLocationId: Number(to),
          transferQuantity: Number(quantity),
          transferDate: date,
        });
      }
      onSave({} as any);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={handleCloseAttempt}>
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1a2232] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col p-6 text-slate-900 dark:text-white" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-slate-700 pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === "create" ? "Create Stock Transfer" : mode === "edit" ? "Edit Stock Transfer" : "View Stock Transfer"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {mode === "view" ? "Details of stock transfer" : "Transfer finished stock goods across enterprise branches"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Finished Product *</label>
            <select 
              className={`w-full px-3 py-2 text-sm rounded-lg border ${productError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600'} bg-white dark:bg-[#24303f] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
              value={product} 
              onChange={e => {
                setProduct(e.target.value);
                setProductError("");
              }} 
              required 
              disabled={isReadOnly}>
              <option value="" className="dark:bg-[#24303f]">Select product...</option>
              {products.map(p => <option key={p.productId} value={p.productId} className="dark:bg-[#24303f]">{p.itemName}</option>)}
              {products.length === 0 && (
                <>
                  <option value="1" className="dark:bg-[#24303f]">Test Final Product</option>
                  <option value="2" className="dark:bg-[#24303f]">Ube Halaya (500g Jar)</option>
                  <option value="3" className="dark:bg-[#24303f]">Ube Jam (250g Jar)</option>
                </>
              )}
            </select>
            {productError && <p className="mt-1 text-xs text-red-500">{productError}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">To Location *</label>
            <select 
              className={`w-full px-3 py-2 text-sm rounded-lg border ${toError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600'} bg-white dark:bg-[#24303f] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
              value={to} 
              onChange={e => {
                setTo(e.target.value);
                setToError("");
              }} 
              required 
              disabled={isReadOnly}>
              <option value="" className="dark:bg-[#24303f]">Select destination...</option>
              {locations.filter(loc => loc.id !== "LOC-001" && loc.name !== "Commissary Kitchen").map(loc => <option key={loc.id} value={loc.id} className="dark:bg-[#24303f]">{loc.name}</option>)}
              {locations.filter(loc => loc.id !== "LOC-001" && loc.name !== "Commissary Kitchen").length === 0 && (
                <>
                  <option value="2" className="dark:bg-[#24303f]">Branch 1 - Quezon City</option>
                  <option value="3" className="dark:bg-[#24303f]">Branch 2 - Makati</option>
                  <option value="4" className="dark:bg-[#24303f]">Bazaar Booth - SM North</option>
                </>
              )}
            </select>
            {toError && <p className="mt-1 text-xs text-red-500">{toError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Quantity *</label>
              <input 
                type="number" 
                min="1"
                placeholder="e.g., 50" 
                className={`w-full px-3 py-2 text-sm rounded-lg border ${quantityError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600'} bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-800`} 
                value={quantity} 
                disabled={isReadOnly}
                onKeyDown={e => {
                  if (e.key === "-" || e.key === "e") e.preventDefault();
                }}
                onChange={e => {
                  let val = e.target.value;
                  if (val.startsWith("-") || (val !== "" && Number(val) < 0)) {
                    val = "0";
                  }
                  setQuantity(val);
                  if (val === "0") {
                    setQuantityError("Quantity must be greater than 0.");
                  } else {
                    setQuantityError("");
                  }
                }} 
                required 
              />
              {quantityError && <p className="mt-1 text-xs text-red-500">{quantityError}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Transfer Date *</label>
              <input 
                type="date" 
                className={`w-full px-3 py-2 text-sm rounded-lg border ${dateError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600'} bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-800`} 
                value={date} 
                disabled={isReadOnly}
                onChange={e => {
                  const val = e.target.value;
                  setDate(val);
                  const today = new Date().toISOString().split("T")[0];
                  if (val && val < today) {
                    setDateError("Past date is not allowed.");
                  } else {
                    setDateError("");
                  }
                }} 
                required 
              />
              {dateError && <p className="mt-1 text-xs text-red-500">{dateError}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700">
            {isReadOnly ? (
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Close</button>
            ) : (
              <>
                <button type="button" onClick={handleCloseAttempt} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30">
                  {mode === "edit" ? "Save Changes" : "Create Transfer"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

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