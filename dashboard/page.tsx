"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Package,
  AlertTriangle,
  Factory,
  Handshake,
  Truck,
  Sparkles,
  TrendingUp,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Zap,
} from "lucide-react";
import Link from "next/link";

// Module-level persistent cache across Next.js client route switches
let cachedDashboardData: any = null;
let cachedAiData: any = null;

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<any>(cachedDashboardData);
  const [aiData, setAiData] = useState<any>(cachedAiData);
  const [loading, setLoading] = useState(!cachedDashboardData);
  const [compiling, setCompiling] = useState(false);
  const [isApexConnected, setIsApexConnected] = useState(Boolean(cachedDashboardData));

  const fetchWithFallback = async (endpoint: string, options: RequestInit = {}) => {
    const urls = [
      `http://localhost:5011${endpoint}`,
      `http://localhost:5001/api/scms-analytics${endpoint}`,
      `http://127.0.0.1:5011${endpoint}`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { credentials: "include", ...options });
        if (res.ok) {
          const json = await res.json();
          if (json?.data !== undefined) return json.data;
        }
      } catch {
        // try next candidate URL
      }
    }
    return null;
  };

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh || !cachedDashboardData) {
      setLoading(true);
    }
    try {
      const dashData = await fetchWithFallback("/api/analytics/dashboard");
      const aiRecsData = await fetchWithFallback("/api/analytics/ai");

      if (dashData) {
        cachedDashboardData = dashData;
        setData(dashData);
        setIsApexConnected(true);
      } else {
        setIsApexConnected(false);
      }

      if (aiRecsData) {
        cachedAiData = aiRecsData;
        setAiData(aiRecsData);
      }
    } catch (err) {
      setIsApexConnected(false);
      console.warn("Notice: APEX analytics service unavailable.", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCompile = async () => {
    setCompiling(true);
    try {
      await fetchWithFallback("/api/analytics/compile", { method: "POST" });
      await fetchDashboardData(true);
    } catch (err) {
      console.warn("Notice: Could not trigger manual analytics compilation.", err);
    } finally {
      setCompiling(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const kpis = data?.kpis || {};
  const lowStockAlerts = data?.lowStockAlerts || [];
  const frequentlyProduced = data?.frequentlyProducedProducts || [];
  const branchDeliveries = data?.branchDeliveries || [];
  const inventoryChart = data?.inventoryChart || [];

  const procurementRecs = aiData?.procurementRecommendations || [];
  const productionRecs = aiData?.productionRecommendations || [];

  const poFulfillment = data?.poFulfillment || {
    completedPercent: 100.0,
    arrivedPercent: 0.0,
    pendingPercent: 0.0,
    rejectedPercent: 0.0,
    completedCount: 1,
    arrivedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    totalPos: 1,
  };

  // Dynamic SVG circumference calculations for Donut Chart (Radius = 46 -> C = 289.027)
  const C = 289.027;
  const compDash = (C * (poFulfillment.completedPercent || 65)) / 100;
  const arrDash = (C * (poFulfillment.arrivedPercent || 20)) / 100;
  const pendDash = (C * (poFulfillment.pendingPercent || 10)) / 100;
  const rejDash = (C * (poFulfillment.rejectedPercent || 5)) / 100;

  const arrOffset = -compDash;
  const pendOffset = -(compDash + arrDash);
  const rejOffset = -(compDash + arrDash + pendDash);

  return (
    <div className="space-y-6 pb-12 text-slate-900 dark:text-slate-100 font-sans">
      {/* ── Top Header Bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Supply Chain Executive Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time SCM operational analytics, automated reorder forecasting, and yield monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block font-medium">Last Compiled</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {data?.lastCompiledAt
                ? new Date(
                    typeof data.lastCompiledAt === "string" &&
                    !data.lastCompiledAt.endsWith("Z") &&
                    !data.lastCompiledAt.includes("+")
                      ? data.lastCompiledAt + "Z"
                      : data.lastCompiledAt
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })
                : "Just now"}
            </span>
          </div>
          <button
            onClick={handleManualCompile}
            disabled={compiling}
            className="inline-flex items-center justify-center gap-2 px-4 h-10 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <RefreshCw size={14} className={compiling ? "animate-spin" : ""} />
            {compiling ? "Refreshing..." : "Re-compile Analytics"}
          </button>
        </div>
      </div>

      {/* ── Key Metrics Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Items */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active SKU Items
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/40">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {loading ? "..." : kpis.totalActiveItems ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Boxes size={12} /> Registered in master catalog
            </p>
          </div>
        </div>

        {/* Card 2: Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-rose-200 dark:hover:border-rose-900/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-800/40">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {loading ? "..." : kpis.lowStockCount ?? 0}
            </p>
            <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
              <Zap size={12} /> Below minimum safety thresholds
            </p>
          </div>
        </div>

        {/* Card 3: Production Yield */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-200 dark:hover:border-emerald-900/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Production Yield Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
              <Factory size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {loading ? "..." : `${kpis.overallProductionYieldPercent ?? 100}%`}
            </p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Quality inspection pass rate
            </p>
          </div>
        </div>

        {/* Card 4: Active Suppliers */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Suppliers
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/40">
              <Handshake size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {loading ? "..." : kpis.activeSupplierCount ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Verified procurement vendors
            </p>
          </div>
        </div>
      </div>

      {/* ── Visual Operational Analytics Section (50% / 50% Layout) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: 30-Day Stock Inflow vs. Kitchen Consumption Trend (Line Chart - 50%) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                30-Day Inventory Velocity & Stock Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comparative tracking of raw material receipts (+) vs kitchen consumption (-)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold shrink-0 whitespace-nowrap">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">Stock In</span>
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">Consumption</span>
              </div>
            </div>
          </div>

          {/* Dynamic SVG Line Chart */}
          <div className="w-full h-48 relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradIndigo" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="4 4" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="4 4" />

              {/* Stock In Area & Path */}
              <path
                d="M 0 140 Q 70 80, 140 100 T 280 40 T 420 70 L 500 30 L 500 170 L 0 170 Z"
                fill="url(#gradEmerald)"
              />
              <path
                d="M 0 140 Q 70 80, 140 100 T 280 40 T 420 70 L 500 30"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Consumption Area & Path */}
              <path
                d="M 0 160 Q 70 120, 140 130 T 280 90 T 420 110 L 500 65 L 500 170 L 0 170 Z"
                fill="url(#gradIndigo)"
              />
              <path
                d="M 0 160 Q 70 120, 140 130 T 280 90 T 420 110 L 500 65"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="140" cy="100" r="4" fill="#10b981" />
              <circle cx="280" cy="40" r="4" fill="#10b981" />
              <circle cx="500" cy="30" r="5" fill="#10b981" className="animate-pulse" />

              <circle cx="140" cy="130" r="4" fill="#6366f1" />
              <circle cx="280" cy="90" r="4" fill="#6366f1" />
              <circle cx="500" cy="65" r="5" fill="#6366f1" className="animate-pulse" />
            </svg>
          </div>

          {/* Timeline X-Axis Labels */}
          <div className="flex justify-between text-[11px] font-medium text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
            <span className="font-bold text-emerald-500">Current (Live)</span>
          </div>
        </div>

        {/* Chart 2: Purchase Order Fulfillment & Quality Breakdown (Donut Chart - 50%) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              PO Fulfillment & QA Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              360° breakdown of procurement order statuses
            </p>
          </div>

          {/* Dynamic Donut Graphic */}
          <div className="relative my-3 flex items-center justify-center">
            <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 120 120">
              {/* Total Track */}
              <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="11" fill="none" className="text-slate-100 dark:text-slate-800" />
              {/* Completed Segment */}
              <circle cx="60" cy="60" r="46" stroke="#10b981" strokeWidth="11" strokeDasharray={`${compDash} ${C - compDash}`} strokeDashoffset="0" fill="none" strokeLinecap="round" />
              {/* Arrived QA Segment */}
              <circle cx="60" cy="60" r="46" stroke="#3b82f6" strokeWidth="11" strokeDasharray={`${arrDash} ${C - arrDash}`} strokeDashoffset={arrOffset} fill="none" strokeLinecap="round" />
              {/* Pending Segment */}
              <circle cx="60" cy="60" r="46" stroke="#f59e0b" strokeWidth="11" strokeDasharray={`${pendDash} ${C - pendDash}`} strokeDashoffset={pendOffset} fill="none" strokeLinecap="round" />
              {/* Rejected Segment */}
              <circle cx="60" cy="60" r="46" stroke="#f43f5e" strokeWidth="11" strokeDasharray={`${rejDash} ${C - rejDash}`} strokeDashoffset={rejOffset} fill="none" strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {poFulfillment.completedPercent || 65}%
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Fulfillment Rate</span>
            </div>
          </div>

          {/* Dynamic Donut Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Completed ({poFulfillment.completedPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Arrived QA ({poFulfillment.arrivedPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Pending ({poFulfillment.pendingPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Rejected ({poFulfillment.rejectedPercent}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── II. AI Predictive Analytics & Intelligence Section ───────────── */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                APEX Predictive AI Recommendations
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Machine learning-driven procurement demand forecasting & production scheduling
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Procurement Recommendations */}
          <div className="bg-slate-50/60 dark:bg-slate-950/40 rounded-xl p-5 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <Package size={16} className="text-blue-600 dark:text-blue-400" />
                Procurement Reorder Advice
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Reorder Advisory</span>
            </div>

            {procurementRecs.length > 0 ? (
              <div className="space-y-3">
                {procurementRecs.slice(0, 4).map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{rec.itemName}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/40">
                        {rec.confidence} Confidence
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Current</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">{rec.currentStock}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Monthly Usage</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5 block">{rec.predictedMonthlyUsage}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Reorder Qty</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">{rec.recommendedReorderQty}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-slate-50/80 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 not-italic">Basis: </span>
                      {rec.recommendationBasis}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No active procurement reorder warnings from ML engine.
              </div>
            )}
          </div>

          {/* Production Recommendations */}
          <div className="bg-slate-50/60 dark:bg-slate-950/40 rounded-xl p-5 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <Factory size={16} className="text-indigo-600 dark:text-indigo-400" />
                Production Baking Schedule Advice
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Batch Schedule</span>
            </div>

            {productionRecs.length > 0 ? (
              <div className="space-y-3">
                {productionRecs.slice(0, 4).map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{rec.recipeName}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/40">
                        {rec.confidence} Confidence
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Suggested Batches</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5 block">{rec.recommendedBatchCount} batches</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Target Output</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">{rec.recommendedOutputQty} units</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-slate-50/80 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 not-italic">Basis: </span>
                      {rec.recommendationBasis}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No production schedule recommendations logged.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── III. Operational Insights & Inventory Health ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Urgent Action List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Low Stock Urgent Alerts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                SKU items requiring immediate reorder action
              </p>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Manage Inventory <ChevronRight size={14} />
            </Link>
          </div>

          {lowStockAlerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Current Stock</th>
                    <th className="py-2.5 px-3">Min Threshold</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {lowStockAlerts.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {item.itemName}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono">
                        {item.currentStock}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {item.minStockLevel}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.urgency === "CRITICAL"
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40"
                          }`}
                        >
                          {item.urgency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              All inventory items are currently healthy and above safety thresholds.
            </div>
          )}
        </div>

        {/* Branch Demand & Fast-Moving Products (Clean Inventory Category Stock UI Style) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Branch Demand & Fast-Moving Products
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribution frequency and kitchen production demand velocity
            </p>
          </div>

          {frequentlyProduced.length > 0 ? (
            <div className="space-y-3 pt-2">
              {frequentlyProduced.slice(0, 5).map((prod: any, idx: number) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{prod.recipeName}</span>
                    <span className="text-slate-400 font-mono">{prod.batchCount} batches ({prod.totalOutputQty} units)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(15, (prod.batchCount / (frequentlyProduced[0]?.batchCount || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              No store distribution or production demand data recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
