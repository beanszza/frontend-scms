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
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: item.payload.color }}
          />
          <span className="text-xs font-semibold text-foreground">
            {item.name}
          </span>
        </div>
        <p className="text-sm font-bold text-foreground mt-0.5">
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
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground/90">
            Inventory Distribution
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total.toLocaleString()} total SKUs · by category
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-muted text-foreground text-xs font-semibold">
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
              <span className="text-xs text-foreground">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
