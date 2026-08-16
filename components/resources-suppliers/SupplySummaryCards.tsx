"use client";

import React from "react";
import { SupplyItem } from "./types";

export default function SupplySummaryCards({ supplies }: { supplies: SupplyItem[] }) {
  const rawMaterialsCount = supplies.filter((i) => i.categoryName === "Raw Materials").length;
  const toolsSuppliesCount = supplies.filter(
    (i) => i.categoryName === "Tools and Supplies" || i.categoryName === "Tools & Supplies"
  ).length;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Total Items</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{supplies.length}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Raw Materials</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{rawMaterialsCount}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Tools & Supplies</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{toolsSuppliesCount}</h2>
      </div>
    </div>
  );
}
