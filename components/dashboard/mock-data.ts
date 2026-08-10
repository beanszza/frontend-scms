// ─── Dashboard Mock Data ────────────────────────────────────────────────────
// Color palette aligned with Orders & Procurement page:
//   green  #16a34a  → Passed / Completed
//   red    #dc2626  → Cancelled
//   rose   #e11d48  → Rejected
//   blue   #2563eb  → primary / brand accent
//   yellow #ca8a04  → warnings / lead time
//   purple #7c3aed  → secondary accent

export const lastCompiledAt = "2026-07-17T08:30:00+08:00";

// I. KPI Cards
export const kpiData = {
  activeInventory: { value: 4_821, unit: "SKUs", trend: +6.4 },
  lowStockAlerts: { value: 37, unit: "Items", trend: +12.1 },
  productionBatches: { value: 128, unit: "Batches", trend: -3.2 },
  activeSuppliers: { value: 54, unit: "Suppliers", trend: +2.0 },
};

// II. Inventory Distribution (Pie)
export const inventoryDistribution = [
  { name: "Raw Materials", value: 1_420, color: "#2563eb" },
  { name: "Work-In-Progress", value: 860, color: "#7c3aed" },
  { name: "Finished Goods", value: 1_950, color: "#16a34a" },
  { name: "Packaging", value: 391, color: "#ca8a04" },
  { name: "Consumables", value: 200, color: "#e11d48" },
];

// III. Procurement Trend (Line – 6 months)
export const procurementTrend = [
  { month: "Feb", orders: 82, valueK: 420 },
  { month: "Mar", orders: 95, valueK: 510 },
  { month: "Apr", orders: 71, valueK: 380 },
  { month: "May", orders: 110, valueK: 620 },
  { month: "Jun", orders: 103, valueK: 570 },
  { month: "Jul", orders: 128, valueK: 710 },
];

// IV. Production Quality (Donut) — Passed / Rejected / Cancelled
export const productionQuality = [
  { name: "Passed", value: 108, color: "#16a34a" },
  { name: "Rejected", value: 11, color: "#e11d48" },
  { name: "Cancelled", value: 9, color: "#dc2626" },
];

// V. Supplier Performance (Grouped Bar)
export const supplierPerformance = [
  { supplier: "Apex Corp", avgLeadDays: 4, onTimeRate: 96, defectRate: 0.8 },
  { supplier: "BioSource", avgLeadDays: 7, onTimeRate: 88, defectRate: 2.1 },
  { supplier: "ChemPlus", avgLeadDays: 5, onTimeRate: 92, defectRate: 1.3 },
  { supplier: "Dexter Ltd", avgLeadDays: 9, onTimeRate: 79, defectRate: 3.5 },
  { supplier: "EcoPack", avgLeadDays: 3, onTimeRate: 98, defectRate: 0.4 },
];

// VI. Distribution Analytics — batches received + transfers per branch
export const distributionAnalytics = [
  { branch: "Main Warehouse", transfers: 210, batchesReceived: 94 },
  { branch: "North Branch", transfers: 145, batchesReceived: 61 },
  { branch: "South Branch", transfers: 98, batchesReceived: 42 },
  { branch: "East Hub", transfers: 174, batchesReceived: 78 },
  { branch: "West Depot", transfers: 63, batchesReceived: 29 },
  { branch: "Central Store", transfers: 189, batchesReceived: 85 },
];

// VII-A. Procurement AI Recommendations (Table)
export interface ProcurementRec {
  id: string;
  item: string;
  supplier: string;
  recommendedQty: number;
  unit: string;
  urgency: "High" | "Medium" | "Low";
  reason: string;
}

export const procurementRecommendations: ProcurementRec[] = [
  {
    id: "PR-001",
    item: "Polypropylene Resin",
    supplier: "Apex Corp",
    recommendedQty: 500,
    unit: "kg",
    urgency: "High",
    reason: "Stock below safety level; 14-day lead time",
  },
  {
    id: "PR-002",
    item: "Corrugated Boxes (L)",
    supplier: "EcoPack",
    recommendedQty: 2_000,
    unit: "pcs",
    urgency: "Medium",
    reason: "Demand forecast +22% next 30 days",
  },
  {
    id: "PR-003",
    item: "Industrial Lubricant",
    supplier: "ChemPlus",
    recommendedQty: 120,
    unit: "liters",
    urgency: "Low",
    reason: "Preventive replenishment before quarter-end",
  },
  {
    id: "PR-004",
    item: "Stainless Steel Bolts M12",
    supplier: "BioSource",
    recommendedQty: 5_000,
    unit: "pcs",
    urgency: "High",
    reason: "Critical BOM component; current stock ≤ 3 days",
  },
  {
    id: "PR-005",
    item: "Shrink Wrap Film",
    supplier: "EcoPack",
    recommendedQty: 300,
    unit: "rolls",
    urgency: "Medium",
    reason: "Seasonal packaging spike anticipated",
  },
];

// VII-B. Inventory Forecast AI Recommendations
export interface InventoryForecast {
  sku: string;
  item: string;
  currentStock: number;
  unit: string;
  forecastedDemand: number;
  daysRemaining: number;
  urgency: "High" | "Medium" | "Low";
}

export const inventoryForecasts: InventoryForecast[] = [
  {
    sku: "SKU-1042",
    item: "Polypropylene Resin",
    currentStock: 80,
    unit: "kg",
    forecastedDemand: 320,
    daysRemaining: 6,
    urgency: "High",
  },
  {
    sku: "SKU-2310",
    item: "Corrugated Boxes (M)",
    currentStock: 450,
    unit: "pcs",
    forecastedDemand: 800,
    daysRemaining: 17,
    urgency: "Medium",
  },
  {
    sku: "SKU-0815",
    item: "Steel Bolts M12",
    currentStock: 120,
    unit: "pcs",
    forecastedDemand: 900,
    daysRemaining: 4,
    urgency: "High",
  },
  {
    sku: "SKU-3301",
    item: "Lubricant ISO 46",
    currentStock: 95,
    unit: "liters",
    forecastedDemand: 110,
    daysRemaining: 26,
    urgency: "Low",
  },
  {
    sku: "SKU-4402",
    item: "Shrink Wrap Film",
    currentStock: 210,
    unit: "rolls",
    forecastedDemand: 300,
    daysRemaining: 21,
    urgency: "Medium",
  },
  {
    sku: "SKU-5571",
    item: "Adhesive Labels",
    currentStock: 30,
    unit: "boxes",
    forecastedDemand: 200,
    daysRemaining: 3,
    urgency: "High",
  },
];
