"use client";

import React from "react";

interface InventorySummaryCardsProps {
  counts: Record<string, number>;
}

export default function InventorySummaryCards({ counts }: InventorySummaryCardsProps) {
  const total = Object.values(counts).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Total Inventory Items</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{total}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Raw Materials</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{counts["Raw Materials"] || 0}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Tools & Supplies</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{counts["Tools"] || 0}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Finished Goods</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{counts["Finished Goods"] || 0}</h2>
      </div>
    </div>
  );
}
