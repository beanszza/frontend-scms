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
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  onApprove?: (pr: PurchaseRequisition) => void;
  onReject?: (pr: PurchaseRequisition) => void;
  onReturn?: (pr: PurchaseRequisition) => void;
  onCreatePo?: (pr: PurchaseRequisition) => void;
}

export function PRTable({
  requisitions,
  isAdmin,
  isRequestsTab = false,
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

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm min-h-[300px]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PR NO.</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">REQUEST DATE</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">REQUESTED BY</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">DEPARTMENT</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">TYPE</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PRIORITY</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">REQUIRED DATE</th>
            <th className="px-4 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap w-24">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {requisitions.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-5 py-12 text-center text-xs font-medium text-muted-foreground">
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
              const actions: ActionItem[] = [];

              // 1. View Details (always available)
              actions.push({
                label: "View Details",
                icon: <Eye className="w-4 h-4 text-foreground" />,
                onClick: () => {
                  setOpenDropdownPrId(null);
                  onView(pr);
                },
              });

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
                    label: "Create PO",
                    icon: <ShoppingBag className="w-4 h-4 text-foreground" />,
                    onClick: () => {
                      setOpenDropdownPrId(null);
                      onCreatePo(pr);
                    },
                  });
                }
              }

              // Always use three-dot dropdown menu
              const isDropdown = true;
              const isOpen = openDropdownPrId === pr.prId;

              return (
                <tr key={pr.prId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-foreground whitespace-nowrap font-normal">
                    {pr.prNumber}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                    {pr.requestDate
                      ? new Date(pr.requestDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-"}
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
                    {pr.requestType || "Stock Replenishment"}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-semibold text-foreground">
                      {pr.priority || "Normal"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                    {pr.requiredDate
                      ? new Date(pr.requiredDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="px-4 py-3.5 text-center whitespace-nowrap relative">
                    {isDropdown ? (
                      /* Dropdown menu for 3+ actions */
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
                            style={{ minWidth: "185px" }}
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
                    ) : (
                      /* Inline button(s) for 1–2 actions (For Admin, this renders just View Details) */
                      <TooltipProvider delayDuration={150}>
                        <div className="flex items-center justify-center gap-1">
                          {actions.map((action, idx) => (
                            <Tooltip key={action.label + idx}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={action.onClick}
                                  className="h-7 w-7 rounded-lg hover:bg-muted text-foreground"
                                >
                                  {action.icon}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {action.label}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TooltipProvider>
                    )}
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
