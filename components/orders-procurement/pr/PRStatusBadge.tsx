"use client";

import React from "react";
import { PRStatus } from "../types";
import { 
  FileEdit, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ArrowRightCircle, 
  Ban, 
  Lock 
} from "lucide-react";

interface PRStatusBadgeProps {
  status: PRStatus | string;
  className?: string;
}

export function PRStatusBadge({ status, className = "" }: PRStatusBadgeProps) {
  const norm = status?.trim() || "Draft";

  switch (norm) {
    case "Draft":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border ${className}`}>
          <FileEdit className="w-3.5 h-3.5" />
          Draft
        </span>
      );
    case "Pending Approval":
    case "Pending":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-foreground/10 text-foreground border border-foreground/30 ${className}`}>
          <Clock className="w-3.5 h-3.5" />
          Pending Approval
        </span>
      );
    case "Returned":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-foreground/50 ${className}`}>
          <RotateCcw className="w-3.5 h-3.5" />
          Returned
        </span>
      );
    case "Approved":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-foreground text-background border border-foreground ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approved
        </span>
      );
    case "Rejected":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-foreground/80 line-through border border-border ${className}`}>
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    case "Converted to PO":
    case "Converted":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-foreground/15 text-foreground border border-border ${className}`}>
          <ArrowRightCircle className="w-3.5 h-3.5" />
          Converted to Purchase Order
        </span>
      );
    case "Cancelled":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted/60 text-muted-foreground border border-border ${className}`}>
          <Ban className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    case "Closed":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border ${className}`}>
          <Lock className="w-3.5 h-3.5" />
          Closed
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border ${className}`}>
          {status}
        </span>
      );
  }
}
