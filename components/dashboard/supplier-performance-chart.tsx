"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { supplierPerformance } from "./mock-data";
import { useState } from "react";

type Metric = "avgLeadDays" | "onTimeRate" | "defectRate";

const METRICS: { key: Metric; label: string; unit: string; color: string; badgeBg: string; badgeText: string }[] = [
  { key: "onTimeRate",   label: "On-Time Rate",  unit: "%",  color: "#16a34a", badgeBg: "bg-green-100",  badgeText: "text-green-700" },
  { key: "avgLeadDays", label: "Avg Lead Time",  unit: "d",  color: "#2563eb", badgeBg: "bg-blue-100",   badgeText: "text-foreground" },
  { key: "defectRate",  label: "Defect Rate",    unit: "%",  color: "#e11d48", badgeBg: "bg-rose-100",   badgeText: "text-rose-700" },
];

function CustomTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  metric: typeof METRICS[number];
}) {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-md min-w-[150px]">
        <p className="text-xs font-bold text-foreground mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: metric.color }} />
          <span className="text-xs text-muted-foreground">{metric.label}</span>
          <span className="ml-auto text-xs font-bold text-foreground">
            {val}{metric.unit}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export default function SupplierPerformanceChart() {
  const [activeMetric, setActiveMetric] = useState<Metric>("onTimeRate");
  const metric = METRICS.find((m) => m.key === activeMetric)!;

  // Sort by selected metric
  const sorted = [...supplierPerformance].sort((a, b) =>
    activeMetric === "onTimeRate"
      ? b[activeMetric] - a[activeMetric]   // higher = better
      : a[activeMetric] - b[activeMetric]    // lower = better for lead/defect
  );

  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground/90">
            Supplier Performance
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare suppliers by key metric
          </p>
        </div>
      </div>

      {/* Metric toggle tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
              activeMetric === m.key
                ? `${m.badgeBg} ${m.badgeText} border-transparent shadow-sm`
                : "bg-muted text-muted-foreground border-border hover:border-border"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Best / Worst callout */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className={`rounded-xl px-3 py-2 ${metric.badgeBg}`}>
          <p className={`text-xs font-semibold ${metric.badgeText}`}>
            Best — {best.supplier}
          </p>
          <p className={`text-lg font-bold ${metric.badgeText}`}>
            {best[activeMetric]}{metric.unit}
          </p>
        </div>
        <div className="rounded-xl px-3 py-2 bg-muted">
          <p className="text-xs font-semibold text-muted-foreground">
            Needs Work — {worst.supplier}
          </p>
          <p className="text-lg font-bold text-foreground">
            {worst[activeMetric]}{metric.unit}
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={sorted}
          margin={{ top: 4, right: 32, left: -16, bottom: 0 }}
          barCategoryGap="32%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" vertical={false} />
          <XAxis
            dataKey="supplier"
            tick={{ fontSize: 11, fill: "#667085" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#667085" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}${metric.unit}`}
          />
          <Tooltip
            content={<CustomTooltip metric={metric} />}
            cursor={{ fill: "#f2f4f7", radius: 6 }}
          />
          <Bar
            dataKey={activeMetric}
            radius={[6, 6, 0, 0]}
            maxBarSize={52}
          >
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? metric.color : `${metric.color}70`}
              />
            ))}
            <LabelList
              dataKey={activeMetric}
              position="top"
              formatter={(v: unknown) => `${v}${metric.unit}`}
              style={{ fontSize: 11, fontWeight: 700, fill: "#344054" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
