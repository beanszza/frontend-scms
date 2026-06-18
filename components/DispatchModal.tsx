"use client";

import React, { useState, useRef } from "react";
import { Upload, Trash2 } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

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
  receiptImages: File[];
};

interface DispatchModalProps {
  transfer: Transfer;
  onClose: () => void;
  onConfirm: (id: string, data: DispatchData) => void;
}

export default function DispatchModal({ transfer, onClose, onConfirm }: DispatchModalProps) {
  const [dispatchDate, setDispatchDate] = useState("");
  const [dispatchDateError, setDispatchDateError] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverNameError, setDriverNameError] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingNumberError, setTrackingNumberError] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCloseAttempt = () => setShowCancelConfirm(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) =>
      ["image/jpeg", "image/png", "image/jpg"].includes(f.type)
    );
    setSelectedFiles((prev) => [...prev, ...valid]);
    valid.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url]);
    });
    if (valid.length > 0) setReceiptError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!dispatchDate) {
      setDispatchDateError("Dispatch date is required.");
      hasError = true;
    }

    if (!driverName.trim()) {
      setDriverNameError("Driver name is required.");
      hasError = true;
    }

    if (!trackingNumber.trim()) {
      setTrackingNumberError("Tracking/Vehicle number is required.");
      hasError = true;
    }

    if (selectedFiles.length === 0) {
      setReceiptError("Proof of transaction (receipt) is required.");
      hasError = true;
    } else {
      setReceiptError("");
    }

    if (hasError || dispatchDateError === "Past date is not allowed." || driverNameError === "No numbers and special characters are allowed." || trackingNumberError === "No special characters or spaces are allowed.") {
      return;
    }
    
    onConfirm(transfer.id, { dispatchDate, driverName, trackingNumber, receiptImages: selectedFiles });
  };

  const handleDriverNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDriverName(val);
    if (!val.trim()) {
      setDriverNameError("Driver name is required.");
    } else if (!/^[A-Za-z\s]*$/.test(val)) {
      setDriverNameError("No numbers and special characters are allowed.");
    } else {
      setDriverNameError("");
    }
  };

  const handleTrackingNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTrackingNumber(val);
    if (!val.trim()) {
      setTrackingNumberError("Tracking/Vehicle number is required.");
    } else if (!/^[A-Za-z0-9]*$/.test(val)) {
      setTrackingNumberError("No special characters or spaces are allowed.");
    } else {
      setTrackingNumberError("");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={handleCloseAttempt}>
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1a2232] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col p-6 text-slate-900 dark:text-white" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-slate-700 pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dispatch Transfer</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Assign vehicle and driver details to initiate stock transit</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold">✕</button>
        </div>

        {/* Info card layout block */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs p-4 bg-slate-50 dark:bg-[#24303f] border border-slate-100 dark:border-slate-700 rounded-xl mb-4">
          <div><p className="text-[10px] text-slate-400 font-medium">Product</p><p className="font-semibold text-slate-900 dark:text-white">{transfer.product}</p></div>
          <div><p className="text-[10px] text-slate-400 font-medium">Quantity</p><p className="font-semibold text-slate-900 dark:text-white">{transfer.quantity}</p></div>
          <div><p className="text-[10px] text-slate-400 font-medium">From</p><p className="font-semibold text-slate-900 dark:text-white">{transfer.from}</p></div>
          <div><p className="text-[10px] text-slate-400 font-medium">To</p><p className="font-semibold text-slate-900 dark:text-white">{transfer.to}</p></div>
          <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 pt-2"><p className="text-[10px] text-slate-400 font-medium">Transfer Date</p><p className="font-semibold text-slate-900 dark:text-white">{transfer.date}</p></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Dispatch Date *</label>
            <input 
              type="date" 
              className={`w-full px-3 py-2 text-sm rounded-lg border ${dispatchDateError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600'} bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`} 
              value={dispatchDate} 
              onChange={e => {
                const val = e.target.value;
                setDispatchDate(val);
                const today = new Date().toISOString().split("T")[0];
                if (val && val < today) {
                  setDispatchDateError("Past date is not allowed.");
                } else {
                  setDispatchDateError("");
                }
              }} 
            />
            {dispatchDateError && <p className="mt-1 text-xs text-red-500">{dispatchDateError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Driver Name</label>
              <input 
                type="text" 
                placeholder="Driver name" 
                className={`w-full px-3 py-2 text-sm rounded-lg border ${driverNameError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600'} bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`} 
                value={driverName} 
                onChange={handleDriverNameChange} 
              />
              {driverNameError && <p className="mt-1 text-xs text-red-500">{driverNameError}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tracking/Vehicle Number</label>
              <input 
                type="text" 
                placeholder="e.g., ABC1234" 
                className={`w-full px-3 py-2 text-sm rounded-lg border ${trackingNumberError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600'} bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`} 
                value={trackingNumber} 
                onChange={handleTrackingNumberChange} 
              />
              {trackingNumberError && <p className="mt-1 text-xs text-red-500">{trackingNumberError}</p>}
            </div>
          </div>

          {/* Receipt Upload Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Proof of Transaction (Receipt) *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed ${receiptError ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'} p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-[#24303f]`}
            >
              <Upload size={24} className="text-slate-400 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click to add JPG, PNG, or JPEG files
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
            {receiptError && <p className="mt-1 text-xs text-red-500">{receiptError}</p>}

            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {previews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 h-20"
                  >
                    <img
                      src={src}
                      alt={`preview ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="absolute top-1 right-1 p-1 bg-white dark:bg-slate-800 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button type="button" onClick={handleCloseAttempt} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-500/30">Start Transit</button>
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