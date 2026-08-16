"use client";

import React from "react";
import { Recipe } from "./types";

export default function RecipeSummaryCards({ recipes }: { recipes: Recipe[] }) {
  const activeCount = recipes.filter((r) => r.isActive).length;
  const inactiveCount = recipes.filter((r) => !r.isActive).length;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Total Recipes</p>
        <h3 className="mt-1 text-2xl font-bold text-foreground">{recipes.length}</h3>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Active Recipes</p>
        <h3 className="mt-1 text-2xl font-bold text-foreground">{activeCount}</h3>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Inactive Recipes</p>
        <h3 className="mt-1 text-2xl font-bold text-foreground">{inactiveCount}</h3>
      </div>
    </div>
  );
}
