"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { productionQuality } from "./mock-data";

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
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
          {item.value} Batches
        </p>
      </div>
    );
  }
  return null;
}

export default function ProductionQualityChart() {
  const total = productionQuality.reduce((s, d) => s + d.value, 0);
  const passed = productionQuality.find((d) => d.name === "Passed")?.value ?? 0;
  const passRate = Math.round((passed / total) * 100);

  // Badge styles matching Orders & Procurement palette
  const badgeStyle: Record<string, { bg: string; text: string }> = {
    Passed:    { bg: "bg-green-100 dark:bg-green-900/40",  text: "text-green-700 dark:text-green-400" },
    Rejected:  { bg: "bg-rose-100 dark:bg-rose-900/40",   text: "text-rose-700 dark:text-rose-400" },
    Cancelled: { bg: "bg-red-100 dark:bg-red-900/40",     text: "text-red-700 dark:text-red-400" },
  };

  return (
    <div className="bg-white dark:bg-gray-dark rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-theme-xs">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-theme-xl font-bold text-gray-800 dark:text-white/90">
            Production Quality
          </h3>
          <p className="text-theme-xs text-gray-400 mt-0.5">
            {total} total batches · current period
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-theme-xs font-semibold">
          In Cycle
        </span>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie
            data={productionQuality}
            cx="50%"
            cy="46%"
            innerRadius={68}
            outerRadius={98}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={2}
            stroke="#fff"
          >
            {productionQuality.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-theme-xs text-gray-600 dark:text-gray-400">{value}</span>
            )}
          />
          {/* Center pass-rate label */}
          <text
            x="50%"
            y="43%"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={26}
            fontWeight={700}
            fill="#101828"
          >
            {passRate}%
          </text>
          <text
            x="50%"
            y="51%"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={500}
            fill="#98a2b3"
          >
            Pass Rate
          </text>
        </PieChart>
      </ResponsiveContainer>

      {/* Stat row — Passed / Rejected / Cancelled */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {productionQuality.map((d) => {
          const style = badgeStyle[d.name] ?? { bg: "bg-gray-100", text: "text-gray-700" };
          return (
            <div
              key={d.name}
              className={`rounded-xl p-3 text-center ${style.bg}`}
            >
              <p className={`text-xl font-bold ${style.text}`}>{d.value}</p>
              <p className={`text-theme-xs font-semibold mt-0.5 ${style.text} opacity-80`}>
                {d.name}
              </p>
              <p className="text-theme-xs text-gray-400 mt-0.5">
                {Math.round((d.value / total) * 100)}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
