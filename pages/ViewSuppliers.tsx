"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Pencil, X, Trash2 } from "lucide-react";
import api from "../lib/api";

type SupplyItem = {
  itemId: number;
  itemName: string;
  categoryName: string;
  uomName: string;
  minStockLevel: number;
  currentStock: number;
};

type Supplier = {
  supplierId: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  isActive: boolean;
};

type Ingredient = {
  id: number;
  itemId: number;
  itemName?: string;
  uomId: number;
  quantity: string;
};

type Recipe = {
  recipeId: number;
  finishedProduct: string; // Wait, backend returns ProductId and we need to display name. It might not be populated if Product isn't fetched properly.
  // Actually RecipeResponse has ProductId. Let's assume we can fetch or display it.
  productId: number;
  outputQuantity: number;
  notes: string;
  ingredients: { itemId: number; standardQuantity: number }[];
};

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[95vh] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-5 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500"><X size={22} /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default function ResourcesSuppliersPage() {
  useDarkMode();
  const [activeTab, setActiveTab] = useState<"supply" | "supplier" | "recipe">("supply");
  
  const [supplyData, setSupplyData] = useState<SupplyItem[]>([]);
  const [supplierData, setSupplierData] = useState<Supplier[]>([]);
  const [recipeData, setRecipeData] = useState<any[]>([]);
  const [finishedProductData, setFinishedProductData] = useState<any[]>([]);

  const [supplyFilter, setSupplyFilter] = useState<"All" | "Raw Materials" | "Tools and Supplies">("All");
  const [supplySearchQuery, setSupplySearchQuery] = useState("");
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");

  const [openSupplyModal, setOpenSupplyModal] = useState(false);
  const [openSupplierModal, setOpenSupplierModal] = useState(false);
  const [openRecipeModal, setOpenRecipeModal] = useState(false);

  // Form states
  const [itemName, setItemName] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [uomId, setUomId] = useState(1);
  const [minStock, setMinStock] = useState(0);

  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [productId, setProductId] = useState(1);
  const [outputQuantity, setOutputQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: Date.now(), itemId: 1, uomId: 1, quantity: "" }]);

  const [editingSupplyId, setEditingSupplyId] = useState<number | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get("/api/scms/api/Items"),
        api.get("/api/scms/api/Suppliers"),
        api.get("/api/scms/api/Recipes"),
        api.get("/api/scms/api/FinishedProducts")
      ]);

      const [itemsRes, suppliersRes, recipesRes, fpRes] = results.map(r => r.status === 'fulfilled' ? r.value : null);

      if (itemsRes?.data?.success) setSupplyData((itemsRes.data.data || []).sort((a: any, b: any) => a.itemId - b.itemId));
      if (suppliersRes?.data?.success) setSupplierData((suppliersRes.data.data || []).sort((a: any, b: any) => a.supplierId - b.supplierId));
      if (recipesRes?.data?.success) setRecipeData((recipesRes.data.data || []).sort((a: any, b: any) => a.recipeId - b.recipeId));
      if (fpRes?.data?.success) setFinishedProductData((fpRes.data.data || []).sort((a: any, b: any) => a.productId - b.productId));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSupplies = useMemo(() => {
    let result = supplyData;
    if (supplyFilter !== "All") {
      result = result.filter((item) => item.categoryName === supplyFilter || (supplyFilter === 'Tools and Supplies' && item.categoryName === 'Tools & Supplies') || ((supplyFilter as string) === 'Tools & Supplies' && item.categoryName === 'Tools and Supplies'));
    }
    if (supplySearchQuery.trim() !== "") {
      const q = supplySearchQuery.toLowerCase();
      result = result.filter((item) => item.itemName.toLowerCase().includes(q) || item.itemId.toString().includes(q));
    }
    return result;
  }, [supplyFilter, supplySearchQuery, supplyData]);

  const filteredRecipes = useMemo(() => {
    let result = recipeData;
    if (recipeSearchQuery.trim() !== "") {
      const q = recipeSearchQuery.toLowerCase();
      result = result.filter((item) => {
        const fp = finishedProductData.find(p => p.productId === item.productId);
        const name = fp ? fp.itemName.toLowerCase() : "";
        return name.includes(q) || item.recipeId.toString().includes(q) || item.productId.toString().includes(q);
      });
    }
    return result;
  }, [recipeSearchQuery, recipeData, finishedProductData]);

  // Handle Add or Edit Supply
  const handleAddSupply = async () => {
    try {
      const payload = { itemName, categoryId, uomId, minStockLevel: minStock, maxStockLevel: 9999, isActive: true };
      if (editingSupplyId) {
        await api.put(`/api/scms/api/Items/${editingSupplyId}`, payload);
      } else {
        await api.post("/api/scms/api/Items", payload);
      }
      setOpenSupplyModal(false);
      fetchData();
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.response?.data?.message || e.response?.data?.errors || e.message;
      alert("Failed to save supply: " + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg));
    }
  };

  const openEditSupply = (item: any) => {
    setEditingSupplyId(item.itemId);
    setItemName(item.itemName);
    setCategoryId(item.categoryId || 1); // Note: might need to fallback to 1 if categoryId isn't returned
    setUomId(item.uomId || 1);
    setMinStock(item.minStockLevel);
    setOpenSupplyModal(true);
  };

  const openCreateSupply = () => {
    setEditingSupplyId(null);
    setItemName("");
    setCategoryId(1);
    setUomId(1);
    setMinStock(0);
    setOpenSupplyModal(true);
  };

  // Handle Add or Edit Supplier
  const handleAddSupplier = async () => {
    try {
      const payload = { companyName, contactPerson, email, phone, isActive: true };
      if (editingSupplierId) {
        await api.put(`/api/scms/api/Suppliers/${editingSupplierId}`, payload);
      } else {
        await api.post("/api/scms/api/Suppliers", payload);
      }
      setOpenSupplierModal(false);
      fetchData();
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.response?.data?.message || e.response?.data?.errors || e.message;
      alert("Failed to save supplier: " + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg));
    }
  };

  const openEditSupplier = (supplier: any) => {
    setEditingSupplierId(supplier.supplierId);
    setCompanyName(supplier.companyName);
    setContactPerson(supplier.contactPerson);
    setEmail(supplier.email);
    setPhone(supplier.phone);
    setOpenSupplierModal(true);
  };

  const openCreateSupplier = () => {
    setEditingSupplierId(null);
    setCompanyName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setOpenSupplierModal(true);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { id: Date.now(), itemId: supplyData.length > 0 ? supplyData[0].itemId : 1, uomId: 1, quantity: "" }]);
  };

  const removeIngredient = (id: number) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const updateIngredient = (id: number, field: string, value: any) => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
  };

  // Handle Add or Edit Recipe
  const handleAddRecipe = async () => {
    try {
      const payload = {
        productId,
        outputQuantity,
        notes,
        isActive: true,
        ingredients: ingredients.map(ing => ({
          itemId: ing.itemId,
          uomId: ing.uomId,
          standardQuantity: parseFloat(ing.quantity) || 0
        }))
      };
      if (editingRecipeId) {
        await api.put(`/api/scms/api/Recipes/${editingRecipeId}`, payload);
      } else {
        await api.post("/api/scms/api/Recipes", payload);
      }
      setOpenRecipeModal(false);
      fetchData();
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.response?.data?.message || e.response?.data?.errors || e.message;
      alert("Failed to save recipe: " + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg));
    }
  };

  const openEditRecipe = (recipe: any) => {
    setEditingRecipeId(recipe.recipeId);
    setProductId(recipe.productId);
    setOutputQuantity(recipe.outputQuantity);
    setNotes(recipe.notes || "");
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      setIngredients(recipe.ingredients.map((ing: any, idx: number) => ({
        id: idx,
        itemId: ing.itemId,
        uomId: ing.uomId,
        quantity: ing.standardQuantity.toString()
      })));
    } else {
      setIngredients([{ id: Date.now(), itemId: supplyData.length > 0 ? supplyData[0].itemId : 1, uomId: 1, quantity: "" }]);
    }
    setOpenRecipeModal(true);
  };

  const openCreateRecipe = () => {
    setEditingRecipeId(null);
    setProductId(finishedProductData.length > 0 ? finishedProductData[0].productId : 1);
    setOutputQuantity(1);
    setNotes("");
    setIngredients([{ id: Date.now(), itemId: supplyData.length > 0 ? supplyData[0].itemId : 1, uomId: 1, quantity: "" }]);
    setOpenRecipeModal(true);
  };


  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#101828] p-4 sm:p-6 transition-colors">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Resources & Suppliers</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage your foundation data - Supply, Suppliers, and Recipes</p>
      </div>

      <div className="mb-8 flex gap-6 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setActiveTab("supply")} className={`pb-4 text-sm font-semibold whitespace-nowrap ${activeTab === "supply" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 dark:text-gray-400"}`}>Supply List</button>
        <button onClick={() => setActiveTab("supplier")} className={`pb-4 text-sm font-semibold whitespace-nowrap ${activeTab === "supplier" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 dark:text-gray-400"}`}>Supplier List</button>
        <button onClick={() => setActiveTab("recipe")} className={`pb-4 text-sm font-semibold whitespace-nowrap ${activeTab === "recipe" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 dark:text-gray-400"}`}>Recipe / BOM</button>
      </div>

      {activeTab === "supply" && (
        <div>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Supply List</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Raw materials and tools inventory</p>
            </div>
            <button onClick={openCreateSupply} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={18} /> Add New Supply</button>
          </div>

          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{supplyData.length}</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Raw Materials</p>
              <h2 className="mt-2 text-3xl font-bold text-blue-600">
                {supplyData.filter(i => i.categoryName === "Raw Materials").length}
              </h2>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tools & Supplies</p>
              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {supplyData.filter(i => i.categoryName === "Tools and Supplies" || i.categoryName === "Tools & Supplies").length}
              </h2>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 p-1 bg-white dark:bg-[#1D2939] border border-gray-200 dark:border-gray-700 rounded-xl overflow-x-auto w-max">
              <button 
                onClick={() => setSupplyFilter("All")} 
                className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${supplyFilter === "All" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                All
              </button>
              <button 
                onClick={() => setSupplyFilter("Raw Materials")} 
                className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${supplyFilter === "Raw Materials" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                Raw Materials
              </button>
              <button 
                onClick={() => setSupplyFilter("Tools and Supplies")} 
                className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${supplyFilter === "Tools and Supplies" || supplyFilter as any === "Tools & Supplies" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                Tools & Supplies
              </button>
            </div>
            
            <div className="relative flex-1 sm:max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search supplies..."
                value={supplySearchQuery}
                onChange={(e) => setSupplySearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] py-2.5 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4">Item ID</th><th className="px-5 py-4">Name</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Unit</th><th className="px-5 py-4">Min Stock</th><th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSupplies.map(item => (
                  <tr key={item.itemId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{item.itemId}</td>
                    <td className="px-5 py-5 text-sm font-medium text-gray-900 dark:text-white">{item.itemName}</td>
                    <td className="px-5 py-5"><span className="rounded-lg bg-blue-100 dark:bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">{item.categoryName}</span></td>
                    <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{item.uomName}</td>
                    <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{item.minStockLevel}</td>
                    <td className="px-5 py-5">
                      <button onClick={() => openEditSupply(item)} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "supplier" && (
        <div>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Management</h2></div>
            <button onClick={openCreateSupplier} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={18} /> Add Supplier</button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4">Supplier Name</th><th className="px-5 py-4">Contact Person</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Phone</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {supplierData.map(supplier => (
                  <tr key={supplier.supplierId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-5 py-5 text-sm font-semibold text-gray-900 dark:text-white">{supplier.companyName}</td>
                    <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{supplier.contactPerson}</td>
                    <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{supplier.email}</td>
                    <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{supplier.phone}</td>
                    <td className="px-5 py-5"><span className="rounded-full bg-green-100 dark:bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300">{supplier.isActive ? "Active" : "Inactive"}</span></td>
                    <td className="px-5 py-5">
                      <button onClick={() => openEditSupplier(supplier)} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "recipe" && (
        <div>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Recipes</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{recipeData.length}</h3>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Active Recipes</p>
              <h3 className="mt-2 text-3xl font-bold text-blue-600">{recipeData.filter(r => r.isActive).length}</h3>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Inactive Recipes</p>
              <h3 className="mt-2 text-3xl font-bold text-red-500">{recipeData.filter(r => !r.isActive).length}</h3>
            </div>
          </div>
          
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search by Product Name or ID..." value={recipeSearchQuery} onChange={(e) => setRecipeSearchQuery(e.target.value)} className="w-full rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] py-2.5 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none" />
            </div>
            <button onClick={openCreateRecipe} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={18} /> New Recipe</button>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4">Recipe ID</th>
                  <th className="px-5 py-4">Finished Product</th>
                  <th className="px-5 py-4">Target Yield</th>
                  <th className="px-5 py-4">Ingredients Count</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.map((recipe) => {
                  const fp = finishedProductData.find(p => p.productId === recipe.productId);
                  return (
                    <tr key={recipe.recipeId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-5 py-5 text-sm font-semibold text-gray-900 dark:text-white">{recipe.recipeId}</td>
                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{fp ? fp.itemName : `Product #${recipe.productId}`}</td>
                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{recipe.outputQuantity}</td>
                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{recipe.ingredients?.length || 0} items</td>
                      <td className="px-5 py-5">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${recipe.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}>
                          {recipe.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <button onClick={() => openEditRecipe(recipe)} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal open={openSupplyModal} title={editingSupplyId ? "Edit Supply" : "Add New Supply"} onClose={() => setOpenSupplyModal(false)}>
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Item Name</label>
            <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none">
              <option value={1}>Raw Materials</option>
              <option value={2}>Tools & Supplies</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Unit of Measurement</label>
            <select value={uomId} onChange={(e) => setUomId(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none">
              <option value={1}>kg</option>
              <option value={2}>pcs</option>
              <option value={3}>liters</option>
              <option value={4}>grams</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Minimum Stock Level</label>
            <input type="number" value={minStock} onChange={(e) => setMinStock(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setOpenSupplyModal(false)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Cancel</button>
            <button onClick={handleAddSupply} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Save</button>
          </div>
        </div>
      </Modal>

      <Modal open={openSupplierModal} title={editingSupplierId ? "Edit Supplier" : "Add New Supplier"} onClose={() => setOpenSupplierModal(false)}>
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Supplier Name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Person</label>
            <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none" />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Phone No.</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setOpenSupplierModal(false)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Cancel</button>
            <button onClick={handleAddSupplier} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Save Supplier</button>
          </div>
        </div>
      </Modal>

      <Modal open={openRecipeModal} title={editingRecipeId ? "Edit Recipe" : "Create New Recipe"} onClose={() => setOpenRecipeModal(false)}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Finished Product</label>
              <select value={productId} onChange={(e) => setProductId(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none">
                {finishedProductData.map(fp => (
                  <option key={fp.productId} value={fp.productId}>{fp.itemName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Target Yield</label>
              <input type="number" value={outputQuantity} onChange={(e) => setOutputQuantity(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none" />
            </div>
          </div>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">Ingredients List</h3></div>
            </div>
            <div className="space-y-5">
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/10 text-sm font-bold text-blue-700 dark:text-blue-300">{index + 1}</div><p className="text-sm font-semibold text-gray-900 dark:text-white">Ingredient Item</p></div>
                    {ingredients.length > 1 && (<button onClick={() => removeIngredient(ingredient.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>)}
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-6">
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Item</label>
                      <select value={ingredient.itemId} onChange={(e) => updateIngredient(ingredient.id, "itemId", Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none">
                        {supplyData.map(supply => (
                          <option key={supply.itemId} value={supply.itemId}>{supply.itemName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity</label>
                      <input type="number" placeholder="e.g. 500" value={ingredient.quantity} onChange={(e) => updateIngredient(ingredient.id, "quantity", e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Unit</label>
                      <select value={ingredient.uomId} onChange={(e) => updateIngredient(ingredient.id, "uomId", Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none">
                        <option value={1}>kg</option>
                        <option value={2}>pcs</option>
                        <option value={3}>liters</option>
                        <option value={4}>grams</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addIngredient} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300"><Plus size={18} /> Add Ingredient</button>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setOpenRecipeModal(false)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Cancel</button>
            <button onClick={handleAddRecipe} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Create Recipe</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}