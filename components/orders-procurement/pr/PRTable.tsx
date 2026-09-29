"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Eye,
  Pencil,
  ShoppingBag,
  MoreHorizontal,
  Ban,
} from "lucide-react";
import { PurchaseRequisition } from "../types";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface PRTableProps {
  requisitions: PurchaseRequisition[];
  isAdmin: boolean;
  isRequestsTab?: boolean;
  onView: (pr: PurchaseRequisition) => void;
  onEdit?: (pr: PurchaseRequisition) => void;
  onCancel?: (pr: PurchaseRequisition) => void;
  onCreatePo?: (pr: PurchaseRequisition) => void;
}

export function PRTable({
  requisitions,
  isAdmin,
  onView,
  onEdit,
  onCancel,
  onCreatePo,
}: PRTableProps) {
  const [openDropdownPrId, setOpenDropdownPrId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownPrId(null);
      }
    }
    if (openDropdownPrId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownPrId]);

  const fmtDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PURCHASE REQUISITION NUMBER</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">REQUEST DATE</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">REQUESTED BY</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">DEPARTMENT</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">REQUIRED DATE</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
            <th className="px-4 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap w-24">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {requisitions.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-xs font-medium text-muted-foreground">
                No purchase requisitions found.
              </td>
            </tr>
          ) : (
            requisitions.map((pr) => {
              const isDraft = pr.status === "Draft";
              const isPending = pr.status === "Pending Approval" || (pr.status as any) === "Pending";
              const isReturned = pr.status === "Returned";
              const isApproved = pr.status === "Approved";
              const isCancellable = isDraft || isPending || isReturned;

              // Build list of actions
              const actions: ActionItem[] = [
                {
                  label: "View Details",
                  icon: <Eye className="w-4 h-4 text-foreground" />,
                  onClick: () => {
                    setOpenDropdownPrId(null);
                    onView(pr);
                  },
                },
              ];

              // If NOT admin (Inventory Manager side):
              if (!isAdmin) {
                // Edit (Draft or Returned)
                if ((isDraft || isReturned) && onEdit) {
                  actions.push({
                    label: isReturned ? "Edit & Re-Submit" : "Edit Draft",
                    icon: <Pencil className="w-4 h-4 text-foreground" />,
                    onClick: () => {
                      setOpenDropdownPrId(null);
                      onEdit(pr);
                    },
                  });
                }

                // Cancel Requisition (Draft, Pending, Returned)
                if (isCancellable && onCancel) {
                  actions.push({
                    label: "Cancel Requisition",
                    icon: <Ban className="w-4 h-4 text-foreground" />,
                    onClick: () => {
                      setOpenDropdownPrId(null);
                      onCancel(pr);
                    },
                  });
                }

                // Create PO (Approved)
                if (isApproved && onCreatePo) {
                  actions.push({
                    label: "Create Purchase Order",
                    icon: <ShoppingBag className="w-4 h-4 text-foreground" />,
                    onClick: () => {
                      setOpenDropdownPrId(null);
                      onCreatePo(pr);
                    },
                  });
                }
              }

              const isOpen = openDropdownPrId === pr.prId;

              return (
                <tr
                  key={pr.prId}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onView(pr)}
                >
                  <td className="px-4 py-3.5 font-mono text-foreground whitespace-nowrap font-medium">
                    {pr.prNumber}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                    {fmtDate(pr.requestDate)}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">
                    {pr.requestedBy && pr.requestedBy !== "Unauthenticated"
                      ? pr.requestedBy
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                    {pr.department || "Inventory"}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                    {fmtDate(pr.requiredDate)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge status={pr.status} />
                  </td>
                  <td
                    className="px-4 py-3.5 text-center whitespace-nowrap relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setOpenDropdownPrId(isOpen ? null : pr.prId)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isOpen
                            ? "bg-muted border-border text-foreground shadow-sm"
                            : "border-transparent text-foreground hover:bg-muted/80"
                        }`}
                        aria-label="Actions menu"
                      >
                        <MoreHorizontal className="w-4 h-4 text-foreground" />
                      </button>

                      {isOpen && (
                        <div
                          ref={dropdownRef}
                          style={{ minWidth: "175px" }}
                          className="absolute right-0 top-full mt-1.5 z-[200] rounded-xl border border-border bg-card py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 text-left"
                        >
                          {actions.map((action, idx) => (
                            <button
                              key={action.label + idx}
                              type="button"
                              onClick={action.onClick}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted text-foreground text-left"
                            >
                              <span className="shrink-0 text-foreground">{action.icon}</span>
                              <span className="truncate text-foreground">{action.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
