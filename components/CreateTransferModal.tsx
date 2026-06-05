"use client";

import { useState } from "react";

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
  const [date, setDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !from || !to || !quantity || !date) return;

    onSave({
      id: `TRF-${String(Date.now()).slice(-3)}`,
      product,
      from,
      to,
      quantity: Number(quantity),
      date,
      status: "Pending",
    });
    onClose();
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
              <option value="Ube Halaya (500g Jar)" className="dark:bg-[#24303f]">Ube Halaya (500g Jar)</option>
              <option value="Ube Jam (250g Jar)" className="dark:bg-[#24303f]">Ube Jam (250g Jar)</option>
              <option value="Coconut Ube Halaya (500g Jar)" className="dark:bg-[#24303f]">Coconut Ube Halaya (500g Jar)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">From Location *</label>
              <select className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={from} onChange={e => setFrom(e.target.value)} required>
                <option value="" className="dark:bg-[#24303f]">Select source...</option>
                {locations.map(loc => <option key={loc.id} value={loc.name} className="dark:bg-[#24303f]">{loc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">To Location *</label>
              <select className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={to} onChange={e => setTo(e.target.value)} required>
                <option value="" className="dark:bg-[#24303f]">Select destination...</option>
                {locations.map(loc => <option key={loc.id} value={loc.name} className="dark:bg-[#24303f]">{loc.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Quantity *</label>
              <input type="number" placeholder="e.g., 50" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" value={quantity} onChange={e => setQuantity(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Transfer Date *</label>
              <input type="text" placeholder="MM/DD/YYYY" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" value={date} onChange={e => setDate(e.target.value)} required />
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