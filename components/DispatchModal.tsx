"use client";

import { useState } from "react";

type Transfer = {
  id: string;
  product: string;
  quantity: number;
  from: string;
  to: string;
  date: string;
  status: "Completed" | "In Transit" | "Pending";
};

type DispatchData = {
  dispatchDate: string;
  driverName: string;
  trackingNumber: string;
};

interface DispatchModalProps {
  transfer: Transfer;
  onClose: () => void;
  onConfirm: (id: string, data: DispatchData) => void;
}

export default function DispatchModal({ transfer, onClose, onConfirm }: DispatchModalProps) {
  const [dispatchDate, setDispatchDate] = useState("");
  const [driverName, setDriverName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchDate) return;
    onConfirm(transfer.id, { dispatchDate, driverName, trackingNumber });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1a2232] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col p-6 text-slate-900 dark:text-white" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-slate-700 pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transfer Details - {transfer.id}</h2>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400">
              {transfer.status}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold<a>✕</a>">✕</button>
        </div>

        {/* Info card layout block */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs p-4 bg-slate-50 dark:bg-[#24303f] border border-slate-100 dark:border-slate-700 rounded-xl mb-4">
          <div><p className="text-[10px] text-slate-400 font-medium">Product</p><p className="font-semibold text-slate-900 dark:text-white">{transfer.product}</p></div>
          <div><p className="text-[10px] text-slate-400 font-medium">Quantity</p><p className="font-semibold text-slate-900 dark:text-white">{transfer.quantity}</p></div>
          <div><p className="text-[10px] text-slate-400 font-medium">From</p><p className="font-semibold text-slate-900 dark:text-white">{transfer.from}</p></div>
          <div><p className="text-[10px] text-slate-400 font-medium">To</p><p className="font-semibold text-slate-900 dark:text-white">{transfer.to}</p></div>
          <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 pt-2"><p className="text-[10px] text-slate-400 font-medium">Transfer Date</p><p className="font-semibold text-slate-900 dark:text-white">{transfer.date}</p></div>
        </div>



        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Dispatch Date *</label>
            <input type="date" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Driver Name</label>
              <input type="text" placeholder="Driver name" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" value={driverName} onChange={e => setDriverName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tracking/Vehicle Number</label>
              <input type="text" placeholder="e.g., L300 / ABC-123" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="h-9 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">Dispatch</button>
          </div>
        </form>

      </div>
    </div>
  );
}