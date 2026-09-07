"use client";

import React, { useState } from "react";
import { MoreHorizontal, Pencil, Eye } from "lucide-react";
import { Supplier } from "./types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface SupplierTableProps {
  suppliers: Supplier[];
  currentPage: number;
  pageSize: number;
  onEdit: (supplier: Supplier) => void;
  onView: (supplier: Supplier) => void;
}

export default function SupplierTable({ suppliers, currentPage, pageSize, onEdit, onView }: SupplierTableProps) {
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[900px]">
        <thead className="border-b border-border bg-muted/30">
          <tr className="text-left text-xs uppercase text-muted-foreground whitespace-nowrap">
            <th className="px-5 py-4">Supplier No.</th>
            <th className="px-5 py-4">ID</th>
            <th className="px-5 py-4">Supplier Name</th>
            <th className="px-5 py-4">Contact Person</th>
            <th className="px-5 py-4">Email</th>
            <th className="px-5 py-4">Phone</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {suppliers.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
                No Results Found
              </td>
            </tr>
          ) : (
            suppliers.map((supplier, index) => (
              <tr key={supplier.supplierId} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                  {index + 1 + (currentPage - 1) * pageSize}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-foreground whitespace-nowrap">
                  {supplier.supplierCode ? (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button
                          onClick={() => onView(supplier)}
                          className="cursor-pointer font-medium hover:underline focus:outline-none whitespace-nowrap"
                        >
                          {supplier.supplierCode}
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="flex justify-between space-x-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">{supplier.companyName}</h4>
                            <p className="text-sm text-muted-foreground">Contact: {supplier.contactPerson}</p>
                            <div className="flex items-center pt-2">
                              <StatusBadge status={supplier.isActive ? "Active" : "Inactive"} />
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-foreground">{supplier.companyName}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{supplier.contactPerson}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{supplier.email}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">{supplier.phone}</td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <StatusBadge status={supplier.isActive ? "Active" : "Inactive"} />
                </td>
                <td className="px-5 py-4 text-center relative">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdownId(activeDropdownId === supplier.supplierId ? null : supplier.supplierId)
                    }
                    className="p-1.5 rounded-lg text-foreground hover:bg-muted transition-colors focus:outline-none"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {activeDropdownId === supplier.supplierId && (
                    <div className="absolute right-10 top-2 z-[100] w-36 rounded-xl border border-border bg-card shadow-xl py-1.5 text-left">
                      <button
                        type="button"
                        onClick={() => {
                          onEdit(supplier);
                          setActiveDropdownId(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil size={14} className="shrink-0" /> Edit Supplier
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onView(supplier);
                          setActiveDropdownId(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Eye size={14} className="shrink-0" /> View Details
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
