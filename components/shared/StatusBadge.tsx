import React from "react";
import { Badge } from "@/components/ui/badge";

// ─── Status → greyscale badge mapping ────────────────────────────────────────
// All statuses use monochromatic greyscale only.
//  "active"  → dark fill (foreground/background)
//  "subtle"  → medium grey fill (badge-subtle)
//  "muted"   → light grey fill (badge-muted)
//  "outline" → outline only (border, no fill)
// ─────────────────────────────────────────────────────────────────────────────

type BadgeTier = "active" | "subtle" | "muted" | "outline";

const STATUS_MAP: Record<string, BadgeTier> = {
  // PO / Procurement
  Approved:      "active",
  Pending:       "muted",
  Draft:         "muted",
  Submitted:     "subtle",
  InReview:      "subtle",
  Received:      "subtle",
  PartiallyReceived: "subtle",
  Cancelled:     "outline",
  Rejected:      "outline",
  Closed:        "outline",

  // Production / QA
  Completed:     "active",
  Released:      "active",
  InProgress:    "subtle",
  "In Progress": "subtle",
  Quarantine:    "subtle",
  Quarantined:   "subtle",
  QAFailed:      "outline",
  "QA Failed":   "outline",
  "Inventory Added": "active",

  // Stock / Transfer
  Transferred:   "active",
  "In Transit":  "subtle",
  InTransit:     "subtle",
  Arrived:       "subtle",
  Reconciled:    "active",
  Open:          "muted",

  // Documents / GRN
  Inspected:     "active",
  Accepted:      "active",
  "Non-Conforming": "outline",
  Returned:      "outline",
  Credited:      "subtle",

  // Recall
  Active:        "active",
  Simulated:     "subtle",
  Resolved:      "outline",

  // Generic
  Enabled:       "active",
  Disabled:      "outline",
  Active2:       "active",
  Inactive:      "outline",
  Yes:           "active",
  No:            "outline",
};

const TIER_CLASSES: Record<BadgeTier, string> = {
  active:  "bg-foreground text-background border-transparent",
  subtle:  "bg-badge-subtle text-badge-subtle-foreground border-transparent",
  muted:   "bg-badge-muted text-badge-muted-foreground border-transparent",
  outline: "bg-transparent text-foreground border-border",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const tier = STATUS_MAP[status] ?? "muted";
  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${TIER_CLASSES[tier]} ${className}`}
    >
      {status.replace(/([A-Z])/g, " $1").trim()}
    </Badge>
  );
}
