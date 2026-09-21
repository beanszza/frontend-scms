"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PackageCheck, 
  ClipboardCheck, 
  AlertTriangle, 
  Boxes, 
  RotateCcw, 
  Trash2, 
  FileText 
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import GrnTab from "@/components/receiving/GrnTab";
import QaTab from "@/components/receiving/QaTab";
import DiscrepancyTab from "@/components/receiving/DiscrepancyTab";
import PutAwayTab from "@/components/receiving/PutAwayTab";
import RtvTab from "@/components/receiving/RtvTab";
import LossReportTab from "@/components/receiving/LossReportTab";

type MainTabId = "grn" | "qa" | "discrepancies" | "putaway" | "rtv" | "loss";

export default function ViewGoodsReceiving() {
  const [activeTab, setActiveTab] = useState<MainTabId>("grn");
  const [counts, setCounts] = useState({
    grn: 0,
    qa: 0,
    discrepancies: 0,
    putaway: 0,
    rtv: 0,
    loss: 0,
  });

  // Fetch count indicators for navigation badges
  const loadTabCounts = async () => {
    try {
      const [grnRes, delRes, qaRes, discRes, paRes, rtvRes, lrRes] = await Promise.allSettled([
        api.get("/api/GoodsReceipts"),
        api.get("/api/Deliveries"),
        api.get("/api/QualityInspections"),
        api.get("/api/Discrepancies"),
        api.get("/api/PutAway"),
        api.get("/api/ReturnToVendors"),
        api.get("/api/LossReports"),
      ]);

      let pendingDeliveriesCount = 0;
      const deliveryPayload = delRes.status === "fulfilled" ? delRes.value.data?.data : null;
      const deliveries = Array.isArray(deliveryPayload?.items)
        ? deliveryPayload.items as any[]
        : Array.isArray(deliveryPayload) ? deliveryPayload as any[] : [];
      if (deliveries.length > 0) {
        const postedDeliveryIds = new Set(
          grnRes.status === "fulfilled" && Array.isArray(grnRes.value.data?.data)
            ? (grnRes.value.data.data as any[]).filter((g) => g.status !== "Draft" && g.deliveryId).map((g) => g.deliveryId)
            : []
        );
        pendingDeliveriesCount = deliveries.filter(
          (d: any) =>
            d.status === "Arrived" &&
            (!d.deliveryId || !postedDeliveryIds.has(d.deliveryId))
        ).length;
      }

      let pendingQaCount = 0;
      if (qaRes.status === "fulfilled" && Array.isArray(qaRes.value.data?.data)) {
        pendingQaCount = (qaRes.value.data.data as any[]).filter((q) => q.status === "Pending").length;
      }

      let openDiscCount = 0;
      if (discRes.status === "fulfilled" && Array.isArray(discRes.value.data?.data)) {
        openDiscCount = (discRes.value.data.data as any[]).filter((d) => d.status === "Open").length;
      }

      let pendingPaCount = 0;
      if (paRes.status === "fulfilled" && Array.isArray(paRes.value.data?.data)) {
        pendingPaCount = (paRes.value.data.data as any[]).filter((p) => p.status === "Pending").length;
      }

      let rtvCount = 0;
      if (rtvRes.status === "fulfilled" && Array.isArray(rtvRes.value.data?.data)) {
        rtvCount = (rtvRes.value.data.data as any[]).length;
      }

      let lossCount = 0;
      if (lrRes.status === "fulfilled" && Array.isArray(lrRes.value.data?.data)) {
        lossCount = (lrRes.value.data.data as any[]).length;
      }

      setCounts({
        grn: pendingDeliveriesCount,
        qa: pendingQaCount,
        discrepancies: openDiscCount,
        putaway: pendingPaCount,
        rtv: rtvCount,
        loss: lossCount,
      });
    } catch (e) {
      console.error("Failed to load header counts:", e);
    }
  };

  useEffect(() => {
    loadTabCounts();
  }, []);

  const tabs: { id: MainTabId; label: string; badgeCount?: number }[] = [
    { id: "grn", label: "GRN / RECEIVE", badgeCount: counts.grn },
    { id: "qa", label: "QA INSPECTION", badgeCount: counts.qa },
    { id: "discrepancies", label: "DISCREPANCIES", badgeCount: counts.discrepancies },
    { id: "putaway", label: "PUT AWAY", badgeCount: counts.putaway },
    { id: "rtv", label: "SUPPLIER RETURNS", badgeCount: counts.rtv },
    { id: "loss", label: "LOSS / DISPOSAL", badgeCount: counts.loss },
  ];

  return (
    <div className="w-full min-h-full py-8 px-6 md:px-8 space-y-6 animate-page-in">
      {/* Page Header exactly matching Orders & Procurement */}
      <PageHeader
        title="Goods Receiving & Inbound Logistics"
        description="End-to-end receipt verification: PO count verification, incoming QA inspection, automated discrepancy resolution, and inventory put away."
      />

      {/* Top Process Tabs matching Product Requisition / Product Order / Delivery underline tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Subpage */}
      <div>
        {activeTab === "grn" && <GrnTab onPosted={() => { setActiveTab("qa"); loadTabCounts(); }} />}
        {activeTab === "qa" && <QaTab />}
        {activeTab === "discrepancies" && <DiscrepancyTab />}
        {activeTab === "putaway" && <PutAwayTab />}
        {activeTab === "rtv" && <RtvTab />}
        {activeTab === "loss" && <LossReportTab />}
      </div>
    </div>
  );
}
