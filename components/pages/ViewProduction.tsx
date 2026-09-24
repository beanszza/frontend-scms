"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import ProductionRequestTab from "@/components/production/ProductionRequestTab";
import ProductionTrackingTab from "@/components/production/ProductionTrackingTab";
import ConfigurationTab from "@/components/production/ConfigurationTab";
import LossTab from "@/components/production/LossTab";

type ProductionTab = "request" | "tracking" | "configuration" | "loss";

export default function ProductionPage() {
  const { user, activeAccount } = useAuth();

  const isInventoryManager = Boolean(
    activeAccount === "inventory_manager" ||
    user?.email?.toLowerCase() === "inventorymanager@r3b2p.com" ||
    user?.email?.toLowerCase() === "scmsuser@r3b2p.com" ||
    user?.roles?.includes("Inventory Manager") ||
    user?.roles?.includes("InventoryManager")
  );

  const isHeadCook = Boolean(
    activeAccount === "head_cook" ||
    user?.email?.toLowerCase() === "headcook@r3b2p.com" ||
    user?.username === "headcook" ||
    user?.roles?.includes("Head Cook")
  );

  const isAdmin = Boolean(
    activeAccount === "admin" ||
    user?.email?.toLowerCase() === "admin@r3b2p.com" ||
    user?.roles?.includes("Admin")
  );

  const [activeMainTab, setActiveMainTab] = useState<ProductionTab>("request");
  const [trackingBatchId, setTrackingBatchId] = useState<number | null>(null);

  const handleNavigateToTracking = (batchId: number) => {
    setTrackingBatchId(batchId);
    setActiveMainTab("tracking");
  };

  // Main Tabs Definition
  const mainTabs = [
    { key: "request", label: "Production Request" },
    { key: "tracking", label: "Production Tracking" },
    { key: "configuration", label: "Configuration" },
    { key: "loss", label: "Loss" },
  ];

  return (
    <div className="w-full min-h-full py-8 px-6 md:px-8 space-y-6 animate-page-in">
      <PageHeader
        title="Production & Quality"
        description={
          isInventoryManager
            ? "Inspect production material requisitions, verify suggested lots via QR scan, and issue supplies."
            : "Authorized batch requests, sequential waterfall tracking, quality sensory assurance, and recipe configuration."
        }
      />

      {/* Main Process Tabs (Hidden for Inventory Manager since they only see Material Request & Issuance) */}
      {!isInventoryManager ? (
        <div className="border-b border-border">
          <div className="flex items-center gap-2 overflow-x-auto">
            {mainTabs.map((tab) => {
              const isActive = activeMainTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveMainTab(tab.key as ProductionTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{tab.label.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Tab 1: Production Request */}
      {!isInventoryManager && activeMainTab === "request" && (
        <ProductionRequestTab
          isAdmin={isAdmin}
          isHeadCook={isHeadCook}
          onNavigateToTracking={handleNavigateToTracking}
        />
      )}

      {/* Tab 2: Production Tracking (or Inventory Manager's MR & Issuance View) */}
      {(isInventoryManager || activeMainTab === "tracking") && (
        <ProductionTrackingTab
          initialSelectedBatchId={trackingBatchId}
          isInventoryManager={isInventoryManager}
          isHeadCook={isHeadCook}
          onNavigateToRequest={() => setActiveMainTab("request")}
        />
      )}

      {/* Tab 3: Configuration */}
      {!isInventoryManager && activeMainTab === "configuration" && <ConfigurationTab />}

      {/* Tab 4: Loss */}
      {!isInventoryManager && activeMainTab === "loss" && <LossTab />}
    </div>
  );
}