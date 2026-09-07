"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SupplyItem, Supplier, Recipe, FinishedProduct } from "@/components/resources-suppliers/types";
import SupplyTab from "@/components/resources-suppliers/SupplyTab";
import SupplierTab from "@/components/resources-suppliers/SupplierTab";
import RecipeTab from "@/components/resources-suppliers/RecipeTab";
import SupplyModal from "@/components/resources-suppliers/SupplyModal";
import SupplyDetailsModal from "@/components/resources-suppliers/SupplyDetailsModal";
import SupplierModal from "@/components/resources-suppliers/SupplierModal";
import SupplierDetailsModal from "@/components/resources-suppliers/SupplierDetailsModal";
import RecipeModal from "@/components/resources-suppliers/RecipeModal";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ResourcesSuppliersPage() {
  const auth = useAuth();
  const user = auth?.user;
  const isAuth =
    user?.username === "scmsuser" || user?.username === "ERP-ADMIN" ||
    user?.email === "scmsuser@r3b2p.com" || user?.email === "admin@r3b2p.com" || user?.roles?.includes("Admin");

  const [activeTab, setActiveTab] = useState<"supply" | "supplier" | "recipe">("supply");
  const [supplyData, setSupplyData] = useState<SupplyItem[]>([]);
  const [supplierData, setSupplierData] = useState<Supplier[]>([]);
  const [recipeData, setRecipeData] = useState<Recipe[]>([]);
  const [finishedProductData, setFinishedProductData] = useState<FinishedProduct[]>([]);

  // Search & Filter State
  const [supplyFilter, setSupplyFilter] = useState("All");
  const [supplyStatusFilter, setSupplyStatusFilter] = useState("All");
  const [supplySearchQuery, setSupplySearchQuery] = useState("");
  const [supplyPage, setSupplyPage] = useState(1);

  const [supplierFilter, setSupplierFilter] = useState("All");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [supplierPage, setSupplierPage] = useState(1);

  const [recipeFilter, setRecipeFilter] = useState("All");
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");
  const [recipePage, setRecipePage] = useState(1);

  // Modals & Selected Items
  const [openSupplyModal, setOpenSupplyModal] = useState(false);
  const [editingSupply, setEditingSupply] = useState<SupplyItem | null>(null);
  const [viewSupply, setViewSupply] = useState<SupplyItem | null>(null);
  const [openSupplierModal, setOpenSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [openRecipeModal, setOpenRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get(`/api/scms/api/Items?page=1&pageSize=1000`),
        api.get(`/api/scms/api/Suppliers?page=1&pageSize=1000`),
        api.get("/api/scms/api/Recipes"),
        api.get("/api/scms/api/FinishedProducts"),
      ]);
      const [itemsRes, suppliersRes, recipesRes, fpRes] = results.map((r) => (r.status === "fulfilled" ? r.value : null));
      if (itemsRes?.data?.success) {
        const rawItems = itemsRes.data.data.items || itemsRes.data.data || [];
        const suppliesOnly = rawItems.filter(
          (i: any) => i.categoryName !== "Finished Good" && i.categoryName !== "Finished Goods"
        );
        setSupplyData([...suppliesOnly].sort((a: any, b: any) => a.itemId - b.itemId));
      }
      if (suppliersRes?.data?.success) setSupplierData(suppliersRes.data.data.items || suppliersRes.data.data || []);
      if (recipesRes?.data?.success) setRecipeData((recipesRes.data.data.items || recipesRes.data.data || []).sort((a: any, b: any) => a.recipeId - b.recipeId));
      if (fpRes?.data?.success) {
        setFinishedProductData((fpRes.data.data.items || fpRes.data.data || []).sort((a: any, b: any) => a.productId - b.productId).map((p: any) => ({
          productId: p.productId, itemName: p.itemName || "", variant: p.variant || "",
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveSupply = async (data: any) => {
    try {
      const payload = {
        itemName: data.itemName, categoryId: data.categoryId, uomId: data.uomId,
        minStockLevel: data.minStock, maxStockLevel: data.maxStock, isActive: data.isActive,
      };
      let itemId: number;
      if (editingSupply) {
        await api.put(`/api/scms/api/Items/${editingSupply.itemId}`, payload);
        itemId = editingSupply.itemId;
      } else {
        const res = await api.post("/api/scms/api/Items", payload);
        itemId = res?.data?.data?.itemId || res?.data?.itemId;
      }
      // Link suppliers if any selected
      if (itemId && data.supplierIds && data.supplierIds.length > 0) {
        await Promise.allSettled(
          data.supplierIds.map((supplierId: number) =>
            api.post("/api/scms/api/SupplierItems", {
              SupplierId: supplierId,
              ItemId: itemId,
              UnitPrice: 0,
              LeadTimeDays: 3,
              PackSize: 1,
              MinOrderQuantity: 1,
              IsPreferred: false,
              IsActive: true,
            }).catch(() => {})
          )
        );
      }
      setOpenSupplyModal(false); setEditingSupply(null); fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save supply item.";
      alert(msg);
    }
  };

  const handleSaveSupplier = async (data: any) => {
    try {
      if (editingSupplier) await api.put(`/api/scms/api/Suppliers/${editingSupplier.supplierId}`, data);
      else await api.post("/api/scms/api/Suppliers", data);
      setOpenSupplierModal(false); setEditingSupplier(null); fetchData();
    } catch { alert("Failed to save supplier."); }
  };

  const handleSaveRecipe = async (data: any) => {
    try {
      const payload = {
        recipeName: data.recipeName, productId: data.productId, outputQuantity: data.outputQuantity,
        notes: data.notes, isActive: data.isActive, ingredients: data.ingredients,
      };
      if (editingRecipe) await api.put(`/api/scms/api/Recipes/${editingRecipe.recipeId}`, payload);
      else await api.post("/api/scms/api/Recipes", payload);
      setOpenRecipeModal(false); setEditingRecipe(null); fetchData();
    } catch { alert("Failed to save recipe."); }
  };

  return (
    <div className="w-full min-h-full py-8 px-6 md:px-8 space-y-6 animate-page-in">
      <PageHeader
        title="Resources & Suppliers"
        description="Manage your foundation data - Supply, Suppliers, and Recipes"
      />

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="mb-8">
        <TabsList>
          <TabsTrigger value="supply">Supply List</TabsTrigger>
          <TabsTrigger value="supplier">Supplier List</TabsTrigger>
          <TabsTrigger value="recipe">Recipe / BOM</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "supply" && (
        <SupplyTab
          supplies={supplyData} searchQuery={supplySearchQuery} onSearchChange={setSupplySearchQuery}
          categoryFilter={supplyFilter} onCategoryFilterChange={setSupplyFilter}
          statusFilter={supplyStatusFilter} onStatusFilterChange={setSupplyStatusFilter}
          currentPage={supplyPage} onPageChange={setSupplyPage} isAuthorizedForReports={!!isAuth}
          onAddNew={() => { setEditingSupply(null); setOpenSupplyModal(true); }}
          onEdit={(item) => { setEditingSupply(item); setOpenSupplyModal(true); }}
          onView={(item) => setViewSupply(item)}
        />
      )}

      {activeTab === "supplier" && (
        <SupplierTab
          suppliers={supplierData} searchQuery={supplierSearchQuery} onSearchChange={setSupplierSearchQuery}
          statusFilter={supplierFilter} onStatusFilterChange={setSupplierFilter}
          currentPage={supplierPage} onPageChange={setSupplierPage} isAuthorizedForReports={!!isAuth}
          onAddNew={() => { setEditingSupplier(null); setOpenSupplierModal(true); }}
          onEdit={(s) => { setEditingSupplier(s); setOpenSupplierModal(true); }}
          onView={(s) => setViewSupplier(s)}
        />
      )}

      {activeTab === "recipe" && (
        <RecipeTab
          recipes={recipeData} searchQuery={recipeSearchQuery} onSearchChange={setRecipeSearchQuery}
          statusFilter={recipeFilter} onStatusFilterChange={setRecipeFilter}
          currentPage={recipePage} onPageChange={setRecipePage} isAuthorizedForReports={!!isAuth}
          onAddNew={() => { setEditingRecipe(null); setOpenRecipeModal(true); }}
          onEdit={(r) => { setEditingRecipe(r); setOpenRecipeModal(true); }}
        />
      )}

      <SupplyModal
        open={openSupplyModal}
        editingItem={editingSupply}
        existingSupplies={supplyData}
        suppliers={supplierData.map((s: any) => ({ supplierId: s.supplierId, companyName: s.companyName, supplierCode: s.supplierCode }))}
        onClose={() => { setOpenSupplyModal(false); setEditingSupply(null); }}
        onSave={handleSaveSupply}
      />
      <SupplyDetailsModal
        item={viewSupply}
        onClose={() => setViewSupply(null)}
        onEdit={(item) => {
          setViewSupply(null);
          setEditingSupply(item);
          setOpenSupplyModal(true);
        }}
      />
      <SupplierModal open={openSupplierModal} editingSupplier={editingSupplier} onClose={() => { setOpenSupplierModal(false); setEditingSupplier(null); }} onSave={handleSaveSupplier} />
      <SupplierDetailsModal supplier={viewSupplier} onClose={() => setViewSupplier(null)} />
      <RecipeModal open={openRecipeModal} editingRecipe={editingRecipe} finishedProducts={finishedProductData} baseSupplies={supplyData} onClose={() => { setOpenRecipeModal(false); setEditingRecipe(null); }} onSave={handleSaveRecipe} />
    </div>
  );
}