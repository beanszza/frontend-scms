"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Trophy, Package, ArrowRightLeft, MapPin } from "lucide-react";
import { distributionAnalytics } from "./mock-data";

// Sort by batchesReceived descending so top receivers appear first
const sorted = [...distributionAnalytics].sort(
  (a, b) => b.batchesReceived - a.batchesReceived
);

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3.5 py-3 shadow-lg min-w-[200px] transition-all">
        <p className="text-xs font-bold text-foreground mb-2.5 flex items-center gap-1.5">
          <span className="w-1.5 h-4 rounded-sm bg-blue-600 inline-block animate-pulse" />
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                  style={{ background: p.color }}
                />
                {p.name}
              </span>
              <span className="text-xs font-bold text-foreground">
                {p.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function DistributionAnalyticsChart() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial dark mode state
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);

    // Observe changes to the html classList to react dynamically
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const topBranch = sorted[0];

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground/90 tracking-tight">
            Distribution Analytics
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Batches received &amp; transfer count · ranked by volume
          </p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-semibold border border-border/50 shadow-sm">
          <MapPin className="w-3.5 h-3.5" />
          All Branches
        </span>
      </div>

      {/* Top receiver callout */}
      <div className="relative overflow-hidden mb-6 mt-4 p-5 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/85 to-orange-50/40 shadow-sm">
        {/* Decorative glows */}
        <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-32 h-32 rounded-full bg-orange-400/10 blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="inline-block text-[10px] font-extrabold tracking-wider uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Top Receiver
              </span>
              <h4 className="text-base sm:text-lg font-bold text-foreground mt-1.5">
                {topBranch.branch}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none flex items-center gap-3 bg-card/80/40 border border-border/50/80 p-2.5 rounded-xl min-w-[110px] shadow-sm">
              <div className="p-1.5 rounded-lg bg-muted text-foreground">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Batches
                </p>
                <p className="text-sm font-extrabold text-foreground">
                  {topBranch.batchesReceived}
                </p>
              </div>
            </div>

            <div className="flex-1 sm:flex-none flex items-center gap-3 bg-card/80/40 border border-border/50/80 p-2.5 rounded-xl min-w-[110px] shadow-sm">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Transfers
                </p>
                <p className="text-sm font-extrabold text-foreground">
                  {topBranch.transfers}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
            barCategoryGap="28%"
            barGap={3}
          >
            <defs>
              <linearGradient id="batchesGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="transfersGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? "#334155" : "#e4e7ec"}
              horizontal={false}
              opacity={0.5}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: isDarkMode ? "#98a2b3" : "#667085" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="branch"
              tick={{ fontSize: 11, fill: isDarkMode ? "#98a2b3" : "#667085" }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                fill: isDarkMode ? "#1e293b" : "#f8fafc",
                opacity: 0.3,
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: "12px" }}
              formatter={(value) => (
                <span className="text-xs font-medium text-foreground pl-1">
                  {value}
                </span>
              )}
            />
            <Bar
              dataKey="batchesReceived"
              name="Batches Received"
              fill="url(#batchesGradient)"
              radius={[0, 4, 4, 0]}
            >
              <LabelList
                dataKey="batchesReceived"
                position="right"
                style={{
                  fontSize: 11,
                  fill: isDarkMode ? "#98a2b3" : "#667085",
                  fontWeight: 600,
                }}
                dx={6}
              />
            </Bar>
            <Bar
              dataKey="transfers"
              name="Transfers"
              fill="url(#transfersGradient)"
              radius={[0, 4, 4, 0]}
            >
              <LabelList
                dataKey="transfers"
                position="right"
                style={{
                  fontSize: 11,
                  fill: isDarkMode ? "#98a2b3" : "#667085",
                  fontWeight: 600,
                }}
                dx={6}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
