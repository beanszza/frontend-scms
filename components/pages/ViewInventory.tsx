"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, AlertCircle, TrendingUp, ShoppingCart, MoreHorizontal, FileText } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";

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
  const auth = useAuth();
  const user = auth?.user;
  const isAuthorizedForReports = user?.username === "scmsuser" || user?.username === "ERP-ADMIN" || user?.email === "scmsuser@r3b2p.com" || user?.email === "admin@r3b2p.com" || user?.roles?.includes("Admin");

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
    <div className="min-h-screen bg-background p-4 sm:p-6 transition-colors">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time stock levels (view-only, auto-updated from orders and production)</p>
        </div>
        <div className="flex items-center gap-3">
          {isAuthorizedForReports && (
            <Link href="/reports?tab=inventory" className="flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              <FileText size={18} /> Reports
            </Link>
          )}
        </div>
      </div>


      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        {tabs.map((tab) => {
          const totalItems = categoryCounts[tab.name] || 0;
          const lowStockCount = tab.data.filter(i => i.isLowStock || i.currentStock <= i.minStockLevel).length;

          return (
            <div key={tab.name} className="rounded-xl border border-border bg-card p-5 relative">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-foreground">{tab.name}</h3>
                {lowStockCount > 0 && (
                  <span className="bg-red-100 text-red-600 font-semibold text-xs px-2 py-0.5 rounded">
                    {lowStockCount} Low Stock
                  </span>
                )}
              </div>
              <div className="mt-4">
                <h2 className="text-3xl font-bold text-foreground">{totalItems}</h2>
                <p className="text-xs text-muted-foreground mt-1">Total Items</p>
              </div>
            </div>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(1); }} className="mb-6">
        <TabsList>
          <TabsTrigger value="Raw Materials">Raw Materials</TabsTrigger>
          <TabsTrigger value="Tools">Tools</TabsTrigger>
          <TabsTrigger value="Finished Goods">Finished Goods</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {activeTab === "Reports" ? "Inventory Report" : `${activeTab} Inventory`}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === "Reports" ? `Total records: ${totalCount}` : `Current stock levels for ${totalCount} items`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            {activeTab === "Reports" ? (
              <>
                <thead className="bg-background/50 border-b border-border">
                  <tr className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-4">Item No.</th>
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Current Stock Quantity</th>
                    <th className="px-6 py-4">Minimum Stock Level</th>
                    <th className="px-6 py-4">Stock Status</th>
                    <th className="px-6 py-4">Unit of Measure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground">Loading report data...</td>
                    </tr>
                  ) : inventories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
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
                        Critical: "bg-foreground text-background border border-foreground font-bold",
                        Low: "bg-muted/70 text-foreground border border-muted-foreground/30 font-semibold",
                        Normal: "bg-muted text-muted-foreground border border-border",
                      };

                      return (
                        <tr key={inv.inventoryId} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-foreground">
                            {(page - 1) * 10 + index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {inv.itemName}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {inv.categoryName}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-foreground">
                            {inv.currentStock}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {inv.minStockLevel}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${badgeStyles[status]}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
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
                <thead className="bg-background/50 border-b border-border">
                  <tr className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-muted-foreground">Loading inventory data...</td>
                    </tr>
                  ) : currentTabItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
                        No Results Found
                      </td>
                    </tr>
                  ) : (
                    currentTabItems.map((inv, index) => {
                      const percentage = inv.maxStockLevel > 0
                        ? Math.min(100, Math.round((inv.currentStock / inv.maxStockLevel) * 100))
                        : (inv.currentStock > 0 ? 100 : 0);

                      let stockLevelLabel = "High";
                      let barColor = "bg-primary";
                      let textColor = "text-foreground";

                      if (percentage <= 40 || inv.currentStock === 0) {
                        stockLevelLabel = "Low";
                      } else if (percentage <= 70) {
                        stockLevelLabel = "Medium";
                      }

                      const isCritical = stockLevelLabel === "Low";

                      return (
                        <tr key={inv.inventoryId} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-foreground">
                            {(page - 1) * 10 + index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {inv.itemName}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {inv.uomName}
                          </td>
                          <td className={`px-6 py-4 text-sm font-bold ${textColor}`}>
                            {inv.currentStock}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {inv.minStockLevel}
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-24 h-2 mb-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${barColor}`} style={{ width: `${percentage}%` }}></div>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">
                              {stockLevelLabel} ({percentage}%)
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isCritical ? (
                              <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                                <AlertCircle size={16} /> Critical
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                                <TrendingUp size={16} /> Normal
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center relative">
                            {isCritical && (
                              <div className="relative inline-block text-center">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownId(activeDropdownId === inv.inventoryId ? null : inv.inventoryId);
                                  }}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
                                >
                                  <MoreHorizontal size={18} />
                                </Button>
                                {activeDropdownId === inv.inventoryId && (
                                  <div className="absolute right-[40px] top-[10px] z-[200] w-36 rounded-xl border border-border bg-card shadow-xl py-1.5 focus:outline-none text-left">
                                    <Link href="/orders-procurement">
                                      <Button className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-[#ea580c] hover:bg-muted transition-colors">
                                        <ShoppingCart size={14} /> Order Now
                                      </Button>
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
