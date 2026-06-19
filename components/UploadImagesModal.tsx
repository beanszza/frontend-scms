"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  ImagePlus,
  Loader2,
  Trash2,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";

interface Props {
  open: boolean;
  batchId: number;
  batchStatus?: string; // used to show/hide stage section
  onClose: () => void;
  onStageUpdated?: () => void; // refreshes parent data after stage change
}

export default function UploadImagesModal({
  open,
  batchId,
  batchStatus = "",
  onClose,
  onStageUpdated,
}: Props) {
  // ---- File upload states ----
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Stage update states ----
  const stages = [
    "Peeling",
    "Steaming",
    "Mixing",
    "Cooking",
    "Cooling",
    "Packaging",
    "QA Review",
  ];
  const [selectedStage, setSelectedStage] = useState("");
  const [updatingStage, setUpdatingStage] = useState(false);

  // ---- Confirmation modal state ----
  const [isUploading, setIsUploading] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setSelectedStage("");
      setSelectedFiles([]);
      setPreviews([]);
      setUpdatingStage(false);
      setUploading(false);
    }
  }, [open]);

  const showStageSection =
    batchStatus !== "Completed" && batchStatus !== "Rejected";

  // ---- Handlers for file upload ----
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;
    // Upload one at a time — backend expects a single IFormFile named 'file'
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/api/scms/api/ProductionBatches/${batchId}/images`, formData);
    }
  };

  const updateStage = async () => {
    if (!selectedStage) return;
    await api.put(`/api/scms/api/ProductionBatches/${batchId}/stage`, {
      stage: selectedStage,
    });
  };

  // Single submit handler
  const handleSubmit = async () => {
    if ((!selectedStage && selectedFiles.length === 0) || updatingStage || uploading) return;
    
    setUpdatingStage(true);
    setUploading(true);
    try {
      if (selectedStage) {
        await updateStage();
      }
      if (selectedFiles.length > 0) {
        await uploadImages();
      }
      if (onStageUpdated) onStageUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStage(false);
      setUploading(false);
    }
  };

  const canSubmit = (selectedStage !== "" || selectedFiles.length > 0) && !updatingStage && !uploading;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#1D2939] border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Batch {batchId} – Update & Upload
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stage Update Section */}
        {showStageSection && (
          <div className="px-6 pt-5 pb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Production Stage
            </label>
            <div className="flex gap-3">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white"
              >
                <option value="">Select next stage</option>
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Image Upload Section */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload Production Images
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <Upload size={28} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">
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

          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {previews.map((src, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700"
                >
                  <img
                    src={src}
                    alt={`preview ${idx}`}
                    className="w-full h-20 object-cover"
                  />
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer – single Submit button */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {updatingStage || uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ChevronRight size={16} />
            )}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}