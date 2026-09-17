"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, AlertCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";

export type POActionType = "approve" | "reject" | "return" | "cancel" | "order";

interface POActionModalProps {
  actionType: POActionType;
  poNumber: string;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
}

const ACTION_CONFIG: Record<
  POActionType,
  {
    title: string;
    icon: React.ReactNode;
    description: string;
    requiresNotes: boolean;
    notesLabel: string;
    notesPlaceholder: string;
    confirmLabel: string;
    confirmClass: string;
  }
> = {
  approve: {
    title: "Approve Purchase Order",
    icon: <CheckCircle2 className="w-5 h-5 text-foreground" />,
    description: "Approving this PO will move it to Approved status. The requester can then mark it as Ordered.",
    requiresNotes: false,
    notesLabel: "",
    notesPlaceholder: "",
    confirmLabel: "Approve",
    confirmClass: "bg-foreground text-background hover:bg-foreground/85",
  },
  reject: {
    title: "Reject Purchase Order",
    icon: <XCircle className="w-5 h-5 text-foreground" />,
    description: "Rejecting this PO will close it. Please provide a reason.",
    requiresNotes: true,
    notesLabel: "Rejection Reason",
    notesPlaceholder: "State the reason for rejection (required)...",
    confirmLabel: "Reject",
    confirmClass: "bg-foreground text-background hover:bg-foreground/85",
  },
  return: {
    title: "Return for Revision",
    icon: <RotateCcw className="w-5 h-5 text-foreground" />,
    description: "Returning this PO will allow the requester to revise and resubmit. Please provide your notes.",
    requiresNotes: true,
    notesLabel: "Revision Notes",
    notesPlaceholder: "Describe what needs to be revised (required)...",
    confirmLabel: "Return for Revision",
    confirmClass: "bg-foreground text-background hover:bg-foreground/85",
  },
  cancel: {
    title: "Cancel Purchase Order",
    icon: <AlertCircle className="w-5 h-5 text-foreground shrink-0" />,
    description: "Are you sure you want to cancel this purchase order? This action cannot be undone. This PO number will be permanently marked as cancelled and cannot be reused.",
    requiresNotes: true,
    notesLabel: "Cancellation Reason & Notes",
    notesPlaceholder: "Please provide the reason for cancelling this purchase order (required)...",
    confirmLabel: "Confirm Cancellation",
    confirmClass: "bg-foreground text-background hover:bg-foreground/85",
  },
  order: {
    title: "Mark as Ordered",
    icon: <ShoppingBag className="w-5 h-5 text-foreground" />,
    description: "Marking as Ordered confirms the PO has been sent to the supplier. The status will change to Ordered.",
    requiresNotes: false,
    notesLabel: "",
    notesPlaceholder: "",
    confirmLabel: "Mark as Ordered",
    confirmClass: "bg-foreground text-background hover:bg-foreground/85",
  },
};

export function POActionModal({ actionType, poNumber, onClose, onConfirm }: POActionModalProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config = ACTION_CONFIG[actionType];

  const handleConfirm = async () => {
    if (config.requiresNotes && !notes.trim()) {
      setError("This field is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onConfirm(notes.trim() || undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper
      open={true}
      title={config.title}
      onClose={onClose}
      size="max-w-md"
    >
      <div className="space-y-5">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-muted/30">
          <span className="shrink-0 mt-0.5">{config.icon}</span>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">
              PO: <span className="font-mono">{poNumber}</span>
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{config.description}</p>
          </div>
        </div>

        {/* Notes / Reason Input */}
        {config.requiresNotes && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              {config.notesLabel} <span className="text-foreground">*</span>
            </label>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              placeholder={config.notesPlaceholder}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground resize-none shadow-none focus-visible:ring-1 focus-visible:ring-foreground/30 leading-relaxed"
            />
            {error && <p className="mt-1 text-xs text-foreground font-medium">{error}</p>}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-border bg-card hover:bg-muted text-foreground px-4 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
            className={`gap-1.5 rounded-xl px-5 text-xs font-semibold shadow-sm ${config.confirmClass}`}
          >
            {loading ? "Processing..." : config.confirmLabel}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
