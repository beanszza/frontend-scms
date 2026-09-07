"use client";

import React from "react";
import { Boxes, Layers, Wrench, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface InventorySummaryCardsProps {
  counts: Record<string, number>;
}

export default function InventorySummaryCards({ counts }: InventorySummaryCardsProps) {
  const total = Object.values(counts).reduce((acc, curr) => acc + curr, 0);

  const cards = [
    { label: "Total Items",    value: total,                        icon: Boxes },
    { label: "Raw Materials",  value: counts["Raw Materials"] || 0, icon: Layers },
    { label: "Tools & Supplies", value: counts["Tools"] || 0,       icon: Wrench },
    { label: "Finished Goods", value: counts["Finished Goods"] || 0, icon: Package },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
