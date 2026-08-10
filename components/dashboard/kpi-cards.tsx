"use client";

import { kpiData } from "./mock-data";
import {
  Package,
  AlertTriangle,
  Factory,
  Handshake,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number;
  unit: string;
  trend: number;
  icon: React.ReactNode;
  iconBg: string;
  accentColor: string;
}

function KpiCard({ title, value, unit, trend, icon, iconBg, accentColor }: KpiCardProps) {
  const isPositive = trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? "text-foreground" : "text-destructive";
  const trendBg = isPositive ? "bg-success-50" : "bg-error-50";

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${trendBg} ${trendColor}`}
        >
          <TrendIcon size={12} />
          {Math.abs(trend)}%
        </span>
      </div>

      {/* Value */}
      <div>
        <p className="text-3xl font-bold text-foreground/90 tracking-tight">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">
          {unit}
        </p>
      </div>

      {/* Title */}
      <div className={`h-0.5 w-8 rounded-full ${accentColor}`} />
      <p className="text-sm font-semibold text-foreground -mt-2">
        {title}
      </p>
    </div>
  );
}

export default function KpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        title="Active Inventory"
        value={kpiData.activeInventory.value}
        unit={kpiData.activeInventory.unit}
        trend={kpiData.activeInventory.trend}
        icon={<Package size={20} className="text-foreground" />}
        iconBg="bg-muted"
        accentColor="bg-primary"
      />
      <KpiCard
        title="Low Stock Alerts"
        value={kpiData.lowStockAlerts.value}
        unit={kpiData.lowStockAlerts.unit}
        trend={kpiData.lowStockAlerts.trend}
        icon={<AlertTriangle size={20} className="text-muted-foreground" />}
        iconBg="bg-muted"
        accentColor="bg-error-500"
      />
      <KpiCard
        title="Production Batches"
        value={kpiData.productionBatches.value}
        unit={kpiData.productionBatches.unit}
        trend={kpiData.productionBatches.trend}
        icon={<Factory size={20} className="text-foreground" />}
        iconBg="bg-muted"
        accentColor="bg-theme-purple-500"
      />
      <KpiCard
        title="Active Suppliers"
        value={kpiData.activeSuppliers.value}
        unit={kpiData.activeSuppliers.unit}
        trend={kpiData.activeSuppliers.trend}
        icon={<Handshake size={20} className="text-muted-foreground" />}
        iconBg="bg-muted"
        accentColor="bg-success-500"
      />
    </div>
  );
}
