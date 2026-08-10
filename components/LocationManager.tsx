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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="w-full overflow-x-auto min-h-[300px]">
        <table className="w-full text-xs relative">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              {["LOCATION NO.", "NAME", "TYPE", "ADDRESS", "STATUS", "ACTIONS"].map(h => (
                <th key={h} className={`px-4 py-3 font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap ${h === 'ACTIONS' ? 'text-center' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                  No Results Found
                </td>
              </tr>
            ) : (
              locations.map(l => (
                <tr key={l.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors relative">
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{l.id}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">{l.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      {l.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{l.address}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${l.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
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
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {activeDropdownId === l.id && dropdownPosition && createPortal(
                      <>
                        <div
                          className="fixed inset-0 z-[9998] cursor-default"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(null);
                          }}
                        />
                        <div className="absolute z-[9999] w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1.5 border border-gray-200 dark:border-gray-700 text-left"
                             style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}>
                          <button onClick={() => { onView(l); setActiveDropdownId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Eye size={14} className="text-blue-500" /> View Details
                          </button>
                          <button onClick={() => { onEdit(l); setActiveDropdownId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Edit2 size={14} className="text-blue-500" /> Edit
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