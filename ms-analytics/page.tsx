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
  ShoppingBag,
  Layers,
  Flame,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, aiRes] = await Promise.all([
        fetch("http://localhost:5006/api/analytics/dashboard").then((res) => res.json()),
        fetch("http://localhost:5006/api/analytics/ai").then((res) => res.json()),
      ]);

      if (dashRes?.data) setData(dashRes.data);
      if (aiRes?.data) setAiData(aiRes.data);
    } catch (err) {
      console.error("Error fetching dashboard analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCompile = async () => {
    setCompiling(true);
    try {
      await fetch("http://localhost:5006/api/analytics/compile", { method: "POST" });
      await fetchDashboardData();
    } catch (err) {
      console.error("Error compiling analytics:", err);
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

  const procurementRecs = aiData?.procurementRecommendations || [];
  const productionRecs = aiData?.productionRecommendations || [];

  return (
    <div className="space-y-6 pb-12 text-gray-900 dark:text-white">
      {/* ── Header Container ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">SCM Executive Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold">
              Read-Only PostgreSQL + MongoDB
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time supply chain operational analytics, stock alerts & ML.NET intelligence engine
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400 dark:text-gray-500 hidden md:block text-right">
            <span>Last Compiled: </span>
            <span className="font-bold text-gray-700 dark:text-gray-300 block">
              {data?.lastCompiledAt
                ? new Date(data.lastCompiledAt).toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "Just now"}
            </span>
          </div>
          <button
            onClick={handleManualCompile}
            disabled={compiling}
            className="flex items-center justify-center gap-2 px-4 h-10 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={compiling ? "animate-spin" : ""} />
            {compiling ? "Compiling..." : "Re-compile Analytics"}
          </button>
        </div>
      </div>

      {/* ── I. Key Metrics Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Active Items</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold">{loading ? "..." : kpis.totalActiveItems ?? 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Tracked in master database</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Low Stock Alert</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{loading ? "..." : kpis.lowStockCount ?? 0}</p>
            <p className="text-[11px] text-rose-500 font-medium mt-0.5">Below minimum stock threshold</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Production Yield Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Factory size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{loading ? "..." : `${kpis.overallProductionYieldPercent ?? 100}%`}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Passed QA Quality Inspections</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Suppliers</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Handshake size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold">{loading ? "..." : kpis.activeSupplierCount ?? 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Verified Procurement Vendors</p>
          </div>
        </div>
      </div>

      {/* ── II. Low Stock Item Stats & Alert List ─────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Low Stock Item Stats & Alert List</h3>
              <p className="text-xs text-gray-400">Inventory items requiring immediate reorder action</p>
            </div>
          </div>
          <Link
            href="/inventory"
            className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Manage Inventory <ChevronRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3.5">Item Name</th>
                <th className="px-6 py-3.5">Current Stock Level</th>
                <th className="px-6 py-3.5">Minimum Threshold</th>
                <th className="px-6 py-3.5">Stock Urgency Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {lowStockAlerts.length > 0 ? (
                lowStockAlerts.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{row.itemName}</td>
                    <td className="px-6 py-4 text-rose-600 dark:text-rose-400 font-bold">{row.currentStock} Pcs</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.minStockLevel} Pcs</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          row.urgency === "CRITICAL"
                            ? "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"
                            : "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                        }`}
                      >
                        {row.urgency}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs font-medium">
                    All inventory items are currently healthy and above minimum thresholds.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── III & IV. Production Frequency + Branch Delivery Rankings ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Frequency Ranking */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Flame size={16} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Most Frequently Produced Products</h3>
                <p className="text-xs text-gray-400">Kitchen batch production volume leaderboard</p>
              </div>
            </div>
            <div className="space-y-3">
              {frequentlyProduced.length > 0 ? (
                frequentlyProduced.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                        #{i + 1}
                      </span>
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{item.recipeName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 block">{item.batchCount} Batches</span>
                      <span className="text-[11px] text-gray-400 font-medium">{item.totalOutputQty} Units Cooked</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">No production batches logged in the database yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Branch Delivery Rankings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Truck size={16} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Branch Delivery Rankings & Volume</h3>
                <p className="text-xs text-gray-400">Top branch destinations by total stock transfers received</p>
              </div>
            </div>
            <div className="space-y-3">
              {branchDeliveries.length > 0 ? (
                branchDeliveries.map((branch: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">
                        #{i + 1}
                      </span>
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{branch.branchName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">{branch.deliveryCount} Deliveries</span>
                      <span className="text-[11px] text-gray-400 font-medium">{branch.totalItemsTransferred} Items Received</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">No branch stock transfers logged in the database yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── V. ML.NET AI Recommendations Panel ─────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">ML.NET AI Recommendations Engine</h2>
              <p className="text-xs text-gray-400">Predictive intelligence for procurement reorder & production baking schedule</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 font-bold">
            {aiData?.modelType || "ML.NET Linear Regression & Demand Velocity Engine"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Procurement AI Advice */}
          <div className="bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Procurement Reorder Quantities Advice</h3>
            </div>
            <div className="space-y-3">
              {procurementRecs.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">{item.itemName}</span>
                    <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-md">
                      Order +{item.recommendedReorderQty} Units
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{item.recommendationBasis}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Production AI Advice */}
          <div className="bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={16} className="text-blue-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Production Baking Batch Quantity Advice</h3>
            </div>
            <div className="space-y-3">
              {productionRecs.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">{item.recipeName}</span>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-md">
                      Bake {item.recommendedBatchCount} Batches ({item.recommendedOutputQty} Pcs)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{item.recommendationBasis}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
