"use client";

import React, { useState, useEffect, useRef } from "react";
import { Eye, Pencil, MoreHorizontal, Ban } from "lucide-react";
import { PurchaseOrderPO } from "../types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface POTableProps {
  orders: PurchaseOrderPO[];
  isAdmin: boolean;
  onView: (po: PurchaseOrderPO) => void;
  onEdit?: (po: PurchaseOrderPO) => void;
  onCancel?: (po: PurchaseOrderPO) => void;
}

export function POTable({ orders, isAdmin, onView, onEdit, onCancel }: POTableProps) {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    if (openDropdownId !== null) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Draft": return "bg-muted text-muted-foreground border-border";
      case "Pending Approval": return "bg-muted text-foreground border-border font-semibold";
      case "Returned": return "bg-muted text-foreground border-border";
      case "Approved": return "bg-muted text-foreground border-border font-semibold";
      case "Ordered": return "bg-foreground text-background border-foreground font-semibold";
      case "Rejected": return "bg-muted text-muted-foreground border-border line-through";
      case "Cancelled": return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm min-h-[300px]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PO NO.</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PR REF.</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SUPPLIER</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ORDER DATE</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">REQUESTED BY</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">TOTAL</th>
            <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
            <th className="px-4 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap w-24">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-5 py-12 text-center text-xs font-medium text-muted-foreground">
                No purchase orders found.
              </td>
            </tr>
          ) : (
            orders.map((po) => {
              const isDraft = po.status === "Draft";
              const isPending = po.status === "Pending Approval";
              const isReturned = po.status === "Returned";
              const isCancellable = isDraft || isPending || isReturned;

              const actions: ActionItem[] = [];

              // View Details — always
              actions.push({
                label: "View Details",
                icon: <Eye className="w-4 h-4 text-foreground" />,
                onClick: () => { setOpenDropdownId(null); onView(po); },
              });

              // Inventory Manager actions only
              if (!isAdmin) {
                if ((isDraft || isReturned) && onEdit) {
                  actions.push({
                    label: isReturned ? "Edit & Re-Submit" : "Edit Draft",
                    icon: <Pencil className="w-4 h-4 text-foreground" />,
                    onClick: () => { setOpenDropdownId(null); onEdit(po); },
                  });
                }
                if (isCancellable && onCancel) {
                  actions.push({
                    label: "Cancel PO",
                    icon: <Ban className="w-4 h-4 text-foreground" />,
                    onClick: () => { setOpenDropdownId(null); onCancel(po); },
                  });
                }
              }

              const isDropdown = actions.length >= 3;
              const isOpen = openDropdownId === po.poId;

              const fmtDate = (d: string) =>
                d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

              const fmtCurrency = (n: number) =>
                new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 }).format(n);

              return (
                <tr key={po.poId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-foreground whitespace-nowrap font-medium">
                    {po.poNumber}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-muted-foreground whitespace-nowrap text-xs">
                    {po.prNumber || "—"}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">
                    {po.supplierName || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                    {fmtDate(po.orderDate)}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                    {po.requestedBy || "—"}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-semibold text-foreground whitespace-nowrap">
                    {fmtCurrency(po.totalAmount || 0)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${getStatusClass(po.status)}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center whitespace-nowrap relative">
                    {isDropdown ? (
                      <div className="relative inline-flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setOpenDropdownId(isOpen ? null : po.poId)}
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
                    ) : (
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
