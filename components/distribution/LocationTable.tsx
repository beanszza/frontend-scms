"use client";

import React, { useState } from "react";
import { MoreHorizontal, Pencil, Eye } from "lucide-react";
import { LocationItem } from "./types";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface LocationTableProps {
  locations: LocationItem[];
  onEdit: (loc: LocationItem) => void;
  onView: (loc: LocationItem) => void;
}

export default function LocationTable({ locations, onEdit, onView }: LocationTableProps) {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">LOCATION NAME</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">TYPE</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ADDRESS</th>
            <th className="px-3 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
            <th className="px-3 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {locations.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
                No Locations Found
              </td>
            </tr>
          ) : (
            locations.map((loc) => (
              <tr key={loc.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-3 font-semibold text-foreground whitespace-nowrap">{loc.name}</td>
                <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{loc.type}</td>
                <td className="px-3 py-3 text-muted-foreground">{loc.address}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={loc.status} />
                </td>
                <td className="px-3 py-3 text-center relative">
                  <button
                    type="button"
                    onClick={() => setActiveDropdownId(activeDropdownId === loc.id ? null : loc.id)}
                    className="p-1.5 rounded-lg text-foreground hover:bg-muted transition-colors focus:outline-none"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {activeDropdownId === loc.id && (
                    <div className="absolute right-10 top-2 z-[100] w-36 rounded-xl border border-border bg-card shadow-xl py-1.5 text-left">
                      <button
                        type="button"
                        onClick={() => { onEdit(loc); setActiveDropdownId(null); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil size={14} className="shrink-0" /> Edit Location
                      </button>
                      <button
                        type="button"
                        onClick={() => { onView(loc); setActiveDropdownId(null); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Eye size={14} className="shrink-0" /> View Details
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
