"use client";

import React from "react";
import { ArrowRightLeft, Clock, Truck, CheckCircle } from "lucide-react";
import { DistributionStats } from "./types";
import { Card, CardContent } from "@/components/ui/card";

export default function DistributionSummaryCards({ stats }: { stats: DistributionStats }) {
  const cards = [
    { label: "Total Transfers", value: stats.total,     icon: ArrowRightLeft },
    { label: "Pending",         value: stats.pending,   icon: Clock },
    { label: "In Transit",      value: stats.inTransit, icon: Truck },
    { label: "Completed",       value: stats.completed, icon: CheckCircle },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map(({ label, value, icon: Icon }, i) => (
        <Card key={label} className={`border-border ${i === 0 ? "bg-foreground" : ""}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${i === 0 ? "bg-background/15" : "bg-muted"}`}>
              <Icon className={`w-4 h-4 ${i === 0 ? "text-background" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${i === 0 ? "text-background" : "text-foreground"}`}>{value}</p>
              <p className={`text-xs ${i === 0 ? "text-background/70" : "text-muted-foreground"}`}>{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
