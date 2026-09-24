"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PRTab } from "@/components/orders-procurement/pr/PRTab";
import { POTab } from "@/components/orders-procurement/po/POTab";
import { CreatePOModal } from "@/components/orders-procurement/po/CreatePOModal";
import { DeliveryTab } from "@/components/orders-procurement/delivery/DeliveryTab";

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
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setMainTab("pr")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              mainTab === "pr"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>PURCHASE REQUISITION</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("po")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              mainTab === "po"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>PURCHASE ORDER</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("delivery")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              mainTab === "delivery"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>DELIVERY</span>
          </button>
        </div>
      </div>

      {/* MAIN TAB 1: PRODUCT REQUISITION */}
      {mainTab === "pr" && <PRTab onCreatePo={handleCreatePoFromPR} />}

      {/* MAIN TAB 2: PRODUCT ORDER (new PO approval workflow) */}
      {mainTab === "po" && <POTab />}

      {/* MAIN TAB 3: DELIVERY */}
      {mainTab === "delivery" && <DeliveryTab />}

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