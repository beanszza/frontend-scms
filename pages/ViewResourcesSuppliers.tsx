"use client";

import React, { useState, useEffect } from "react";


function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

function useColors(isDark: boolean) {
  return {
    pageBg:        isDark ? "#101828" : "#f9fafb",
    cardBg:        isDark ? "#1d2939" : "#ffffff",
    cardBorder:    isDark ? "#344054" : "#e5e7eb",
    rowDivider:    isDark ? "#1f2d40" : "#f3f4f6",
    headingText:   isDark ? "#f9fafb" : "#111827",
    bodyText:      isDark ? "#d0d5dd" : "#374151",
    mutedText:     isDark ? "#98a2b3" : "#6b7280",
    colHeader:     isDark ? "#667085" : "#6b7280",
    tableRowHover: isDark ? "#1a2535" : "#f9fafb",
    bannerBg:      isDark ? "#0d1f3c" : "#eff6ff",
    bannerBorder:  isDark ? "#1e3a6e" : "#bfdbfe",
    bannerTitle:   isDark ? "#93c5fd" : "#1d4ed8",
    bannerText:    isDark ? "#60a5fa" : "#2563eb",
    badgeBg:       isDark ? "#3b1f1f" : "#fee2e2",
    badgeText:     isDark ? "#fca5a5" : "#dc2626",
    tabActive:     isDark ? "#60a5fa" : "#2563eb",
    tabInactive:   isDark ? "#667085" : "#6b7280",
    tabBorder:     isDark ? "#344054" : "#e5e7eb",
    barBg:         isDark ? "#344054" : "#e5e7eb",
  };
}


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

function getStockColor(status: InventoryItem["status"]) {
  if (status === "Critical") return "#ef4444";
  if (status === "Low")      return "#f59e0b";
  return "#22c55e";
}

function getBarColor(status: InventoryItem["status"]) {
  if (status === "Critical") return "#ef4444";
  if (status === "Low")      return "#f59e0b";
  return "#22c55e";
}


