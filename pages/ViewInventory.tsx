"use client";

import React, { useEffect, useState } from "react";
import { Package, AlertCircle, TrendingUp, ShoppingCart } from "lucide-react";
import api from "../lib/api";
import Link from "next/link";

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

export default function ViewInventory() {
  const [inventories, setInventories] = useState<InventoryResponse[]>([]);
  const [activeTab, setActiveTab] = useState("Raw Materials");
  const [isLoading, setIsLoading] = useState(true);

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

  const rawMaterials = inventories.filter(i => i.categoryName.toLowerCase().includes("raw material"));
  const tools = inventories.filter(i => i.categoryName.toLowerCase().includes("tool") || i.categoryName.toLowerCase().includes("equipment"));
  const finishedGoods = inventories.filter(i => i.categoryName.toLowerCase().includes("finished good") || i.categoryName.toLowerCase().includes("product"));

  const tabs = [
    { name: "Raw Materials", data: rawMaterials },
    { name: "Tools", data: tools },
    { name: "Finished Goods", data: finishedGoods }
  ];

  const currentTabItems = tabs.find(t => t.name === activeTab)?.data || [];

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-gray-900 p-4 sm:p-6 transition-colors">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Inventory Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Real-time stock levels (view-only, auto-updated from orders and production)
        </p>
      </div>


      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        {tabs.map((tab) => {
          const totalItems = tab.data.length;
          const lowStockCount = tab.data.filter(i => i.isLowStock || i.currentStock <= i.minStockLevel).length;

          return (
            <div key={tab.name} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 relative">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900 dark:text-white">{tab.name}</h3>
                {lowStockCount > 0 && (
                  <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold text-xs px-2 py-0.5 rounded">
                    {lowStockCount} Low Stock
                  </span>
                )}
              </div>
              <div className="mt-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{totalItems}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Items</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 flex gap-6 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === tab.name
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{activeTab} Inventory</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Current stock levels for {currentTabItems.length} items
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr className="text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Item ID</th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Min Stock</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">Loading inventory data...</td>
                </tr>
              ) : currentTabItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">No inventory found for this category.</td>
                </tr>
              ) : (
                currentTabItems.map((inv) => {
                  const isCritical = inv.currentStock <= inv.minStockLevel || inv.isLowStock;
                  const percent = inv.minStockLevel > 0 ? Math.round((inv.currentStock / inv.minStockLevel) * 100) : 100;
                  const barWidth = Math.min(100, percent);

                  return (
                    <tr key={inv.inventoryId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                        {inv.itemId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {inv.itemName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {inv.uomName}
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {inv.currentStock}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {inv.minStockLevel}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full ${isCritical ? 'bg-red-600' : 'bg-green-600'}`}
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {percent}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isCritical ? (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-red-600 dark:text-red-400">
                            <AlertCircle size={16} /> Critical
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-green-600 dark:text-green-400">
                            <TrendingUp size={16} /> Normal
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isCritical && (
                          <Link href="/orders-procurement">
                            <button className="bg-[#ea580c] hover:bg-[#c2410c] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                              <ShoppingCart size={14} /> Order Now
                            </button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
