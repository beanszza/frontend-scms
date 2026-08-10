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
    High: "bg-error-50 text-error-700",
    Medium:
      "bg-warning-50 text-warning-700",
    Low: "bg-success-50 text-success-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[level]}`}
    >
      {level}
    </span>
  );
}

// ── Procurement AI Table ───────────────────────────────────────────────────────
function ProcurementRecommendationCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Bot size={16} className="text-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground/90">
            AI Procurement Recommendations
          </h3>
          <p className="text-xs text-muted-foreground">
            Auto-generated · {procurementRecommendations.length} suggestions
          </p>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-foreground text-xs font-medium animate-pulse">
          AI
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["ID", "Item", "Supplier", "Qty", "Urgency", "Reason"].map(
                (h) => (
                  <th
                    key={h}
                    className="py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
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
                className="border-b border-border/60 hover:bg-muted transition-colors"
              >
                <td className="py-2.5 pr-4 text-xs font-mono font-semibold text-foreground">
                  {rec.id}
                </td>
                <td className="py-2.5 pr-4 text-xs font-medium text-foreground whitespace-nowrap">
                  {rec.item}
                </td>
                <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                  {rec.supplier}
                </td>
                <td className="py-2.5 pr-4 text-xs font-semibold text-foreground whitespace-nowrap">
                  {rec.recommendedQty.toLocaleString()} {rec.unit}
                </td>
                <td className="py-2.5 pr-4">
                  <UrgencyBadge level={rec.urgency} />
                </td>
                <td className="py-2.5 text-xs text-muted-foreground max-w-[220px]">
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
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <TrendingUp size={16} className="text-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground/90">
            AI Inventory Demand Forecast
          </h3>
          <p className="text-xs text-muted-foreground">
            30-day forward projection · sorted by urgency
          </p>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-foreground text-xs font-medium animate-pulse">
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
              className="rounded-xl border border-border p-3 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {fc.sku}
                    </span>
                    <UrgencyBadge level={fc.urgency} />
                  </div>
                  <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                    {fc.item}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">
                    {fc.currentStock.toLocaleString()}{" "}
                    <span className="font-normal text-muted-foreground">
                      / {fc.forecastedDemand.toLocaleString()} {fc.unit}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ~{fc.daysRemaining}d remaining
                  </p>
                </div>
              </div>

              {/* Stock progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${fillPct}%`, background: barColor }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
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