function StatusBadge({ status }: { status: InventoryItem["status"] }) {
  const color = getStockColor(status);
  const label = status === "Critical" ? "Critical" : status === "Low" ? "Low" : "Normal";
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, color, fontWeight: 600, fontSize: 15 }}>
      {status === "Critical" && (
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      )}
      {status === "Low" && (
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {status === "Normal" && (
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <polyline points="1 18 8.5 10.5 13.5 15.5 23 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {label}
    </span>
  );
}


function StatCard({ label, count, lowStock, c }: {
  label: string; count: number; lowStock: number;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <div style={{
      background: c.cardBg,
      borderRadius: 12,
      border: `1px solid ${c.cardBorder}`,
      padding: "20px 24px",
      flex: 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: c.headingText }}>{label}</span>
        {lowStock > 0 && (
          <span style={{
            padding: "3px 12px",
            borderRadius: 999,
            background: c.badgeBg,
            color: c.badgeText,
            fontSize: 13,
            fontWeight: 600,
          }}>
            {lowStock} Low Stock
          </span>
        )}
      </div>
      <p style={{ fontSize: 40, fontWeight: 700, color: c.headingText, margin: "12px 0 4px" }}>{count}</p>
      <p style={{ fontSize: 14, color: c.mutedText }}>Total Items</p>
    </div>
  );
}


function InventoryTable({ items, title, subtitle, c }: {
  items: InventoryItem[]; title: string; subtitle: string;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <div style={{ background: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}`, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${c.cardBorder}` }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: c.headingText, margin: 0 }}>{title}</h2>
        <p style={{ fontSize: 14, color: c.mutedText, marginTop: 4 }}>{subtitle}</p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${c.cardBorder}` }}>
              {["ITEM ID", "ITEM NAME", "UNIT", "CURRENT STOCK", "MIN STOCK", "STOCK LEVEL", "STATUS", "ACTIONS"].map((col) => (
                <th key={col} style={{
                  padding: "14px 24px",
                  textAlign: "left",
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.colHeader,
                  letterSpacing: "0.07em",
                  whiteSpace: "nowrap",
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const pct    = getStockPercent(item.currentStock, item.minStock);
              const barPct = Math.min(pct, 100);
              return (
                <tr key={item.id} style={{
                  borderBottom: idx < items.length - 1 ? `1px solid ${c.rowDivider}` : "none",
                  background: c.cardBg,
                }}>
                  <td style={{ padding: "18px 24px", color: c.bodyText, fontSize: 15 }}>{item.id}</td>
                  <td style={{ padding: "18px 24px", fontWeight: 500, color: c.headingText, whiteSpace: "nowrap", fontSize: 15 }}>{item.name}</td>
                  <td style={{ padding: "18px 24px", color: c.mutedText, fontSize: 15 }}>{item.unit}</td>
                  <td style={{ padding: "18px 24px", color: getStockColor(item.status), fontWeight: 700, fontSize: 15 }}>{item.currentStock}</td>
                  <td style={{ padding: "18px 24px", color: c.bodyText, fontSize: 15 }}>{item.minStock}</td>
                  <td style={{ padding: "18px 24px" }}>
                    <div style={{ width: 100 }}>
                      <div style={{ background: c.barBg, borderRadius: 999, height: 7 }}>
                        <div style={{ height: 7, borderRadius: 999, width: `${barPct}%`, backgroundColor: getBarColor(item.status) }} />
                      </div>
                      <p style={{ fontSize: 12, color: c.mutedText, marginTop: 3 }}>{pct}%</p>
                    </div>
                  </td>
                  <td style={{ padding: "18px 24px" }}>
                    <StatusBadge status={item.status} />
                  </td>
                  <td style={{ padding: "18px 24px" }}>
                    {item.status !== "Normal" && (
                      <button style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "9px 18px",
                        background: "#f97316",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 600,
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}>
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Order Now
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default function ViewInventory() {
  const isDark = useDarkMode();
  const c      = useColors(isDark);

  const [activeTab, setActiveTab] = useState<TabKey>("raw");

  const rawLowStock      = rawMaterials.filter((i)     => i.status !== "Normal").length;
  const toolsLowStock    = toolsAndSupplies.filter((i) => i.status !== "Normal").length;
  const finishedLowStock = finishedProducts.filter((i) => i.status !== "Normal").length;

  const { items, title, subtitle } = tabData[activeTab];

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: c.headingText, margin: 0 }}>Inventory Management</h1>
        <p style={{ fontSize: 15, color: c.mutedText, marginTop: 6 }}>
          Real-time stock levels (view-only, auto-updated from orders and production)
        </p>
      </div>

      {/* Info Banner */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: 16, borderRadius: 12,
        border: `1px solid ${c.bannerBorder}`,
        background: c.bannerBg,
      }}>
        <svg style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2 }} fill="none" viewBox="0 0 24 24" stroke={c.bannerTitle}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: c.bannerTitle, margin: 0 }}>Auto-Updated Inventory</p>
          <p style={{ fontSize: 14, color: c.bannerText, marginTop: 5 }}>
            Stock levels automatically increase when orders arrive and decrease when production batches are created.
            This is a view-only dashboard for monitoring.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 16 }}>
        <StatCard label="Raw Materials"     count={rawMaterials.length}     lowStock={rawLowStock}      c={c} />
        <StatCard label="Tools & Supplies"  count={toolsAndSupplies.length} lowStock={toolsLowStock}    c={c} />
        <StatCard label="Finished Products" count={finishedProducts.length} lowStock={finishedLowStock} c={c} />
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${c.tabBorder}` }}>
        <div style={{ display: "flex" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "13px 22px",
                fontSize: 15,
                fontWeight: 500,
                border: "none",
                borderBottom: activeTab === tab.key ? `2px solid ${c.tabActive}` : "2px solid transparent",
                color: activeTab === tab.key ? c.tabActive : c.tabInactive,
                background: "transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <InventoryTable items={items} title={title} subtitle={subtitle} c={c} />

    </div>
  );
}