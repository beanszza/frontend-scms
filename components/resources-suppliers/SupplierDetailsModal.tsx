"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import ModalWrapper from "./ModalWrapper";
import { Supplier } from "./types";

interface SupplierDetailsModalProps {
  supplier: Supplier | null;
  onClose: () => void;
}

export default function SupplierDetailsModal({
  supplier,
  onClose,
}: SupplierDetailsModalProps) {
  if (!supplier) return null;

  return (
    <ModalWrapper
      open={!!supplier}
      title={`Supplier Details - ${supplier.companyName}`}
      onClose={onClose}
      size="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
              supplier.isActive
                ? "bg-foreground text-background border border-foreground font-semibold"
                : "bg-muted/40 text-muted-foreground border border-border"
            }`}
          >
            {supplier.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Company Name</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{supplier.companyName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Contact Person</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{supplier.contactPerson}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Email Address</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{supplier.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Phone Number</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{supplier.phone}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-muted-foreground">Physical Address</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{supplier.address}</p>
          </div>
          {supplier.website && (
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-muted-foreground">Website</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{supplier.website}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            Close
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
