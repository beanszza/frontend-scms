"use client";

import {
  procurementRecommendations,
  inventoryForecasts,
  type ProcurementRec,
  type InventoryForecast,
} from "./mock-data";
import { Bot, Zap, TrendingUp } from "lucide-react";

// ── Urgency badge ──────────────────────────────────────────────────────────────
function UrgencyBadge({ level }: { level: "High" | "Medium" | "Low" }) {
  const styles: Record<string, string> = {
    High: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
    Medium:
      "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
    Low: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-theme-xs font-semibold ${styles[level]}`}
    >
      {level}
    </span>
  );
}

// ── Procurement AI Table ───────────────────────────────────────────────────────
function ProcurementRecommendationCard() {
  return (
    <div className="bg-white dark:bg-gray-dark rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-theme-xs">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
          <Bot size={16} className="text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h3 className="text-theme-sm font-bold text-gray-800 dark:text-white/90">
            AI Procurement Recommendations
          </h3>
          <p className="text-theme-xs text-gray-400">
            Auto-generated · {procurementRecommendations.length} suggestions
          </p>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-theme-xs font-medium animate-pulse">
          AI
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {["ID", "Item", "Supplier", "Qty", "Urgency", "Reason"].map(
                (h) => (
                  <th
                    key={h}
                    className="py-2 pr-4 text-theme-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {procurementRecommendations.map((rec: ProcurementRec) => (
              <tr
                key={rec.id}
                className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-2.5 pr-4 text-theme-xs font-mono font-semibold text-brand-500">
                  {rec.id}
                </td>
                <td className="py-2.5 pr-4 text-theme-xs font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                  {rec.item}
                </td>
                <td className="py-2.5 pr-4 text-theme-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {rec.supplier}
                </td>
                <td className="py-2.5 pr-4 text-theme-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {rec.recommendedQty.toLocaleString()} {rec.unit}
                </td>
                <td className="py-2.5 pr-4">
                  <UrgencyBadge level={rec.urgency} />
                </td>
                <td className="py-2.5 text-theme-xs text-gray-400 dark:text-gray-500 max-w-[220px]">
                  {rec.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Inventory Forecast Cards ───────────────────────────────────────────────────
function InventoryForecastCard() {
  const urgencyOrder = { High: 0, Medium: 1, Low: 2 };
  const sorted = [...inventoryForecasts].sort(
    (a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
  );

  return (
    <div className="bg-white dark:bg-gray-dark rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-theme-xs">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-theme-purple-500/10 flex items-center justify-center">
          <TrendingUp size={16} className="text-theme-purple-500" />
        </div>
        <div>
          <h3 className="text-theme-sm font-bold text-gray-800 dark:text-white/90">
            AI Inventory Demand Forecast
          </h3>
          <p className="text-theme-xs text-gray-400">
            30-day forward projection · sorted by urgency
          </p>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-theme-purple-500/10 text-theme-purple-500 text-theme-xs font-medium animate-pulse">
          AI
        </span>
      </div>

      {/* Forecast Items */}
      <div className="space-y-2.5">
        {sorted.map((fc: InventoryForecast) => {
          const fillPct = Math.min(
            100,
            Math.round((fc.currentStock / fc.forecastedDemand) * 100)
          );
          const barColor =
            fc.urgency === "High"
              ? "#f04438"
              : fc.urgency === "Medium"
                ? "#fdb022"
                : "#12b76a";

          return (
            <div
              key={fc.sku}
              className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-theme-xs font-mono text-gray-400">
                      {fc.sku}
                    </span>
                    <UrgencyBadge level={fc.urgency} />
                  </div>
                  <p className="text-theme-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5 truncate">
                    {fc.item}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-theme-xs font-bold text-gray-800 dark:text-gray-200">
                    {fc.currentStock.toLocaleString()}{" "}
                    <span className="font-normal text-gray-400">
                      / {fc.forecastedDemand.toLocaleString()} {fc.unit}
                    </span>
                  </p>
                  <p className="text-theme-xs text-gray-400 mt-0.5">
                    ~{fc.daysRemaining}d remaining
                  </p>
                </div>
              </div>

              {/* Stock progress bar */}
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${fillPct}%`, background: barColor }}
                />
              </div>
              <p className="text-theme-xs text-gray-400 mt-1">
                {fillPct}% stock coverage
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Combined export ────────────────────────────────────────────────────────────
export default function AiRecommendations() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ProcurementRecommendationCard />
      <InventoryForecastCard />
    </div>
  );
}
