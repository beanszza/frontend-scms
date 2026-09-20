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
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";

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
    <div className="w-full min-h-full py-8 px-6 md:px-8 space-y-6 animate-page-in">
      <PageHeader
        title="Inventory Management"
        description="Monitor real-time warehouse stocks, raw materials, and finished goods"
        actions={
          isAuth && (
            <Button size="sm" variant="outline" asChild className="gap-1.5">
              <Link href="/reports?tab=inventory">
                <FileText className="w-4 h-4" /> Reports
              </Link>
            </Button>
          )
        }
      />

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
