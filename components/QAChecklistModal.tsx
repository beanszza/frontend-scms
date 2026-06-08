"use client";

import React, { useState } from "react";
import { X, Loader2, ClipboardCheck, CheckCircle, XCircle } from "lucide-react";
import api from "../lib/api";

interface Props {
  open: boolean;
  batchId: number;
  onClose: () => void;
  onSubmit: () => void; // called after successful QA + decision
}

export default function QAChecklistModal({ open, batchId, onClose, onSubmit }: Props) {
  // QA fields
  const [taste, setTaste] = useState("Pass");
  const [texture, setTexture] = useState("Pass");
  const [packaging, setPackaging] = useState("Pass");
  const [appearance, setAppearance] = useState("Pass");
  const [notes, setNotes] = useState("");

  // Decision fields
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision) return;
    if (decision === "reject" && !rejectionReason.trim()) return;

    setSubmitting(true);
    try {
      // Save QA data
      const qaPayload = { taste, texture, packaging, appearance, notes };
      await api.put(`/api/scms/api/ProductionBatches/${batchId}/qa`, qaPayload);

      // Execute approval or rejection
      const endpoint = `/api/scms/api/ProductionBatches/${batchId}/${decision}`;
      const decisionPayload = decision === "reject" ? { reason: rejectionReason } : {};
      await api.put(endpoint, decisionPayload);

      // Success – close modal and refresh parent
      onSubmit();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const selectClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white";

  const canSubmit = decision !== null && (decision === "approve" || rejectionReason.trim() !== "") && !submitting;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1D2939] border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            QA Checklist – Batch {batchId}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* QA fields */}
          {[
            { label: "Taste", value: taste, setter: setTaste },
            { label: "Texture", value: texture, setter: setTexture },
            { label: "Packaging", value: packaging, setter: setPackaging },
            { label: "Appearance", value: appearance, setter: setAppearance },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.label}
              </label>
              <select
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                className={selectClass}
              >
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="QA notes..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white"
            />
          </div>

          {/* ---------- Decision Section ---------- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Final Decision
            </label>
            <div className="flex gap-3 mb-3">
              <button
                onClick={() => setDecision("approve")}
                className={`flex-1 py-2.5 rounded-xl border font-medium text-sm flex items-center justify-center gap-2
                  ${decision === "approve" ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-500/10 dark:text-green-300" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"}
                `}
              >
                <CheckCircle size={16} /> Approve
              </button>
              <button
                onClick={() => setDecision("reject")}
                className={`flex-1 py-2.5 rounded-xl border font-medium text-sm flex items-center justify-center gap-2
                  ${decision === "reject" ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-500/10 dark:text-red-300" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"}
                `}
              >
                <XCircle size={16} /> Reject
              </button>
            </div>

            {decision === "reject" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this batch is rejected..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Submit QA & Decision
          </button>
        </div>
      </div>
    </div>
  );
}