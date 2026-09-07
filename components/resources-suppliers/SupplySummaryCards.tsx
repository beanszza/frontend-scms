"use client";

import React from "react";
import { Layers, Package, Wrench } from "lucide-react";
import { SupplyItem } from "./types";
import { Card, CardContent } from "@/components/ui/card";

export default function SupplySummaryCards({ supplies }: { supplies: SupplyItem[] }) {
  const rawMaterialsCount = supplies.filter((i) => i.categoryName === "Raw Materials").length;
  const toolsSuppliesCount = supplies.filter(
    (i) => i.categoryName === "Tools and Supplies" || i.categoryName === "Tools & Supplies"
  ).length;

  const cards = [
    { label: "Total Items", value: supplies.length, icon: Layers },
    { label: "Raw Materials", value: rawMaterialsCount, icon: Package },
    { label: "Tools & Supplies", value: toolsSuppliesCount, icon: Wrench },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
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
