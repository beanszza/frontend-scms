"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { inventoryDistribution } from "./mock-data";

const RADIAN = Math.PI / 180;

function CustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.06) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-theme-md">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: item.payload.color }}
          />
          <span className="text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
            {item.name}
          </span>
        </div>
        <p className="text-theme-sm font-bold text-gray-900 dark:text-white mt-0.5">
          {item.value.toLocaleString()} SKUs
        </p>
      </div>
    );
  }
  return null;
}

export default function InventoryDistributionChart() {
  const total = inventoryDistribution.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white dark:bg-gray-dark rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-theme-xs">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-theme-xl font-bold text-gray-800 dark:text-white/90">
            Inventory Distribution
          </h3>
          <p className="text-theme-xs text-gray-400 mt-0.5">
            {total.toLocaleString()} total SKUs · by category
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-theme-xs font-semibold">
          Live
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={inventoryDistribution}
            cx="50%"
            cy="48%"
            outerRadius={100}
            dataKey="value"
            labelLine={false}
            label={CustomLabel as unknown as boolean}
            strokeWidth={2}
            stroke="#fff"
          >
            {inventoryDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
