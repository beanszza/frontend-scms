"use client";

import React, { useEffect, useState } from "react";
import { Package, AlertCircle, TrendingUp, ShoppingCart, MoreHorizontal, FileText } from "lucide-react";
import api from "../lib/api";
import Link from "next/link";
import Pagination from "@/components/Pagination";

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
  maxStockLevel: number;
  isLowStock: boolean;
};

export default function ViewInventory() {
  const [inventories, setInventories] = useState<InventoryResponse[]>([]);
  const [activeTab, setActiveTab] = useState("Raw Materials");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    "Raw Materials": 0,
    "Tools": 0,
    "Finished Goods": 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  const fetchInventories = async () => {
    setIsLoading(true);
    try {
      const categoryFilter =
        activeTab === "Raw Materials" ? "Raw Material" :
          activeTab === "Tools" ? "Tool" :
            activeTab === "Finished Goods" ? "Finished Good" :
              "";
      const url = categoryFilter
        ? `/api/scms/api/Inventories?categoryName=${categoryFilter}&page=${page}&pageSize=10`
        : `/api/scms/api/Inventories?page=${page}&pageSize=10`;
      const res = await api.get(url);
      if (res.data.success) {
        setInventories(res.data.data.items || res.data.data || []);
        setTotalPages(res.data.data.totalPages || 1);
        const count = res.data.data.totalCount || res.data.data.length || 0;
        setTotalCount(count);
        if (activeTab !== "Reports") {
          setCategoryCounts(prev => ({ ...prev, [activeTab]: count }));
        }
      }
    } catch (error) {
      console.error("Error fetching inventories", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, [activeTab, page]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const categories = [
          { tab: "Raw Materials", filter: "Raw Material" },
          { tab: "Tools", filter: "Tool" },
          { tab: "Finished Goods", filter: "Finished Good" }
        ];

        const counts = { ...categoryCounts };

        await Promise.all(categories.map(async (cat) => {
          const res = await api.get(`/api/scms/api/Inventories?categoryName=${cat.filter}&page=1&pageSize=1`);
          if (res.data?.success) {
            counts[cat.tab] = res.data.data.totalCount || res.data.data.items?.length || res.data.data.length || 0;
          }
        }));

        setCategoryCounts(counts);
      } catch (e) {
        console.error("Error fetching initial counts", e);
      }
    };
    fetchCounts();
  }, []);

  // For the active tab, we use the fetched inventories. 
  // Inactive tabs will temporarily show 0 since we're now paginating from the backend.
  const rawMaterials = activeTab === "Raw Materials" ? inventories : [];
  const tools = activeTab === "Tools" ? inventories : [];
  const finishedGoods = activeTab === "Finished Goods" ? inventories : [];

  const tabs = [
    { name: "Raw Materials", data: rawMaterials },
    { name: "Tools", data: tools },
    { name: "Finished Goods", data: finishedGoods }
  ];

  const currentTabItems = tabs.find(t => t.name === activeTab)?.data || [];

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-gray-900 p-4 sm:p-6 transition-colors">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Real-time stock levels (view-only, auto-updated from orders and production)</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/reports?tab=inventory" className="flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-black dark:text-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FileText size={18} /> Reports
          </Link>
        </div>
      </div>


      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        {tabs.map((tab) => {
          const totalItems = categoryCounts[tab.name] || 0;
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
        {["Raw Materials", "Tools", "Finished Goods"].map((tabName) => (
          <button
            key={tabName}
            onClick={() => { setActiveTab(tabName); setPage(1); }}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === tabName
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            {tabName}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {activeTab === "Reports" ? "Inventory Report" : `${activeTab} Inventory`}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeTab === "Reports" ? `Total records: ${totalCount}` : `Current stock levels for ${totalCount} items`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            {activeTab === "Reports" ? (
              <>
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Item No.</th>
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Current Stock Quantity</th>
                    <th className="px-6 py-4">Minimum Stock Level</th>
                    <th className="px-6 py-4">Stock Status</th>
                    <th className="px-6 py-4">Unit of Measure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-500">Loading report data...</td>
                    </tr>
                  ) : inventories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                        No Data Found
                      </td>
                    </tr>
                  ) : (
                    inventories.map((inv, index) => {
                      const status = inv.currentStock <= inv.minStockLevel * 0.5
                        ? "Critical"
                        : inv.currentStock <= inv.minStockLevel
                          ? "Low"
                          : "Normal";

                      const badgeStyles = {
                        Critical: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
                        Low: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
                        Normal: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
                      };

                      return (
                        <tr key={inv.inventoryId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                            {(page - 1) * 10 + index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {inv.itemName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {inv.categoryName}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                            {inv.currentStock}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {inv.minStockLevel}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${badgeStyles[status]}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {inv.uomName}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </>
            ) : (
              <>
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Item No.</th>
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Min Stock</th>
                    <th className="px-6 py-4">Stock Level</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-gray-500">Loading inventory data...</td>
                    </tr>
                  ) : currentTabItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                        No Results Found
                      </td>
                    </tr>
                  ) : (
                    currentTabItems.map((inv, index) => {
                      const percentage = inv.maxStockLevel > 0
                        ? Math.min(100, Math.round((inv.currentStock / inv.maxStockLevel) * 100))
                        : (inv.currentStock > 0 ? 100 : 0);

                      let stockLevelLabel = "High";
                      let barColor = "bg-green-500";
                      let textColor = "text-green-600 dark:text-green-400";

                      if (percentage <= 40 || inv.currentStock === 0) {
                        stockLevelLabel = "Low";
                        barColor = "bg-red-600";
                        textColor = "text-red-600 dark:text-red-400";
                      } else if (percentage <= 70) {
                        stockLevelLabel = "Medium";
                        barColor = "bg-yellow-500";
                        textColor = "text-yellow-600 dark:text-yellow-400";
                      }

                      const isCritical = stockLevelLabel === "Low";

                      return (
                        <tr key={inv.inventoryId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                            {(page - 1) * 10 + index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {inv.itemName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {inv.uomName}
                          </td>
                          <td className={`px-6 py-4 text-sm font-bold ${textColor}`}>
                            {inv.currentStock}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {inv.minStockLevel}
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-24 h-2 mb-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className={`h-full ${barColor}`} style={{ width: `${percentage}%` }}></div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {stockLevelLabel} ({percentage}%)
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
                          <td className="px-6 py-4 text-center relative">
                            {isCritical && (
                              <div className="relative inline-block text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownId(activeDropdownId === inv.inventoryId ? null : inv.inventoryId);
                                  }}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                                >
                                  <MoreHorizontal size={18} />
                                </button>
                                {activeDropdownId === inv.inventoryId && (
                                  <div className="absolute right-[40px] top-[10px] z-[9999] w-36 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl py-1.5 focus:outline-none text-left">
                                    <Link href="/orders-procurement">
                                      <button className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-[#ea580c] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <ShoppingCart size={14} /> Order Now
                                      </button>
                                    </Link>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </>
            )}
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
