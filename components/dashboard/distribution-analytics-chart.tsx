"use client";

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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 shadow-theme-md min-w-[180px]">
        <p className="text-theme-xs font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-4 rounded-sm bg-blue-600 inline-block" />
          {label}
        </p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-6 mb-0.5">
            <span className="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ background: p.color }}
              />
              {p.name}
            </span>
            <span className="text-theme-xs font-bold text-gray-900 dark:text-white">
              {p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function DistributionAnalyticsChart() {
  const topBranch = sorted[0];

  return (
    <div className="bg-white dark:bg-gray-dark rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-theme-xs">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-theme-xl font-bold text-gray-800 dark:text-white/90">
            Distribution Analytics
          </h3>
          <p className="text-theme-xs text-gray-400 mt-0.5">
            Batches received &amp; transfer count · ranked by volume
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-theme-xs font-semibold">
          All Branches
        </span>
      </div>

      {/* Top receiver callout */}
      <div className="mb-4 mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20">
        <span className="text-lg">🏆</span>
        <div>
          <p className="text-theme-xs font-bold text-yellow-800 dark:text-yellow-300">
            Top Receiver — {topBranch.branch}
          </p>
          <p className="text-theme-xs text-yellow-700 dark:text-yellow-400">
            {topBranch.batchesReceived} batches received · {topBranch.transfers} transfers
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
          barCategoryGap="28%"
          barGap={3}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e4e7ec"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#667085" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="branch"
            tick={{ fontSize: 11, fill: "#667085" }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb", radius: 4 }} />
          <Legend
            iconType="square"
            iconSize={10}
            formatter={(value) => (
              <span className="text-theme-xs text-gray-600 dark:text-gray-400">{value}</span>
            )}
          />
          <Bar
            dataKey="batchesReceived"
            name="Batches Received"
            fill="#2563eb"
            radius={[0, 4, 4, 0]}
          >
            <LabelList
              dataKey="batchesReceived"
              position="right"
              style={{ fontSize: 11, fill: "#667085", fontWeight: 600 }}
            />
          </Bar>
          <Bar
            dataKey="transfers"
            name="Transfers"
            fill="#16a34a"
            radius={[0, 4, 4, 0]}
          >
            <LabelList
              dataKey="transfers"
              position="right"
              style={{ fontSize: 11, fill: "#667085", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
