"use client";

import { lastCompiledAt } from "@/components/dashboard/mock-data";
import KpiCards from "@/components/dashboard/kpi-cards";
import InventoryDistributionChart from "@/components/dashboard/inventory-distribution-chart";
import ProcurementTrendChart from "@/components/dashboard/procurement-trend-chart";
import ProductionQualityChart from "@/components/dashboard/production-quality-chart";
import SupplierPerformanceChart from "@/components/dashboard/supplier-performance-chart";
import DistributionAnalyticsChart from "@/components/dashboard/distribution-analytics-chart";
import AiRecommendations from "@/components/dashboard/ai-recommendations";
import { RefreshCw } from "lucide-react";

function FreshnessIndicator({ timestamp }: { timestamp: string }) {
  const date = new Date(timestamp);
  const formatted = date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
  return (
    <div className="flex items-center gap-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
      <RefreshCw size={12} />
      <span>
        Last compiled:{" "}
        <span className="font-medium text-gray-600 dark:text-gray-400">
          {formatted}
        </span>
      </span>
    </div>
  );
}

const Page = () => {
  return (
    <div className="space-y-6 pb-8">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">
            SCM Dashboard
          </h1>
          <p className="text-theme-sm text-gray-400 mt-0.5">
            Supply chain performance overview — Administrator view
          </p>
        </div>
        <FreshnessIndicator timestamp={lastCompiledAt} />
      </div>

      {/* ── I. KPI Cards ─────────────────────────────────────────────── */}
      <KpiCards />

      {/* ── II & III. Inventory Distribution + Procurement Trend ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InventoryDistributionChart />
        <ProcurementTrendChart />
      </div>

      {/* ── IV & V. Production Quality + Supplier Performance ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProductionQualityChart />
        <SupplierPerformanceChart />
      </div>

      {/* ── VI. Distribution Analytics ───────────────────────────────── */}
      <DistributionAnalyticsChart />

      {/* ── VII. AI Recommendations ──────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
            AI Recommendations
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-theme-xs font-medium">
            Powered by AI
          </span>
        </div>
        <AiRecommendations />
      </div>
    </div>
  );
};

export default Page;
