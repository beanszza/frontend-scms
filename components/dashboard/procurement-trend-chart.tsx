"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { procurementTrend } from "./mock-data";

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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-theme-md min-w-[140px]">
        <p className="text-theme-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-theme-xs text-gray-600 dark:text-gray-300">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: p.color }}
              />
              {p.name}
            </span>
            <span className="text-theme-xs font-bold text-gray-900 dark:text-white">
              {p.name === "Order Value (₱K)" ? `₱${p.value}K` : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function ProcurementTrendChart() {
  return (
    <div className="bg-white dark:bg-gray-dark rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-theme-xs">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-theme-xl font-bold text-gray-800 dark:text-white/90">
            Procurement Trend
          </h3>
          <p className="text-theme-xs text-gray-400 mt-0.5">
            6-month purchasing activity overview
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 text-theme-xs font-medium">
            Feb – Jul 2026
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={procurementTrend}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e4e7ec"
            className="dark:stroke-gray-700"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#667085" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: "#667085" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: "#667085" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-theme-xs text-gray-600 dark:text-gray-400">
                {value}
              </span>
            )}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="orders"
            name="Purchase Orders"
            stroke="#465fff"
            strokeWidth={2.5}
            dot={{ fill: "#465fff", r: 4, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="valueK"
            name="Order Value (₱K)"
            stroke="#12b76a"
            strokeWidth={2.5}
            strokeDasharray="5 3"
            dot={{ fill: "#12b76a", r: 4, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
