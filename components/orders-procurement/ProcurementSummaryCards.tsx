"use client";

import React from "react";
import { Order } from "./types";

export default function ProcurementSummaryCards({ orders }: { orders: Order[] }) {
  const total = orders.length;
  const pending = orders.filter((o) => o.status === "Pending").length;
  const arrived = orders.filter((o) => o.status === "Arrived").length;
  const completed = orders.filter((o) => o.status === "Completed").length;

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Total Orders</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{total}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Pending Orders</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{pending}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Arrived / Inspected</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{arrived}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">Completed</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{completed}</h2>
      </div>
    </div>
  );
}
