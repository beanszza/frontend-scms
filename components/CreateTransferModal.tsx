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
  onSave: (transfer: NewTransferData) => void;
  locations: LocationItem[];
}

export default function CreateTransferModal({ onClose, onSave, locations }: CreateTransferModalProps) {
  const [product, setProduct] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [date, setDate] = useState("");
  const [products, setProducts] = useState<any[]>([]);

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
    if (!product || !to || !quantity) return;
    
    if (Number(quantity) <= 0) {
      setQuantityError("Quantity must be greater than 0.");
      return;
    }

    try {
      await api.post("/api/scms/api/StockTransfers", {
        productId: Number(product),
        sourceLocationId: 1, // Fixed to Commissary Kitchen
        destLocationId: Number(to.replace("LOC-", "")),
        transferQuantity: Number(quantity),
      });
      onSave({} as any);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    /* FIXED: Forced explicit backdrop overlay tinting, centered layout, zoom-out scaling wrapper */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1a2232] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col p-6 text-slate-900 dark:text-white" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-slate-700 pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Stock Transfer</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Transfer finished stock goods across enterprise branches</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Finished Product *</label>
            <select className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={product} onChange={e => setProduct(e.target.value)} required>
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">To Location *</label>
            <select className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={to} onChange={e => setTo(e.target.value)} required>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Quantity *</label>
              <input 
                type="number" 
                min="1"
                placeholder="e.g., 50" 
                className={`w-full px-3 py-2 text-sm rounded-lg border ${quantityError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600'} bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`} 
                value={quantity} 
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
              <input type="date" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="h-9 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">Create Transfer</button>
          </div>
        </form>
      </div>
    </div>
  );
}