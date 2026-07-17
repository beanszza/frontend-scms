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
  const trendColor = isPositive ? "text-success-600" : "text-error-500";
  const trendBg = isPositive ? "bg-success-50" : "bg-error-50";

  return (
    <div className="bg-white dark:bg-gray-dark rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-theme-xs hover:shadow-theme-md transition-shadow duration-200 flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-theme-xs font-medium ${trendBg} ${trendColor}`}
        >
          <TrendIcon size={12} />
          {Math.abs(trend)}%
        </span>
      </div>

      {/* Value */}
      <div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white/90 tracking-tight">
          {value.toLocaleString()}
        </p>
        <p className="text-theme-xs text-gray-400 mt-0.5 font-medium uppercase tracking-wide">
          {unit}
        </p>
      </div>

      {/* Title */}
      <div className={`h-0.5 w-8 rounded-full ${accentColor}`} />
      <p className="text-theme-sm font-semibold text-gray-700 dark:text-gray-300 -mt-2">
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
        icon={<Package size={20} className="text-brand-600" />}
        iconBg="bg-brand-50 dark:bg-brand-500/10"
        accentColor="bg-brand-500"
      />
      <KpiCard
        title="Low Stock Alerts"
        value={kpiData.lowStockAlerts.value}
        unit={kpiData.lowStockAlerts.unit}
        trend={kpiData.lowStockAlerts.trend}
        icon={<AlertTriangle size={20} className="text-error-600" />}
        iconBg="bg-error-50 dark:bg-error-500/10"
        accentColor="bg-error-500"
      />
      <KpiCard
        title="Production Batches"
        value={kpiData.productionBatches.value}
        unit={kpiData.productionBatches.unit}
        trend={kpiData.productionBatches.trend}
        icon={<Factory size={20} className="text-theme-purple-500" />}
        iconBg="bg-purple-50 dark:bg-purple-500/10"
        accentColor="bg-theme-purple-500"
      />
      <KpiCard
        title="Active Suppliers"
        value={kpiData.activeSuppliers.value}
        unit={kpiData.activeSuppliers.unit}
        trend={kpiData.activeSuppliers.trend}
        icon={<Handshake size={20} className="text-success-600" />}
        iconBg="bg-success-50 dark:bg-success-500/10"
        accentColor="bg-success-500"
      />
    </div>
  );
}
