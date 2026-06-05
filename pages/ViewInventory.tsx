"use client";

import React, { useEffect, useState } from "react";
import { Package, AlertTriangle, CheckCircle, Search } from "lucide-react";
import api from "../lib/api";

type InventoryResponse = {
  inventoryId: number;
  itemId: number;
  itemName: string;
  categoryName: string;
  uomName: string;
  locationId: number;
  locationName: string;
  currentStock: number;
  minStockLevel: number;
  isLowStock: boolean;
};

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export default function ViewInventory() {
  useDarkMode();

  const [inventories, setInventories] = useState<InventoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchInventories = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/scms/api/Inventories");
      if (res.data.success) {
        setInventories(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching inventories", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  const filteredInventories = inventories.filter((i) =>
    i.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.locationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#101828] p-4 sm:p-6 transition-colors">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Current Stock Levels
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Monitor real-time inventory levels across all your locations.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Items in Stock</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {inventories.reduce((sum, item) => sum + item.currentStock, 0)}
          </h2>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Healthy Stock</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {inventories.filter((i) => !i.isLowStock).length}
          </h2>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Alerts</p>
          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {inventories.filter((i) => i.isLowStock).length}
          </h2>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item name or location..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
        <table className="w-full min-w-[800px]">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1D2939]">
              <th className="px-5 py-4">Item Name</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Location</th>
              <th className="px-5 py-4">Current Stock</th>
              <th className="px-5 py-4">Min Stock</th>
              <th className="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">Loading inventory data...</td>
              </tr>
            ) : filteredInventories.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">No inventory found.</td>
              </tr>
            ) : (
              filteredInventories.map((inv) => (
                <tr key={inv.inventoryId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-5 py-5 text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      {inv.itemName}
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    <span className="rounded-lg bg-blue-100 dark:bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {inv.categoryName}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                    {inv.locationName}
                  </td>
                  <td className="px-5 py-5 text-sm font-bold text-gray-900 dark:text-white">
                    {inv.currentStock} <span className="font-normal text-gray-500 text-xs ml-1">{inv.uomName}</span>
                  </td>
                  <td className="px-5 py-5 text-sm text-gray-500">
                    {inv.minStockLevel} {inv.uomName}
                  </td>
                  <td className="px-5 py-5">
                    {inv.isLowStock ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full w-max">
                        <AlertTriangle size={14} /> Low Stock
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full w-max">
                        <CheckCircle size={14} /> In Stock
                      </span>
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
