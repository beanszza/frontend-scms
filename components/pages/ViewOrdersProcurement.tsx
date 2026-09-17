"use client";

import React, { useState } from "react";
import { FileText, ShoppingCart, Truck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PRTab } from "@/components/orders-procurement/pr/PRTab";
import { POTab } from "@/components/orders-procurement/po/POTab";
import { CreatePOModal } from "@/components/orders-procurement/po/CreatePOModal";

export default function OrdersProcurementPage() {
  const [mainTab, setMainTab] = useState<"pr" | "po" | "delivery">("pr");

  // Cross-tab PO creation — triggered from PR details "Create PO" button
  const [createPOFromPR, setCreatePOFromPR] = useState<number | undefined>(undefined);
  const [showCreatePO, setShowCreatePO] = useState(false);

  const handleCreatePoFromPR = (prId: number) => {
    setCreatePOFromPR(prId);
    setShowCreatePO(true);
    setMainTab("po");
  };

  return (
    <div className="w-full min-h-full py-8 px-6 md:px-8 space-y-6 animate-page-in">
      {/* Page Header */}
      <PageHeader
        title="Orders & Procurement"
        description="End-to-end procurement lifecycle: requisition requests, purchase orders, and delivery management."
      />

      {/* 3 Main Process Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMainTab("pr")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              mainTab === "pr"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Product Requisition</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("po")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              mainTab === "po"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Product Order</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("delivery")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              mainTab === "delivery"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Delivery</span>
          </button>
        </div>
      </div>

      {/* MAIN TAB 1: PRODUCT REQUISITION */}
      {mainTab === "pr" && <PRTab onCreatePo={handleCreatePoFromPR} />}

      {/* MAIN TAB 2: PRODUCT ORDER (new PO approval workflow) */}
      {mainTab === "po" && <POTab />}

      {/* MAIN TAB 3: DELIVERY */}
      {mainTab === "delivery" && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
            <Truck className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Delivery Management</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            The Delivery and Shipment tracking module will handle incoming consignments, supplier DR verification, and warehouse bay check-ins following purchase order fulfillment.
          </p>
        </div>
      )}

      {/* Global CreatePO Modal — opened from PR details "Create PO" button */}
      {showCreatePO && (
        <CreatePOModal
          open={showCreatePO}
          initialPrId={createPOFromPR}
          onClose={() => { setShowCreatePO(false); setCreatePOFromPR(undefined); }}
          onSuccess={() => { setShowCreatePO(false); setCreatePOFromPR(undefined); }}
        />
      )}
    </div>
  );
}