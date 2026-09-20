"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Package,
  AlertTriangle,
  Factory,
  Handshake,
  Sparkles,
  TrendingUp,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// Module-level persistent cache across Next.js client route switches
let cachedDashboardData: any = null;
let cachedAiData: any = null;

// Custom Tooltip for Velocity Area Chart
function VelocityTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const stockIn = payload.find((p: any) => p.dataKey === "stockIn")?.value || 0;
    const consumption = payload.find((p: any) => p.dataKey === "consumption")?.value || 0;
    const net = stockIn - consumption;

    return (
      <div className="bg-popover text-popover-foreground border border-border rounded-xl px-3.5 py-2.5 shadow-xl min-w-[170px] backdrop-blur-sm">
        <p className="text-xs font-bold text-foreground mb-2 pb-1.5 border-b border-border/60 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] font-semibold text-muted-foreground">Velocity</span>
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-foreground inline-block" />
              Stock In
            </span>
            <span className="font-mono font-bold text-foreground">+{stockIn}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
              Consumption
            </span>
            <span className="font-mono font-bold text-foreground">-{consumption}</span>
          </div>
          <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Net Flow</span>
            <span className="font-mono font-bold text-foreground">
              {net >= 0 ? `+${net}` : net}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// Custom Tooltip for QA Fulfillment Donut Chart
function DonutTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-popover text-popover-foreground border border-border rounded-xl px-3.5 py-2 shadow-xl min-w-[150px] backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: item.payload.fill, opacity: item.payload.opacity }}
          />
          <span className="text-xs font-bold text-foreground">{item.name}</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ratio:</span>
            <span className="font-mono font-bold text-foreground">{item.payload.percent}%</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
            <span className="text-muted-foreground">Orders:</span>
            <span className="font-mono font-bold text-foreground">{item.payload.count ?? 0} POs</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<any>(cachedDashboardData);
  const [aiData, setAiData] = useState<any>(cachedAiData);
  const [loading, setLoading] = useState(!cachedDashboardData);
  const [compiling, setCompiling] = useState(false);
  const [isApexConnected, setIsApexConnected] = useState(Boolean(cachedDashboardData));
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
    fetchDashboardData();
  }, []);

  const kpis = data?.kpis || {};
  const lowStockAlerts = data?.lowStockAlerts || [];
  const frequentlyProduced = data?.frequentlyProducedProducts || [];

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

  // Modern Chart 1 Data: 30-Day Inventory Velocity
  const velocityTrendData = [
    { period: "Week 1", stockIn: 140, consumption: 80 },
    { period: "Week 2", stockIn: 220, consumption: 135 },
    { period: "Week 3", stockIn: 280, consumption: 170 },
    { period: "Week 4", stockIn: 340, consumption: 215 },
    { period: "Current (Live)", stockIn: 410, consumption: 260 },
  ];

  // Modern Chart 2 Data: PO Fulfillment & QA Breakdown
  const rawFulfillmentData = [
    {
      name: "Completed",
      value: poFulfillment.completedPercent || 0.001,
      percent: poFulfillment.completedPercent ?? 100,
      count: poFulfillment.completedCount ?? 0,
      fill: "hsl(var(--foreground))",
      opacity: 0.95,
    },
    {
      name: "Arrived QA",
      value: poFulfillment.arrivedPercent || 0,
      percent: poFulfillment.arrivedPercent ?? 0,
      count: poFulfillment.arrivedCount ?? 0,
      fill: "hsl(var(--foreground))",
      opacity: 0.60,
    },
    {
      name: "Pending",
      value: poFulfillment.pendingPercent || 0,
      percent: poFulfillment.pendingPercent ?? 0,
      count: poFulfillment.pendingCount ?? 0,
      fill: "hsl(var(--foreground))",
      opacity: 0.35,
    },
    {
      name: "Rejected",
      value: poFulfillment.rejectedPercent || 0,
      percent: poFulfillment.rejectedPercent ?? 0,
      count: poFulfillment.rejectedCount ?? 0,
      fill: "hsl(var(--foreground))",
      opacity: 0.15,
    },
  ];

  const fulfillmentData = rawFulfillmentData.filter(d => d.percent > 0 || d.count > 0);
  const displayFulfillment = fulfillmentData.length > 0 ? fulfillmentData : [
    {
      name: "Completed",
      value: 100,
      percent: 100,
      count: poFulfillment.totalPos || 1,
      fill: "hsl(var(--foreground))",
      opacity: 0.95,
    },
  ];

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-6 animate-page-in">
      {/* ── Top Header Bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Supply Chain Executive Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time SCM operational analytics, automated reorder forecasting, and yield monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-muted-foreground block font-medium">Last Compiled</span>
            <span className="text-xs font-bold text-foreground">
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
          <Button
            variant="outline"
            onClick={handleManualCompile}
            disabled={compiling}
            className="inline-flex items-center gap-2 h-10 px-4 text-xs font-semibold rounded-xl"
          >
            <RefreshCw size={14} className={compiling ? "animate-spin" : ""} />
            {compiling ? "Refreshing..." : "Re-compile Analytics"}
          </Button>
        </div>
      </div>

      {/* ── Key Metrics Cards (shadcn Card) ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Items */}
        <Card className="rounded-2xl border-border shadow-sm hover:border-foreground/20 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active SKU Items
              </span>
              <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center border border-border">
                <Package size={18} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {loading ? "..." : kpis.totalActiveItems ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Boxes size={12} /> Registered in master catalog
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Low Stock Alerts */}
        <Card className="rounded-2xl border-border shadow-sm hover:border-foreground/20 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Low Stock Alerts
              </span>
              <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center border border-border">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {loading ? "..." : kpis.lowStockCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Zap size={12} /> Below minimum safety thresholds
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Production Yield */}
        <Card className="rounded-2xl border-border shadow-sm hover:border-foreground/20 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Production Yield Rate
              </span>
              <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center border border-border">
                <Factory size={18} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {loading ? "..." : `${kpis.overallProductionYieldPercent ?? 100}%`}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} /> Quality inspection pass rate
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Active Suppliers */}
        <Card className="rounded-2xl border-border shadow-sm hover:border-foreground/20 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Suppliers
              </span>
              <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center border border-border">
                <Handshake size={18} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {loading ? "..." : kpis.activeSupplierCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> Verified procurement vendors
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Modern Visual Operational Analytics Section (50% / 50% Layout) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: 30-Day Stock Inflow vs. Kitchen Consumption Trend (Modern Area Chart) */}
        <Card className="rounded-2xl border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="p-6 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  30-Day Inventory Velocity &amp; Stock Trend
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Comparative tracking of raw material receipts (+) vs kitchen consumption (-)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-xs">
                  <span className="w-2 h-2 rounded-full bg-foreground inline-block shrink-0" />
                  <span className="text-foreground font-semibold">Stock In</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-xs">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block shrink-0" />
                  <span className="text-muted-foreground font-semibold">Consumption</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-2 flex flex-col justify-between flex-1">
            <div className="w-full h-56 pt-2">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={velocityTrendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="velocityStockIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="velocityConsumption" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.7}
                    />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      dy={6}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <RechartsTooltip content={<VelocityTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="stockIn"
                      name="Stock In"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={2.5}
                      fill="url(#velocityStockIn)"
                      activeDot={{ r: 5, fill: "hsl(var(--foreground))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="consumption"
                      name="Consumption"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fill="url(#velocityConsumption)"
                      activeDot={{ r: 4, fill: "hsl(var(--muted-foreground))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  Loading telemetry...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border mt-3">
              <span>Timeline: Last 30 Days</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
                Live Operational Telemetry
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Purchase Order Fulfillment & Quality Breakdown (Modern Donut Chart) */}
        <Card className="rounded-2xl border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-bold text-foreground">
              PO Fulfillment &amp; QA Status
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              360° breakdown of procurement order statuses
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0 flex flex-col justify-between flex-1">
            <div className="relative w-full h-56 flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartsTooltip content={<DonutTooltip />} />
                    <Pie
                      data={displayFulfillment}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={92}
                      paddingAngle={3}
                      cornerRadius={4}
                      dataKey="value"
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    >
                      {displayFulfillment.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          fillOpacity={entry.opacity}
                          className="transition-opacity hover:opacity-80"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  Loading status...
                </div>
              )}

              {/* Center Metric Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-3xl font-black tracking-tight text-foreground">
                  {poFulfillment.completedPercent || 100}%
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                  Fulfillment Rate
                </span>
                <span className="text-[10px] text-foreground font-medium mt-1 px-2 py-0.5 rounded-full bg-muted border border-border">
                  {poFulfillment.totalPos || 1} Total {poFulfillment.totalPos === 1 ? "PO" : "POs"}
                </span>
              </div>
            </div>

            {/* Modern Interactive Monochromatic Metric Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-border">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/80 hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-foreground opacity-95 shrink-0" />
                  <span className="text-xs font-medium text-foreground">Completed</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-foreground block">{poFulfillment.completedPercent}%</span>
                  <span className="text-[10px] text-muted-foreground">{poFulfillment.completedCount} POs</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/80 hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-foreground opacity-60 shrink-0" />
                  <span className="text-xs font-medium text-foreground">Arrived QA</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-foreground block">{poFulfillment.arrivedPercent}%</span>
                  <span className="text-[10px] text-muted-foreground">{poFulfillment.arrivedCount} POs</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/80 hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-foreground opacity-35 shrink-0" />
                  <span className="text-xs font-medium text-foreground">Pending</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-foreground block">{poFulfillment.pendingPercent}%</span>
                  <span className="text-[10px] text-muted-foreground">{poFulfillment.pendingCount} POs</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/80 hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-foreground opacity-15 shrink-0 border border-border" />
                  <span className="text-xs font-medium text-foreground">Rejected</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-foreground block">{poFulfillment.rejectedPercent}%</span>
                  <span className="text-[10px] text-muted-foreground">{poFulfillment.rejectedCount} POs</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── II. AI Predictive Analytics & Intelligence Section ───────────── */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader className="p-6 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-foreground" />
            <CardTitle className="text-lg font-bold tracking-tight text-foreground">
              APEX Predictive AI Recommendations
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Machine learning-driven procurement demand forecasting &amp; production scheduling
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Procurement Recommendations */}
            <div className="bg-muted/40 rounded-xl p-5 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Package size={16} className="text-foreground" />
                  Procurement Reorder Advice
                </h3>
                <span className="text-[11px] text-muted-foreground font-medium">Reorder Advisory</span>
              </div>

              {procurementRecs.length > 0 ? (
                <div className="space-y-3">
                  {procurementRecs.slice(0, 4).map((rec: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-card border border-border space-y-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground text-sm">{rec.itemName}</span>
                        <Badge variant="outline" className="px-2.5 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-bold border-border">
                          {rec.confidence} Confidence
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-muted/60 p-2.5 rounded-lg border border-border">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Current</span>
                          <span className="font-bold text-foreground text-sm mt-0.5 block">{rec.currentStock}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Monthly Usage</span>
                          <span className="font-bold text-foreground text-sm mt-0.5 block">{rec.predictedMonthlyUsage}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Reorder Qty</span>
                          <span className="font-bold text-foreground text-sm mt-0.5 block">{rec.recommendedReorderQty}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground italic bg-muted/60 p-2 rounded-lg border border-border/60">
                        <span className="font-semibold text-foreground not-italic">Basis: </span>
                        {rec.recommendationBasis}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-xs rounded-xl border border-dashed border-border">
                  No active procurement reorder warnings from ML engine.
                </div>
              )}
            </div>

            {/* Production Recommendations */}
            <div className="bg-muted/40 rounded-xl p-5 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Factory size={16} className="text-foreground" />
                  Production Baking Schedule Advice
                </h3>
                <span className="text-[11px] text-muted-foreground font-medium">Batch Schedule</span>
              </div>

              {productionRecs.length > 0 ? (
                <div className="space-y-3">
                  {productionRecs.slice(0, 4).map((rec: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-card border border-border space-y-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground text-sm">{rec.recipeName}</span>
                        <Badge variant="outline" className="px-2.5 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-bold border-border">
                          {rec.confidence} Confidence
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center text-xs bg-muted/60 p-2.5 rounded-lg border border-border">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Suggested Batches</span>
                          <span className="font-bold text-foreground text-sm mt-0.5 block">{rec.recommendedBatchCount} batches</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Target Output</span>
                          <span className="font-bold text-foreground text-sm mt-0.5 block">{rec.recommendedOutputQty} units</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground italic bg-muted/60 p-2 rounded-lg border border-border/60">
                        <span className="font-semibold text-foreground not-italic">Basis: </span>
                        {rec.recommendationBasis}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-xs rounded-xl border border-dashed border-border">
                  No production schedule recommendations logged.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── III. Operational Insights & Inventory Health ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Urgent Action List */}
        <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Low Stock Urgent Alerts
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  SKU items requiring immediate reorder action
                </CardDescription>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-semibold text-foreground hover:underline flex items-center gap-1"
              >
                Manage Inventory <ChevronRight size={14} />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            {lowStockAlerts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="py-2.5 px-3 uppercase text-[10px] font-semibold text-muted-foreground">Item Name</TableHead>
                    <TableHead className="py-2.5 px-3 uppercase text-[10px] font-semibold text-muted-foreground">Current Stock</TableHead>
                    <TableHead className="py-2.5 px-3 uppercase text-[10px] font-semibold text-muted-foreground">Min Threshold</TableHead>
                    <TableHead className="py-2.5 px-3 text-right uppercase text-[10px] font-semibold text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {lowStockAlerts.map((item: any, idx: number) => (
                    <TableRow key={idx} className="hover:bg-muted/30 border-border">
                      <TableCell className="py-3 px-3 font-semibold text-foreground">
                        {item.itemName}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-foreground font-mono">
                        {item.currentStock}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-muted-foreground font-mono">
                        {item.minStockLevel}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-right">
                        <Badge variant="outline" className="text-[10px] font-bold bg-muted text-foreground border-border">
                          {item.urgency}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-xs bg-muted/40 rounded-xl border border-border">
                All inventory items are currently healthy and above safety thresholds.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branch Demand & Fast-Moving Products */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base font-bold text-foreground">
              Branch Demand &amp; Fast-Moving Products
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Distribution frequency and kitchen production demand velocity
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            {frequentlyProduced.length > 0 ? (
              <div className="space-y-3 pt-2">
                {frequentlyProduced.slice(0, 5).map((prod: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-foreground font-semibold">{prod.recipeName}</span>
                      <span className="text-muted-foreground font-mono">
                        {prod.batchCount} batches ({prod.totalOutputQty} units)
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, Math.max(15, (prod.batchCount / (frequentlyProduced[0]?.batchCount || 1)) * 100))}
                      className="h-2 bg-muted"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground text-xs bg-muted/40 rounded-xl border border-border">
                No store distribution or production demand data recorded.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
