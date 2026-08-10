"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingDown, TrendingUp, ShoppingCart, Package } from "lucide-react";

type InventoryItem = {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  status: "Critical" | "Low" | "Normal";
};

const rawMaterials: InventoryItem[] = [
  { id: 1, name: "Ube (Purple Yam)",   unit: "kg",     currentStock: 45,  minStock: 100, status: "Critical" },
  { id: 2, name: "White Sugar",        unit: "kg",     currentStock: 120, minStock: 50,  status: "Normal"   },
  { id: 3, name: "Brown Sugar",        unit: "kg",     currentStock: 15,  minStock: 30,  status: "Critical" },
  { id: 4, name: "Condensed Milk",     unit: "liters", currentStock: 35,  minStock: 20,  status: "Normal"   },
  { id: 5, name: "Evaporated Milk",    unit: "liters", currentStock: 8,   minStock: 15,  status: "Low"      },
  { id: 6, name: "Butter (Unsalted)",  unit: "kg",     currentStock: 25,  minStock: 10,  status: "Normal"   },
  { id: 7, name: "Coconut Milk",       unit: "liters", currentStock: 40,  minStock: 25,  status: "Normal"   },
  { id: 8, name: "Vanilla Extract",    unit: "liters", currentStock: 5,   minStock: 2,   status: "Normal"   },
  { id: 9, name: "All-Purpose Flour",  unit: "kg",     currentStock: 10,  minStock: 40,  status: "Critical" },
];

const toolsAndSupplies: InventoryItem[] = [
  { id: 1, name: "Mixing Bowl (Large)", unit: "pcs",  currentStock: 3,  minStock: 5,  status: "Low"      },
  { id: 2, name: "Electric Mixer",      unit: "pcs",  currentStock: 2,  minStock: 2,  status: "Normal"   },
  { id: 3, name: "Baking Trays",        unit: "pcs",  currentStock: 10, minStock: 8,  status: "Normal"   },
  { id: 4, name: "Measuring Cups",      unit: "sets", currentStock: 4,  minStock: 4,  status: "Normal"   },
  { id: 5, name: "Silicone Spatula",    unit: "pcs",  currentStock: 2,  minStock: 6,  status: "Critical" },
];

const finishedProducts: InventoryItem[] = [
  { id: 1, name: "Ube Halaya Jar (200g)", unit: "jars",  currentStock: 80, minStock: 50, status: "Normal"   },
  { id: 2, name: "Ube Halaya Jar (500g)", unit: "jars",  currentStock: 12, minStock: 30, status: "Critical" },
  { id: 3, name: "Ube Pastillas Box",     unit: "boxes", currentStock: 25, minStock: 20, status: "Normal"   },
];

type TabKey = "raw" | "tools" | "finished";

const tabs: { key: TabKey; label: string }[] = [
  { key: "raw",      label: "Raw Materials"    },
  { key: "tools",    label: "Tools & Supplies" },
  { key: "finished", label: "Finished Products"},
];

const tabData: Record<TabKey, { items: InventoryItem[]; title: string; subtitle: string }> = {
  raw:      { items: rawMaterials,     title: "Raw Materials Inventory",     subtitle: `Current stock levels for ${rawMaterials.length} items`     },
  tools:    { items: toolsAndSupplies, title: "Tools & Supplies Inventory",  subtitle: `Current stock levels for ${toolsAndSupplies.length} items`  },
  finished: { items: finishedProducts, title: "Finished Products Inventory", subtitle: `Current stock levels for ${finishedProducts.length} items`  },
};

function getStockPercent(current: number, min: number) {
  return Math.min(Math.round((current / min) * 100), 300);
}

function StatusBadge({ status }: { status: InventoryItem["status"] }) {
  const styles = {
    Critical: "text-red-600",
    Low: "text-amber-600",
    Normal: "text-green-600",
  };
  return (
    <span className={`flex items-center gap-1.5 text-sm font-semibold ${styles[status]}`}>
      {status === "Critical" && <AlertCircle className="w-4 h-4" />}
      {status === "Low" && <TrendingDown className="w-4 h-4" />}
      {status === "Normal" && <TrendingUp className="w-4 h-4" />}
      {status}
    </span>
  );
}

function StatCard({ label, count, lowStock }: { label: string; count: number; lowStock: number }) {
  return (
    <div className="flex-1 bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {lowStock > 0 && (
          <span className="px-3 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
            {lowStock} Low Stock
          </span>
        )}
      </div>
      <p className="text-4xl font-bold text-foreground mt-3 mb-1">{count}</p>
      <p className="text-sm text-muted-foreground">Total Items</p>
    </div>
  );
}

function InventoryTable({ items, title, subtitle }: { items: InventoryItem[]; title: string; subtitle: string }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["ITEM NO.", "ITEM NAME", "UNIT", "CURRENT STOCK", "MIN STOCK", "STOCK LEVEL", "STATUS", "ACTIONS"].map((col) => (
                <th key={col} className="px-6 py-3.5 text-left text-xs font-bold text-muted-foreground tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm font-semibold text-muted-foreground">
                  No Results Found
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const pct = getStockPercent(item.currentStock, item.minStock);
                const barPct = Math.min(pct, 100);
                const barColor = item.status === "Critical" ? "bg-red-500" : item.status === "Low" ? "bg-amber-500" : "bg-green-500";
                const stockColor = item.status === "Critical" ? "text-red-600" : item.status === "Low" ? "text-amber-600" : "text-green-600";
                return (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-foreground">{idx + 1}</td>
                    <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.unit}</td>
                    <td className={`px-6 py-4 font-bold ${stockColor}`}>{item.currentStock}</td>
                    <td className="px-6 py-4 text-foreground">{item.minStock}</td>
                    <td className="px-6 py-4">
                      <div className="w-24">
                        <div className="bg-muted rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4">
                      {item.status !== "Normal" && (
                        <Button className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg">
                          <ShoppingCart className="w-4 h-4" />
                          Order Now
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ViewInventory() {
  const [activeTab, setActiveTab] = useState<TabKey>("raw");

  const rawLowStock      = rawMaterials.filter((i) => i.status !== "Normal").length;
  const toolsLowStock    = toolsAndSupplies.filter((i) => i.status !== "Normal").length;
  const finishedLowStock = finishedProducts.filter((i) => i.status !== "Normal").length;

  const { items, title, subtitle } = tabData[activeTab];

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg animate-page-in">

      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">Inventory Management</h1>
        <p className="text-body-sm text-muted-foreground mt-1">
          Real-time stock levels (view-only, auto-updated from orders and production)
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-muted">
        <Package className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Auto-Updated Inventory</p>
          <p className="text-sm text-foreground mt-1">
            Stock levels automatically increase when orders arrive and decrease when production batches are created.
            This is a view-only dashboard for monitoring.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="flex flex-col sm:flex-row gap-4">
        <StatCard label="Raw Materials"     count={rawMaterials.length}     lowStock={rawLowStock} />
        <StatCard label="Tools & Supplies"  count={toolsAndSupplies.length} lowStock={toolsLowStock} />
        <StatCard label="Finished Products" count={finishedProducts.length} lowStock={finishedLowStock} />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-blue-600 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <InventoryTable items={items} title={title} subtitle={subtitle} />
    </div>
  );
}
