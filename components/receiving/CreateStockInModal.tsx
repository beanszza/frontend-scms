"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Save } from "lucide-react";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import api from "@/lib/api";
import { GRN, StockIn } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (stockIn: StockIn) => void;
}

interface StockInLineDraft {
  grnItemId?: number;
  itemId: number;
  itemName: string;
  categoryName?: string;
  purchaseUomId?: number;
  purchaseUomName: string;
  quantityToStock: number;
  currentStock: number;
  lotCode: string;
  expiryDate: string;
  notes: string;
}

export default function CreateStockInModal({ open, onClose, onSuccess }: Props) {
  const [grns, setGrns] = useState<GRN[]>([]);
  const [selectedGrnId, setSelectedGrnId] = useState<number | "">("");
  const [selectedGrn, setSelectedGrn] = useState<GRN | null>(null);
  const [lines, setLines] = useState<StockInLineDraft[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    submitForApproval: boolean;
  }>({ open: false, submitForApproval: false });

  useEffect(() => {
    if (!open) return;
    setSelectedGrnId("");
    setSelectedGrn(null);
    setLines([]);
    setNotes("");
    setError(null);
    setLoading(true);

    api
      .get("/api/GoodsReceipts")
      .then(({ data }) => {
        const list: GRN[] = Array.isArray(data?.data) ? data.data : [];
        const eligible = list.filter(
          (g) =>
            g.status === "QaCompleted" ||
            g.status === "Received" ||
            g.status === "PartiallyPutAway"
        );
        setGrns(eligible);
      })
      .catch(() => setError("Unable to load Goods Receipt Notes."))
      .finally(() => setLoading(false));
  }, [open]);

  const handleSelectGrn = async (grnId: number) => {
    setSelectedGrnId(grnId);
    const grn = grns.find((g) => g.grnId === grnId);
    if (!grn) return;
    setSelectedGrn(grn);
    setLoading(true);
    setError(null);

    try {
      const [grnDetailRes, invRes] = await Promise.all([
        api.get(`/api/GoodsReceipts/${grnId}`),
        api.get("/api/Inventory?pageSize=1000").catch(() => ({ data: { data: [] } })),
      ]);

      const fullGrn: GRN = grnDetailRes.data?.data || grn;
      const invList = Array.isArray(invRes.data?.data?.items)
        ? invRes.data.data.items
        : Array.isArray(invRes.data?.data)
        ? invRes.data.data
        : [];

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}${mm}${dd}`;

      const cleanGrn = (fullGrn.grnNumber || `${dateStr}`).replace(/^GRN-?/i, "");
      let seq = 1;

      const draftedLines: StockInLineDraft[] = (fullGrn.items || []).map((item) => {
        const invMatch = invList.find((i: any) => i.itemId === item.itemId);
        const currentStock = Number(invMatch?.currentStock ?? invMatch?.quantityOnHand ?? 0);
        const generatedLot = `LOT-${cleanGrn}-${item.itemId}-${String(seq).padStart(2, "0")}`;
        seq++;

        return {
          grnItemId: item.grnItemId,
          itemId: item.itemId,
          itemName: item.itemName || `Item #${item.itemId}`,
          purchaseUomId: item.purchaseUomId,
          purchaseUomName: item.purchaseUomName || "Unit",
          quantityToStock: Number(item.deliveredQuantity) || 0,
          currentStock,
          lotCode: generatedLot,
          expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] : "",
          notes: item.notes || "",
        };
      });

      setLines(draftedLines);
    } catch {
      setError("Failed to load Goods Receipt Note items and stock data.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrySubmit = (submitForApproval: boolean) => {
    if (!selectedGrnId || lines.length === 0) {
      setError("Please select a valid Goods Receipt Note with item lines.");
      return;
    }

    const invalidQty = lines.some((l) => Number(l.quantityToStock) <= 0);
    if (invalidQty) {
      setError("Every line item must have a quantity to stock greater than zero.");
      return;
    }

    const invalidLot = lines.some((l) => !l.lotCode.trim());
    if (invalidLot) {
      setError("Every line item must have a valid lot number.");
      return;
    }

    setConfirmModal({ open: true, submitForApproval });
  };

  const executeSubmit = async (submitForApproval: boolean) => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        grnId: Number(selectedGrnId),
        notes: notes.trim() || undefined,
        submitForApproval,
        lines: lines.map((l) => ({
          grnItemId: l.grnItemId,
          itemId: l.itemId,
          purchaseUomId: l.purchaseUomId,
          quantityToStock: Number(l.quantityToStock),
          currentStockBeforeCommit: Number(l.currentStock),
          lotCode: l.lotCode.trim(),
          expiryDate: l.expiryDate ? new Date(l.expiryDate).toISOString() : undefined,
          notes: l.notes.trim() || undefined,
        })),
      };

      const { data } = await api.post("/api/StockIns", payload);
      if (!data?.success) {
        throw new Error(data?.message || "Failed to create Stock-In record.");
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "An unexpected error occurred while creating Stock-In."
      );
    } finally {
      setSubmitting(false);
      setConfirmModal({ open: false, submitForApproval: false });
    }
  };

  return (
    <ModalWrapper
      open={open}
      title="Create Stock-In Report"
      onClose={onClose}
      size="max-w-3xl"
    >
      <div className="space-y-5 text-foreground">
        {error && (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-foreground flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-foreground font-bold text-xs hover:underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* GRN Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Goods Receipt Note
          </label>
          <div>
            <select
              value={selectedGrnId}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) handleSelectGrn(id);
              }}
              className="w-52 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
            >
              <option value="" disabled>
                Select Goods Receipt Note
              </option>
              {grns.map((g) => (
                <option key={g.grnId} value={g.grnId}>
                  {g.grnNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="py-10 text-center text-xs text-muted-foreground animate-pulse">
            Loading Goods Receipt Note items…
          </div>
        )}

        {/* Stock-In Items Table */}
        {selectedGrn && !loading && lines.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Items
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Supply Name</th>
                    <th className="px-3 py-3 text-center">Unit of Measure</th>
                    <th className="px-3 py-3 text-right">Stock to Put In</th>
                    <th className="px-3 py-3 text-right">Current Stock</th>
                    <th className="px-3 py-3">Lot No.</th>
                    <th className="px-3 py-3 text-center">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lines.map((line, lineIndex) => (
                    <tr key={line.itemId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {line.itemName}
                      </td>
                      <td className="px-3 py-3 text-center text-muted-foreground">
                        {line.purchaseUomName}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-foreground">
                        {line.quantityToStock}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                        {line.currentStock}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-foreground">
                        {line.lotCode}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={line.expiryDate || ""}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => {
                            setLines((current) =>
                              current.map((entry, index) =>
                                index === lineIndex ? { ...entry, expiryDate: e.target.value } : entry
                              )
                            );
                          }}
                          className="w-full bg-background border border-border rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-foreground focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* General Notes */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-foreground">Stock-In Notes / Storage Instructions</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Specify designated warehouse aisle, refrigeration, or special storage notes..."
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={lines.length === 0 || submitting}
            onClick={() => handleTrySubmit(false)}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Saving…" : "Save as Draft"}
          </button>
          <button
            type="button"
            disabled={lines.length === 0 || submitting}
            onClick={() => handleTrySubmit(true)}
            className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? "Submitting…" : "Submit for Approval"}
          </button>
        </div>
      </div>

      {/* Review Modal Portal */}
      {confirmModal.open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background rounded-2xl shadow-xl w-full max-w-[500px] border border-border overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Save className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Review Stock-In
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      You are about to {confirmModal.submitForApproval ? "submit this Stock-In for approval" : "save this Stock-In as draft"}.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 mb-6 space-y-2 border border-border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Goods Receipt Note Source:</span>
                    <span className="font-semibold text-foreground">
                      {grns.find((g) => g.grnId === Number(selectedGrnId))?.grnNumber || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Lines:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {lines.length} items
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Action:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                      {confirmModal.submitForApproval ? "Submit for Approval" : "Save as Draft"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-border pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ open: false, submitForApproval: false })}
                    disabled={submitting}
                    className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => executeSubmit(confirmModal.submitForApproval)}
                    className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {submitting ? "Processing..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ModalWrapper>
  );
}
