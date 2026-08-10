"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Edit2, Eye } from "lucide-react";

type Location = {
  id: string;
  name: string;
  type: string;
  address: string;
  status: string;
};

export default function LocationManagement({ locations, onView, onEdit }: { locations: Location[], onView: (l: Location) => void, onEdit: (l: Location) => void }) {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="w-full overflow-x-auto min-h-[300px]">
        <table className="w-full text-xs relative">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["LOCATION NO.", "NAME", "TYPE", "ADDRESS", "STATUS", "ACTIONS"].map(h => (
                <th key={h} className={`px-4 py-3 font-bold text-muted-foreground tracking-wider whitespace-nowrap ${h === 'ACTIONS' ? 'text-center' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
                  No Results Found
                </td>
              </tr>
            ) : (
              locations.map(l => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors relative">
                  <td className="px-4 py-3 font-bold text-foreground">{l.id}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{l.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-muted text-foreground">
                      {l.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-[200px] truncate">{l.address}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${l.status === 'Active' ? 'bg-foreground text-background border-foreground' : 'bg-muted/30 text-muted-foreground border-border opacity-75'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center relative">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (activeDropdownId === l.id) {
                          setActiveDropdownId(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const leftPos = rect.right - 144 + window.scrollX;
                          setDropdownPosition({
                            top: rect.bottom + window.scrollY,
                            left: Math.max(8, leftPos)
                          });
                          setActiveDropdownId(l.id); 
                        }
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {activeDropdownId === l.id && dropdownPosition && createPortal(
                      <>
                        <div
                          className="fixed inset-0 z-[199] cursor-default"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(null);
                          }}
                        />
                        <div className="absolute z-[200] w-36 bg-card rounded-xl shadow-xl py-1.5 border border-border text-left"
                             style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}>
                          <button onClick={() => { onView(l); setActiveDropdownId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted">
                            <Eye size={14} className="text-foreground" /> View Details
                          </button>
                          <button onClick={() => { onEdit(l); setActiveDropdownId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted">
                            <Edit2 size={14} className="text-foreground" /> Edit
                          </button>
                        </div>
                      </>,
                      document.body
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
}