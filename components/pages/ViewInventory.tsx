"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { InventoryItem } from "@/components/inventory/types";
import InventorySummaryCards from "@/components/inventory/InventorySummaryCards";
import InventoryTable from "@/components/inventory/InventoryTable";

export default function ViewInventory() {
  const auth = useAuth();
  const user = auth?.user;
  const isAuth =
    user?.username === "scmsuser" || user?.username === "ERP-ADMIN" ||
    user?.email === "scmsuser@r3b2p.com" || user?.email === "admin@r3b2p.com" || user?.roles?.includes("Admin");

  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("Raw Materials");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    "Raw Materials": 0,
    "Tools": 0,
    "Finished Goods": 0,
  });

  const fetchInventories = async () => {
    try {
      const categoryFilter =
        activeTab === "Raw Materials" ? "Raw Material" :
        activeTab === "Tools" ? "Tool" :
        activeTab === "Finished Goods" ? "Finished Good" : "";
      const url = categoryFilter
        ? `/api/scms/api/Inventories?categoryName=${categoryFilter}&page=${page}&pageSize=10`
        : `/api/scms/api/Inventories?page=${page}&pageSize=10`;
      const res = await api.get(url);
      if (res.data.success) {
        setInventories(res.data.data.items || res.data.data || []);
        setTotalPages(res.data.data.totalPages || 1);
        const count = res.data.data.totalCount || res.data.data.length || 0;
        setTotalCount(count);
        setCategoryCounts((prev) => ({ ...prev, [activeTab]: count }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchInventories(); }, [activeTab, page]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const categories = [
          { tab: "Raw Materials", filter: "Raw Material" },
          { tab: "Tools", filter: "Tool" },
          { tab: "Finished Goods", filter: "Finished Good" },
        ];
        const counts = { ...categoryCounts };
        await Promise.all(
          categories.map(async (cat) => {
            const res = await api.get(`/api/scms/api/Inventories?categoryName=${cat.filter}&page=1&pageSize=1`);
            if (res.data?.success) {
              counts[cat.tab] = res.data.data.totalCount || res.data.data.items?.length || res.data.data.length || 0;
            }
          })
        );
        setCategoryCounts(counts);
      } catch (e) { console.error(e); }
    };
    fetchCounts();
  }, []);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl animate-page-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor real-time warehouse stocks, raw materials, and finished goods</p>
        </div>
        <div className="flex items-center gap-3">
          {isAuth && (
            <Link href="/reports?tab=inventory" className="flex items-center gap-2 rounded-xl bg-card border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              <FileText size={16} /> Reports
            </Link>
          )}
        </div>
      </div>

      <InventorySummaryCards counts={categoryCounts} />

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }} className="mb-6">
        <TabsList>
          <TabsTrigger value="Raw Materials">Raw Materials</TabsTrigger>
          <TabsTrigger value="Tools">Tools & Supplies</TabsTrigger>
          <TabsTrigger value="Finished Goods">Finished Goods</TabsTrigger>
        </TabsList>
      </Tabs>

      <InventoryTable items={inventories} currentPage={page} pageSize={10} />
      <Pagination currentPage={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
    </div>
  );
}
