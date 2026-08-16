"use client";

import React from "react";
import { DistributionStats } from "./types";

export default function DistributionSummaryCards({ stats }: { stats: DistributionStats }) {
  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Total Transfers</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{stats.total}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Pending</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{stats.pending}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">In Transit</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{stats.inTransit}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Completed</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{stats.completed}</h2>
      </div>
    </div>
  );
}
