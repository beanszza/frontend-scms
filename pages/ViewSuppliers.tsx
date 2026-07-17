"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Pencil, X, Trash2, MoreHorizontal, Eye, CheckCircle, XCircle, FileText } from "lucide-react";
import Link from "next/link";
import api from "../lib/api";
import Pagination from "@/components/Pagination";

type SupplyItem = {
  itemId: number;
  itemName: string;
  categoryName: string;
  uomId: number;
  uomName: string;
  minStockLevel: number;
  maxStockLevel: number;
  currentStock: number;
  isActive: boolean;
};

type Supplier = {
  supplierId: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
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
  recipeName: string;
  finishedProduct: string; // Wait, backend returns ProductId and we need to display name. It might not be populated if Product isn't fetched properly.
  // Actually RecipeResponse has ProductId. Let's assume we can fetch or display it.
  productId: number;
  outputQuantity: number;
  notes: string;
  isActive: boolean;
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

function Modal({
  open,
  title,
  onClose,
  children,
  size = "max-w-4xl"
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full ${size} max-h-[95vh] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] flex flex-col overflow-hidden`}>
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
  const [supplyStatusFilter, setSupplyStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [supplySearchQuery, setSupplySearchQuery] = useState("");
  const [supplyPage, setSupplyPage] = useState(1);
  const [supplyTotalPages, setSupplyTotalPages] = useState(1);
  const [supplyTotalCount, setSupplyTotalCount] = useState(0);

  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");
  
  const [supplierFilter, setSupplierFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierTotalPages, setSupplierTotalPages] = useState(1);
  const [supplierTotalCount, setSupplierTotalCount] = useState(0);

  const [openSupplyModal, setOpenSupplyModal] = useState(false);
  const [openSupplierModal, setOpenSupplierModal] = useState(false);
  const [openRecipeModal, setOpenRecipeModal] = useState(false);

  const [activeDropdownSupplyId, setActiveDropdownSupplyId] = useState<number | null>(null);
  const [activeDropdownRecipeId, setActiveDropdownRecipeId] = useState<number | null>(null);

  // Form states
  const [itemName, setItemName] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [uomId, setUomId] = useState(1);
  const [minStock, setMinStock] = useState<number | string>(0);
  const [maxStock, setMaxStock] = useState<number | string>(0);
  const [supplyActive, setSupplyActive] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");

  const [productId, setProductId] = useState(1);
  const [recipeName, setRecipeName] = useState("");
  const [outputQuantity, setOutputQuantity] = useState<number | string>(1);
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: Date.now(), itemId: 1, uomId: 1, quantity: "" }]);

  const [editingSupplyId, setEditingSupplyId] = useState<number | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [recipeActive, setRecipeActive] = useState(true);
  const [recipeFilter, setRecipeFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "supply" | "supplier" | "recipe"; id: number } | null>(null);

  const [activeDropdownSupplierId, setActiveDropdownSupplierId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);

  // Validation States
  const [itemNameError, setItemNameError] = useState("");
  const [minStockError, setMinStockError] = useState("");
  const [maxStockError, setMaxStockError] = useState("");

  // Supplier Validation & State
  const [supplierActive, setSupplierActive] = useState(true);
  const [companyNameError, setCompanyNameError] = useState("");
  const [contactPersonError, setContactPersonError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");

  const handleItemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setItemName(val);
    if (!val.trim()) {
      setItemNameError("Item name is required.");
    } else if (/[!@#$%^&*(),.?":{}|<>\[\]\\/`~=+_]/.test(val)) {
      setItemNameError("no using special character");
    } else if (/\d/.test(val)) {
      setItemNameError("Item name must not contain numbers.");
    } else if (supplyData.some(item => item.itemName.trim().toLowerCase() === val.trim().toLowerCase() && item.itemId !== editingSupplyId)) {
      setItemNameError("An item with this name already exists.");
    } else {
      setItemNameError("");
    }
  };

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawVal = e.target.value;
    
    // Stop at 0 and not continue to negative
    if (rawVal.startsWith("-") || (rawVal !== "" && Number(rawVal) < 0)) {
      rawVal = "0";
    }
    
    let cleanVal = rawVal.replace(/\D/g, "");
    
    // Prevent starting with 0
    if (cleanVal.startsWith("0") && cleanVal.length > 1) {
      cleanVal = cleanVal.replace(/^0+/, "");
      if (cleanVal === "") cleanVal = "0";
    }
    
    setMinStock(cleanVal);
    
    if (!cleanVal) {
      setMinStockError("Minimum stock level is required.");
    } else {
      setMinStockError("");
      // re-validate max stock if min stock changes
      if (maxStock !== "" && Number(maxStock) < Number(cleanVal)) {
        setMaxStockError("Max stock cannot be less than min stock.");
      } else {
        setMaxStockError("");
      }
    }
  };

  const handleMaxStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawVal = e.target.value;
    
    if (rawVal.startsWith("-") || (rawVal !== "" && Number(rawVal) < 0)) {
      rawVal = "0";
    }
    
    let cleanVal = rawVal.replace(/\D/g, "");
    
    if (cleanVal.startsWith("0") && cleanVal.length > 1) {
      cleanVal = cleanVal.replace(/^0+/, "");
      if (cleanVal === "") cleanVal = "0";
    }
    
    setMaxStock(cleanVal);
    
    if (!cleanVal) {
      setMaxStockError("Maximum stock level is required.");
    } else if (Number(cleanVal) < Number(minStock)) {
      setMaxStockError("Max stock cannot be less than min stock.");
    } else {
      setMaxStockError("");
    }
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCompanyName(val);
    if (!val.trim()) {
      setCompanyNameError("Supplier Name is required.");
    } else if (/[!@#$%^&*(),.?":{}|<>\[\]\\/`~=+_]/.test(val)) {
      setCompanyNameError("no using special character");
    } else if (val.length > 100) {
      setCompanyNameError("Supplier Name cannot exceed 100 characters.");
    } else if (supplierData.some(s => s.companyName.trim().toLowerCase() === val.trim().toLowerCase() && s.supplierId !== editingSupplierId)) {
      setCompanyNameError("A supplier with this name already exists.");
    } else {
      setCompanyNameError("");
    }
  };

  const handleContactPersonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContactPerson(val);
    if (!val.trim()) {
      setContactPersonError("Contact Person is required.");
    } else if (/[!@#$%^&*(),.?":{}|<>\[\]\\/`~=+_]/.test(val)) {
      setContactPersonError("no using special character");
    } else if (val.length > 50) {
      setContactPersonError("Contact Person cannot exceed 50 characters.");
    } else if (/\d/.test(val)) {
      setContactPersonError("Contact Person must not contain numbers.");
    } else {
      setContactPersonError("");
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (!val.trim()) {
      setEmailError("Email is required.");
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(val.trim())) {
      setEmailError("Email must be a valid @gmail.com address.");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    const cleanPhone = val.replace(/[\s-]/g, "");
    if (!val.trim()) {
      setPhoneError("Phone number is required.");
    } else if (/[a-zA-Z]/.test(val)) {
      setPhoneError("Phone number must not contain letters.");
    } else if (!/^(09|\+639)\d{9}$/.test(cleanPhone)) {
      setPhoneError("Phone number must be a valid PH mobile number (e.g. 09XXXXXXXXX).");
    } else {
      setPhoneError("");
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddress(val);
    if (!val.trim()) {
      setAddressError("Address is required.");
    } else {
      setAddressError("");
    }
  };

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebsite(e.target.value);
  };

  const [recipeNameError, setRecipeNameError] = useState("");
  const handleRecipeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRecipeName(val);
    if (!val.trim()) {
      setRecipeNameError("Recipe Name is required.");
    } else {
      setRecipeNameError("");
    }
  };

  // Recipe Validation & State
  const [recipeYieldError, setRecipeYieldError] = useState("");
  const [ingredientsErrors, setIngredientsErrors] = useState<{[key: number]: string}>({});

  const handleOutputQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawVal = e.target.value;
    
    // Stop at 0 and not continue to negative
    if (rawVal.startsWith("-") || (rawVal !== "" && Number(rawVal) < 0)) {
      rawVal = "0";
    }
    
    let cleanVal = rawVal.replace(/\D/g, "");
    
    // Prevent starting with 0
    if (cleanVal.startsWith("0") && cleanVal.length > 1) {
      cleanVal = cleanVal.replace(/^0+/, "");
      if (cleanVal === "") cleanVal = "0";
    }
    
    setOutputQuantity(cleanVal);
    
    const numVal = Number(cleanVal);
    if (!cleanVal) {
      setRecipeYieldError("Target Yield is required.");
    } else if (numVal <= 0) {
      setRecipeYieldError("Target Yield must be greater than 0.");
    } else {
      setRecipeYieldError("");
    }
  };

  const handleIngredientQuantityChange = (id: number, rawVal: string) => {
    let val = rawVal;
    
    // Stop at 0 and not continue to negative
    if (val.startsWith("-") || (val !== "" && Number(val) < 0)) {
      val = "0";
    }
    
    let cleanVal = val.replace(/\D/g, "");
    
    // Prevent starting with 0
    if (cleanVal.startsWith("0") && cleanVal.length > 1) {
      cleanVal = cleanVal.replace(/^0+/, "");
      if (cleanVal === "") cleanVal = "0";
    }
    
    updateIngredient(id, "quantity", cleanVal);
    
    const parsed = parseInt(cleanVal, 10);
    if (!cleanVal) {
      setIngredientsErrors(prev => ({ ...prev, [id]: "Quantity is required." }));
    } else if (isNaN(parsed) || parsed <= 0) {
      setIngredientsErrors(prev => ({ ...prev, [id]: "Quantity must be greater than 0." }));
    } else {
      setIngredientsErrors(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const fetchData = async () => {
    try {
      const itemCat = supplyFilter === "All" ? "" : supplyFilter === "Tools and Supplies" ? "Tools" : supplyFilter;
      const suppActive = supplierFilter === "All" ? "" : supplierFilter === "Active" ? "true" : "false";

      const results = await Promise.allSettled([
        api.get(`/api/scms/api/Items?page=1&pageSize=1000`),
        api.get(`/api/scms/api/Suppliers?page=${supplierPage}&pageSize=10&supplierName=${supplierSearchQuery}&isActive=${suppActive}`),
        api.get("/api/scms/api/Recipes"),
        api.get("/api/scms/api/FinishedProducts")
      ]);

      const [itemsRes, suppliersRes, recipesRes, fpRes] = results.map(r => r.status === 'fulfilled' ? r.value : null);

      if (itemsRes?.data?.success) {
        const itemsList = itemsRes.data.data.items || itemsRes.data.data || [];
        setSupplyData(itemsList);
      }
      if (suppliersRes?.data?.success) {
        const suppliersList = suppliersRes.data.data.items || suppliersRes.data.data || [];
        setSupplierTotalPages(suppliersRes.data.data.totalPages || 1);
        setSupplierTotalCount(suppliersRes.data.data.totalCount || suppliersList.length);
        setSupplierData(suppliersList);
      }
      if (recipesRes?.data?.success) {
        const recipesList = recipesRes.data.data.items || recipesRes.data.data || [];
        setRecipeData(recipesList.sort((a: any, b: any) => a.recipeId - b.recipeId));
      }
      if (fpRes?.data?.success) {
        const fpList = fpRes.data.data.items || fpRes.data.data || [];
        setFinishedProductData(
          fpList.sort((a: any, b: any) => a.productId - b.productId).map((p: any) => ({
            ...p,
            itemName: p.itemName || "",
            variant: p.variant || ""
          }))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supplyPage, supplierPage, supplyFilter, supplierFilter, supplySearchQuery, supplierSearchQuery]);

  const baseSupplies = useMemo(() => {
    return supplyData.filter(item => 
      !finishedProductData.some(fp => fp.itemId === item.itemId || fp.itemName?.toLowerCase() === item.itemName?.toLowerCase())
    );
  }, [supplyData, finishedProductData]);

  const filteredSupplies = useMemo(() => {
    let result = baseSupplies;

    if (supplyStatusFilter === "Active") {
      result = result.filter(item => item.isActive);
    } else if (supplyStatusFilter === "Inactive") {
      result = result.filter(item => !item.isActive);
    }

    if (supplyFilter !== "All") {
      result = result.filter((item) => item.categoryName === supplyFilter || (supplyFilter === 'Tools and Supplies' && item.categoryName === 'Tools & Supplies') || ((supplyFilter as string) === 'Tools & Supplies' && item.categoryName === 'Tools and Supplies'));
    }
    if (supplySearchQuery.trim() !== "") {
      const q = supplySearchQuery.toLowerCase();
      result = result.filter((item) => item.itemName.toLowerCase().includes(q) || item.itemId.toString().includes(q));
    }
    return result.sort((a, b) => a.itemId - b.itemId);
  }, [supplyFilter, supplyStatusFilter, supplySearchQuery, baseSupplies]);

  useEffect(() => {
    setSupplyTotalCount(filteredSupplies.length);
    setSupplyTotalPages(Math.ceil(filteredSupplies.length / 10) || 1);
  }, [filteredSupplies]);

  const paginatedSupplies = useMemo(() => {
    const startIndex = (supplyPage - 1) * 10;
    return filteredSupplies.slice(startIndex, startIndex + 10);
  }, [filteredSupplies, supplyPage]);

  const filteredSuppliers = supplierData; // Filtered on backend

  const filteredRecipes = useMemo(() => {
    let result = recipeData;
    
    // Status Filter
    if (recipeFilter === "Active") {
      result = result.filter(r => r.isActive);
    } else if (recipeFilter === "Inactive") {
      result = result.filter(r => !r.isActive);
    }
    
    if (recipeSearchQuery.trim() !== "") {
      const q = recipeSearchQuery.toLowerCase();
      result = result.filter(item => {
        const fp = finishedProductData.find(p => p.productId === item.productId);
        const name = fp ? fp.itemName.toLowerCase() : "";
        return name.includes(q) || item.recipeId.toString().includes(q) || item.productId.toString().includes(q);
      });
    }
    return result;
  }, [recipeSearchQuery, recipeData, finishedProductData, recipeFilter]);

  // Handle Add or Edit Supply
  const handleAddSupply = async () => {
    let hasError = false;
    if (!itemName.trim()) {
      setItemNameError("Item name is required.");
      hasError = true;
    } else if (/[!@#$%^&*(),.?":{}|<>\[\]\\/`~=+_]/.test(itemName)) {
      setItemNameError("no using special character");
      hasError = true;
    } else if (/\d/.test(itemName)) {
      setItemNameError("Item name must not contain numbers.");
      hasError = true;
    } else if (supplyData.some(item => item.itemName.trim().toLowerCase() === itemName.trim().toLowerCase() && item.itemId !== editingSupplyId)) {
      setItemNameError("An item with this name already exists.");
      hasError = true;
    } else {
      setItemNameError("");
    }

    const minStockNum = Number(minStock);
    if (minStock === "") {
      setMinStockError("Minimum stock level is required.");
      hasError = true;
    } else if (isNaN(minStockNum) || minStockNum < 0) {
      setMinStockError("Minimum stock level cannot be negative.");
      hasError = true;
    } else {
      setMinStockError("");
    }

    const maxStockNum = Number(maxStock);
    if (maxStock === "") {
      setMaxStockError("Maximum stock level is required.");
      hasError = true;
    } else if (isNaN(maxStockNum) || maxStockNum < minStockNum) {
      setMaxStockError("Max stock cannot be less than min stock.");
      hasError = true;
    } else {
      setMaxStockError("");
    }

    if (hasError) return;

    try {
      const payload = { itemName, categoryId, uomId, minStockLevel: minStockNum, maxStockLevel: maxStockNum, isActive: supplyActive };
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
    setMaxStock(item.maxStockLevel || 0);
    setSupplyActive(item.isActive !== undefined ? item.isActive : true);
    setItemNameError("");
    setMinStockError("");
    setMaxStockError("");
    setOpenSupplyModal(true);
  };

  const openCreateSupply = () => {
    setEditingSupplyId(null);
    setItemName("");
    setCategoryId(1);
    setUomId(1);
    setMinStock(1); // default to 1
    setMaxStock(1); // default max stock
    setSupplyActive(true);
    setItemNameError("");
    setMinStockError("");
    setMaxStockError("");
    setOpenSupplyModal(true);
  };

  // Handle Add or Edit Supplier
  const handleAddSupplier = async () => {
    let hasError = false;

    // Supplier Name
    if (!companyName.trim()) {
      setCompanyNameError("Supplier Name is required.");
      hasError = true;
    } else if (/[!@#$%^&*(),.?":{}|<>\[\]\\/`~=+_]/.test(companyName)) {
      setCompanyNameError("no using special character");
      hasError = true;
    } else if (companyName.length > 100) {
      setCompanyNameError("Supplier Name cannot exceed 100 characters.");
      hasError = true;
    } else if (supplierData.some(s => s.companyName.trim().toLowerCase() === companyName.trim().toLowerCase() && s.supplierId !== editingSupplierId)) {
      setCompanyNameError("A supplier with this name already exists.");
      hasError = true;
    } else {
      setCompanyNameError("");
    }

    // Contact Person
    if (!contactPerson.trim()) {
      setContactPersonError("Contact Person is required.");
      hasError = true;
    } else if (/[!@#$%^&*(),.?":{}|<>\[\]\\/`~=+_]/.test(contactPerson)) {
      setContactPersonError("no using special character");
      hasError = true;
    } else if (contactPerson.length > 50) {
      setContactPersonError("Contact Person cannot exceed 50 characters.");
      hasError = true;
    } else if (/\d/.test(contactPerson)) {
      setContactPersonError("Contact Person must not contain numbers.");
      hasError = true;
    } else {
      setContactPersonError("");
    }

    // Email
    if (!email.trim()) {
      setEmailError("Email is required.");
      hasError = true;
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim())) {
      setEmailError("Email must be a valid @gmail.com address.");
      hasError = true;
    } else {
      setEmailError("");
    }

    // Phone
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!phone.trim()) {
      setPhoneError("Phone number is required.");
      hasError = true;
    } else if (/[a-zA-Z]/.test(phone)) {
      setPhoneError("Phone number must not contain letters.");
      hasError = true;
    } else if (!/^(09|\+639)\d{9}$/.test(cleanPhone)) {
      setPhoneError("Phone number must be a valid PH mobile number (e.g. 09XXXXXXXXX).");
      hasError = true;
    } else {
      setPhoneError("");
    }

    if (hasError) return;

    try {
      const payload = { companyName, contactPerson, email, phone, address, website, isActive: supplierActive };
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
    setAddress(supplier.address || "");
    setWebsite(supplier.website || "");
    setSupplierActive(supplier.isActive);
    setCompanyNameError("");
    setContactPersonError("");
    setEmailError("");
    setPhoneError("");
    setOpenSupplierModal(true);
  };

  const openCreateSupplier = () => {
    setEditingSupplierId(null);
    setCompanyName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setAddress("");
    setWebsite("");
    setSupplierActive(true);
    setCompanyNameError("");
    setContactPersonError("");
    setEmailError("");
    setPhoneError("");
    setOpenSupplierModal(true);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { id: Date.now(), itemId: baseSupplies.length > 0 ? baseSupplies[0].itemId : 1, uomId: 1, quantity: "" }]);
  };

  const removeIngredient = (id: number) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const updateIngredient = (id: number, field: string, value: any) => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
  };

  const handleAddRecipe = async () => {
    let hasError = false;

    // Validate Recipe Name
    if (!recipeName.trim()) {
      setRecipeNameError("Recipe Name is required.");
      hasError = true;
    } else {
      setRecipeNameError("");
    }

    // Validate Target Yield
    const targetYieldNum = Number(outputQuantity);
    if (!outputQuantity || isNaN(targetYieldNum) || targetYieldNum <= 0) {
      setRecipeYieldError("Target Yield must be greater than 0.");
      hasError = true;
    } else {
      setRecipeYieldError("");
    }

    // Validate Ingredients
    const newErrors: {[key: number]: string} = {};
    ingredients.forEach(ing => {
      const qty = parseInt(ing.quantity, 10);
      if (!ing.quantity) {
        newErrors[ing.id] = "Quantity is required.";
        hasError = true;
      } else if (isNaN(qty) || qty <= 0) {
        newErrors[ing.id] = "Quantity must be greater than 0.";
        hasError = true;
      }
    });
    setIngredientsErrors(newErrors);

    if (hasError) return;

    try {
      const payload = {
        recipeName,
        productId,
        outputQuantity: Number(outputQuantity),
        notes,
        isActive: recipeActive,
        ingredients: ingredients.map(ing => ({
          itemId: ing.itemId,
          uomId: ing.uomId,
          standardQuantity: parseInt(ing.quantity, 10) || 0
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "supply") {
        await api.delete(`/api/scms/api/Items/${deleteTarget.id}`);
        setOpenSupplyModal(false);
      } else if (deleteTarget.type === "supplier") {
        await api.delete(`/api/scms/api/Suppliers/${deleteTarget.id}`);
        setOpenSupplierModal(false);
      } else if (deleteTarget.type === "recipe") {
        await api.delete(`/api/scms/api/Recipes/${deleteTarget.id}`);
        setOpenRecipeModal(false);
      }
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchData();
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.response?.data?.message || e.response?.data?.errors || e.message;
      alert(`Failed to delete ${deleteTarget.type}: ` + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg));
    }
  };

  const openEditRecipe = (recipe: any) => {
    setEditingRecipeId(recipe.recipeId);
    setRecipeName(recipe.recipeName || "");
    setProductId(recipe.productId);
    setOutputQuantity(recipe.outputQuantity);
    setNotes(recipe.notes || "");
    setRecipeActive(recipe.isActive);
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      const fp = finishedProductData.find(p => p.productId === recipe.productId);
      const filteredIngredients = recipe.ingredients.filter((ing: any) => ing.itemId !== fp?.itemId);
      
      if (filteredIngredients.length > 0) {
        setIngredients(filteredIngredients.map((ing: any, idx: number) => ({
          id: idx,
          itemId: ing.itemId,
          uomId: ing.uomId,
          quantity: ing.standardQuantity.toString()
        })));
      } else {
        setIngredients([{ id: Date.now(), itemId: baseSupplies.length > 0 ? baseSupplies[0].itemId : 1, uomId: baseSupplies.length > 0 ? baseSupplies[0].uomId : 1, quantity: "" }]);
      }
    } else {
      setIngredients([{ id: Date.now(), itemId: baseSupplies.length > 0 ? baseSupplies[0].itemId : 1, uomId: baseSupplies.length > 0 ? baseSupplies[0].uomId : 1, quantity: "" }]);
    }
    setRecipeNameError("");
    setRecipeYieldError("");
    setIngredientsErrors({});
    setOpenRecipeModal(true);
  };

  const openCreateRecipe = () => {
    setEditingRecipeId(null);
    setRecipeName("");
    setProductId(finishedProductData.length > 0 ? finishedProductData[0].productId : 1);
    setOutputQuantity(1);
    setNotes("");
    setIngredients([{ id: Date.now(), itemId: baseSupplies.length > 0 ? baseSupplies[0].itemId : 1, uomId: baseSupplies.length > 0 ? baseSupplies[0].uomId : 1, quantity: "" }]);
    setRecipeActive(true);
    setRecipeNameError("");
    setRecipeYieldError("");
    setIngredientsErrors({});
    setOpenRecipeModal(true);
  };


  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#101828] p-4 sm:p-6 transition-colors">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">Resources & Suppliers</h1>
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
            <div className="flex items-center gap-3">
              <button onClick={openCreateSupply} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={18} /> Add New Supply</button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{baseSupplies.length}</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Raw Materials</p>
              <h2 className="mt-2 text-3xl font-bold text-blue-600">
                {baseSupplies.filter(i => i.categoryName === "Raw Materials").length}
              </h2>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tools & Supplies</p>
              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {baseSupplies.filter(i => i.categoryName === "Tools and Supplies" || i.categoryName === "Tools & Supplies").length}
              </h2>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2 p-1 bg-white dark:bg-[#1D2939] border border-gray-200 dark:border-gray-700 rounded-xl overflow-x-auto w-max">
                <button
                  onClick={() => { setSupplyFilter("All"); setSupplyPage(1); }}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${supplyFilter === "All" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  All
                </button>
                <button
                  onClick={() => { setSupplyFilter("Raw Materials"); setSupplyPage(1); }}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${supplyFilter === "Raw Materials" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  Raw Materials
                </button>
                <button
                  onClick={() => { setSupplyFilter("Tools and Supplies"); setSupplyPage(1); }}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${supplyFilter === "Tools and Supplies" || supplyFilter as any === "Tools & Supplies" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  Tools & Supplies
                </button>
              </div>

              <select
                value={supplyStatusFilter}
                onChange={(e) => { setSupplyStatusFilter(e.target.value as any); setSupplyPage(1); }}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] py-[9px] px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer h-[42px]"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="relative w-full lg:max-w-md">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                placeholder="Search supplies..."
                value={supplySearchQuery}
                onChange={(e) => { setSupplySearchQuery(e.target.value); setSupplyPage(1); }}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] py-[9px] pl-11 pr-4 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 h-[42px]"
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4">Item No.</th><th className="px-5 py-4">Name</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Unit</th><th className="px-5 py-4">Min Stock</th><th className="px-5 py-4">Max Stock</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSupplies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                      No Results Found
                    </td>
                  </tr>
                ) : (
                  paginatedSupplies.map((item, index) => (
                    <tr key={item.itemId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{index + 1 + (supplyPage - 1) * 10}</td>
                      <td className="px-5 py-5 text-sm font-medium text-gray-900 dark:text-white">{item.itemName}</td>
                      <td className="px-5 py-5"><span className="rounded-lg bg-blue-100 dark:bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">{item.categoryName}</span></td>
                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{item.uomName}</td>
                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{item.minStockLevel}</td>
                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{item.maxStockLevel}</td>
                      <td className="px-5 py-5">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isActive !== false ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300"}`}>
                          {item.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-center relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveDropdownSupplyId(activeDropdownSupplyId === item.itemId ? null : item.itemId); }} 
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {activeDropdownSupplyId === item.itemId && (
                          <div className="absolute right-[40px] top-[20px] z-[9999] w-32 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl py-1.5 focus:outline-none text-left">
                            <button
                              onClick={() => {
                                openEditSupply(item);
                                setActiveDropdownSupplyId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              Edit Supply
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            currentPage={supplyPage} 
            totalPages={supplyTotalPages} 
            totalCount={supplyTotalCount} 
            onPageChange={setSupplyPage} 
          />
        </div>
      )}

      {activeTab === "supplier" && (
        <div>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Management</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Partner directories and statuses</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={openCreateSupplier} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={18} /> Add Supplier</button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 p-1 bg-white dark:bg-[#1D2939] border border-gray-200 dark:border-gray-700 rounded-xl overflow-x-auto w-max">
              <button
                onClick={() => { setSupplierFilter("All"); setSupplierPage(1); }}
                className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${supplierFilter === "All" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                All
              </button>
              <button
                onClick={() => { setSupplierFilter("Active"); setSupplierPage(1); }}
                className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${supplierFilter === "Active" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                Active
              </button>
              <button
                onClick={() => { setSupplierFilter("Inactive"); setSupplierPage(1); }}
                className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${supplierFilter === "Inactive" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                Inactive
              </button>
            </div>

            <div className="relative w-full lg:max-w-md">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                placeholder="Search suppliers..."
                value={supplierSearchQuery}
                onChange={(e) => { setSupplierSearchQuery(e.target.value); setSupplierPage(1); }}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] py-[9px] pl-11 pr-4 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 h-[42px]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4">Supplier Name</th><th className="px-5 py-4">Contact Person</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Phone</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                      No Results Found
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map(supplier => (
                    <tr key={supplier.supplierId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-5 py-5 text-sm font-semibold text-gray-900 dark:text-white">{supplier.companyName}</td>
                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{supplier.contactPerson}</td>
                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{supplier.email}</td>
                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{supplier.phone}</td>
                      <td className="px-5 py-5">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${supplier.isActive ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300"}`}>
                          {supplier.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-center relative">
                        <div className="relative inline-block text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeDropdownSupplierId === supplier.supplierId) {
                                setActiveDropdownSupplierId(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const leftPos = rect.right - 176 + window.scrollX;
                                setDropdownPosition({
                                  top: rect.bottom + window.scrollY,
                                  left: Math.max(8, leftPos)
                                });
                                setActiveDropdownSupplierId(supplier.supplierId);
                              }
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {activeDropdownSupplierId === supplier.supplierId && dropdownPosition && createPortal(
                            <>
                              <div
                                className="fixed inset-0 z-[9998] cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownSupplierId(null);
                                }}
                              />
                              <div
                                style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
                                className="absolute w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-[9999] py-1.5 focus:outline-none text-left"
                              >
                                <button
                                  onClick={() => {
                                    openEditSupplier(supplier);
                                    setActiveDropdownSupplierId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Pencil size={14} className="text-blue-600 dark:text-blue-400" />
                                  Edit Supplier
                                </button>
                                <button
                                  onClick={() => {
                                    setViewSupplier(supplier);
                                    setActiveDropdownSupplierId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Eye size={14} className="text-blue-600 dark:text-blue-400" />
                                  View Details
                                </button>
                              </div>
                            </>,
                            document.body
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            currentPage={supplierPage} 
            totalPages={supplierTotalPages} 
            totalCount={supplierTotalCount} 
            onPageChange={setSupplierPage} 
          />
        </div>
      )}

      {activeTab === "recipe" && (
        <div>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recipe Management</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Production recipes and ingredients breakdown</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={openCreateRecipe} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={18} /> New Recipe</button>
            </div>
          </div>

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

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 p-1 bg-white dark:bg-[#1D2939] border border-gray-200 dark:border-gray-700 rounded-xl overflow-x-auto w-max">
              {(["All", "Active", "Inactive"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setRecipeFilter(tab)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${recipeFilter === tab ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:max-w-md">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                placeholder="Search by Product Name or No...."
                value={recipeSearchQuery}
                onChange={(e) => setRecipeSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] py-[9px] pl-11 pr-4 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 h-[42px]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4">Recipe No.</th>
                  <th className="px-5 py-4">Recipe Name</th>
                  <th className="px-5 py-4">Finished Product</th>
                  <th className="px-5 py-4">Target Yield</th>
                  <th className="px-5 py-4">Ingredients Count</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                      No Results Found
                    </td>
                  </tr>
                ) : (
                  filteredRecipes.map((recipe, index) => {
                    const fp = finishedProductData.find(p => p.productId === recipe.productId);
                    return (
                      <tr key={recipe.recipeId} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-5 py-5 text-sm font-semibold text-gray-900 dark:text-white">{index + 1}</td>
                        <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{recipe.recipeName}</td>
                        <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                          {fp ? `${fp.itemName}${fp.variant ? `, ${fp.variant}` : ""}` : `Product #${recipe.productId}`}
                        </td>
                        <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{recipe.outputQuantity}</td>
                        <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">{recipe.ingredients?.length || 0} items</td>
                        <td className="px-5 py-5">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${recipe.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}>
                            {recipe.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-5 text-center relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveDropdownRecipeId(activeDropdownRecipeId === recipe.recipeId ? null : recipe.recipeId); }} 
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          {activeDropdownRecipeId === recipe.recipeId && (
                            <div className="absolute right-[40px] top-[20px] z-[9999] w-32 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl py-1.5 focus:outline-none text-left">
                              <button
                                onClick={() => {
                                  openEditRecipe(recipe);
                                  setActiveDropdownRecipeId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                Edit Recipe
                              </button>
                            </div>
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
      )}

      {/* Modals */}
      <Modal open={openSupplyModal} title={editingSupplyId ? "Edit Supply" : "Add New Supply"} onClose={() => setOpenSupplyModal(false)} size="max-w-lg">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={handleItemNameChange}
              placeholder="e.g. White Sugar"
              className={`w-full rounded-xl border ${itemNameError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {itemNameError && <p className="mt-1 text-xs text-red-500">{itemNameError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value={1}>Raw Materials</option>
                <option value={2}>Tools & Supplies</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Unit of Measurement</label>
              <select value={uomId} onChange={(e) => setUomId(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value={1}>kg</option>
                <option value={2}>pcs</option>
                <option value={3}>liters</option>
                <option value={4}>m</option>
                <option value={5}>grams</option>
                <option value={6}>box</option>
                <option value={7}>pack</option>
                <option value={8}>roll</option>
                <option value={9}>bottle</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Minimum Stock Level</label>
            <input
              type="number"
              min={0}
              value={minStock}
              onChange={handleMinStockChange}
              onKeyDown={handleNumberKeyDown}
              placeholder="e.g. 10"
              className={`w-full rounded-xl border ${minStockError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {minStockError && <p className="mt-1 text-xs text-red-500">{minStockError}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Maximum Stock Level</label>
            <input
              type="number"
              min={0}
              value={maxStock}
              onChange={handleMaxStockChange}
              onKeyDown={handleNumberKeyDown}
              placeholder="e.g. 100"
              className={`w-full rounded-xl border ${maxStockError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {maxStockError && <p className="mt-1 text-xs text-red-500">{maxStockError}</p>}
          </div>
          {editingSupplyId !== null && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
              <select
                value={supplyActive ? "true" : "false"}
                onChange={(e) => setSupplyActive(e.target.value === "true")}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setOpenSupplyModal(false)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            <button onClick={handleAddSupply} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">Save</button>
          </div>
        </div>
      </Modal>

      <Modal open={openSupplierModal} title={editingSupplierId ? "Edit Supplier" : "Add New Supplier"} onClose={() => setOpenSupplierModal(false)} size="max-w-xl">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Supplier Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={companyName}
              onChange={handleCompanyNameChange}
              placeholder="e.g. Acme Supplies Ltd."
              className={`w-full rounded-xl border ${companyNameError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#101828] text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {companyNameError && <p className="mt-1 text-xs text-red-500">{companyNameError}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Person <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={contactPerson}
              onChange={handleContactPersonChange}
              placeholder="e.g. John Doe"
              className={`w-full rounded-xl border ${contactPersonError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#101828] text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {contactPersonError && <p className="mt-1 text-xs text-red-500">{contactPersonError}</p>}
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="e.g. contact@acme.com"
                className={`w-full rounded-xl border ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#101828] text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Phone No. <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="e.g. +639XXXXXXXXX"
                className={`w-full rounded-xl border ${phoneError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#101828] text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Address <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="e.g. 123 Main St, Manila"
              className={`w-full rounded-xl border ${addressError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#101828] text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {addressError && <p className="mt-1 text-xs text-red-500">{addressError}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Website (Optional)</label>
            <input
              type="text"
              value={website}
              onChange={handleWebsiteChange}
              placeholder="e.g. www.acme.com"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {editingSupplierId !== null && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Status <span className="text-red-500">*</span></label>
              <select
                value={supplierActive ? "true" : "false"}
                onChange={(e) => setSupplierActive(e.target.value === "true")}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">

            {editingSupplierId === null && (
              <button onClick={() => setOpenSupplierModal(false)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            )}
            <button onClick={handleAddSupplier} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">Save Supplier</button>
          </div>
        </div>
      </Modal>

      <Modal open={openRecipeModal} title={editingRecipeId ? "Edit Recipe" : "Create New Recipe"} onClose={() => setOpenRecipeModal(false)} size="max-w-3xl">
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Recipe Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={recipeName}
              onChange={handleRecipeNameChange}
              placeholder="e.g. Classic Burger Patty"
              className={`w-full rounded-xl border ${recipeNameError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#101828] text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {recipeNameError && <p className="mt-1 text-xs text-red-500">{recipeNameError}</p>}
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Finished Product</label>
              <select value={productId} onChange={(e) => setProductId(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                {finishedProductData.length === 0 ? (
                  <option value={0} disabled>No Finished Products Available</option>
                ) : (
                  finishedProductData.map(fp => (
                    <option key={fp.productId} value={fp.productId}>
                      {fp.itemName}{fp.variant ? `, ${fp.variant}` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Target Yield</label>
              <input 
                type="number" 
                min={0}
                value={outputQuantity} 
                onChange={handleOutputQuantityChange} 
                onKeyDown={handleNumberKeyDown}
                placeholder="e.g. 100" 
                className={`w-full rounded-xl border ${recipeYieldError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500`} 
              />
              {recipeYieldError && <p className="mt-1 text-xs text-red-500">{recipeYieldError}</p>}
            </div>
          </div>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">Ingredients List</h3></div>
            </div>
            <div className="space-y-5">
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50/50 dark:bg-gray-800/20">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/10 text-sm font-bold text-blue-700 dark:text-blue-300">{index + 1}</div><p className="text-sm font-semibold text-gray-900 dark:text-white">Ingredient Item</p></div>
                    {ingredients.length > 1 && (<button onClick={() => removeIngredient(ingredient.id)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18} /></button>)}
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-6">
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Item</label>
                      <select value={ingredient.itemId} onChange={(e) => {
                        const newId = Number(e.target.value);
                        const supply = baseSupplies.find(s => s.itemId === newId);
                        setIngredients(ingredients.map(ing => ing.id === ingredient.id ? { ...ing, itemId: newId, uomId: supply ? supply.uomId : ing.uomId } : ing));
                      }} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                        {baseSupplies.map(supply => (
                          <option key={supply.itemId} value={supply.itemId}>{supply.itemName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity</label>
                      <input 
                        type="number" 
                        min={0}
                        placeholder="e.g. 500" 
                        value={ingredient.quantity} 
                        onChange={(e) => handleIngredientQuantityChange(ingredient.id, e.target.value)} 
                        onKeyDown={handleNumberKeyDown}
                        className={`w-full rounded-xl border ${ingredientsErrors[ingredient.id] ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500`} 
                      />
                      {ingredientsErrors[ingredient.id] && <p className="mt-1 text-xs text-red-500">{ingredientsErrors[ingredient.id]}</p>}
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Unit</label>
                      <select value={ingredient.uomId} disabled className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed">
                        <option value={1}>kg</option>
                        <option value={2}>pcs</option>
                        <option value={3}>liters</option>
                        <option value={4}>m</option>
                        <option value={5}>grams</option>
                        <option value={6}>box</option>
                        <option value={7}>pack</option>
                        <option value={8}>roll</option>
                        <option value={9}>bottle</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addIngredient} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-500 transition-colors"><Plus size={18} /> Add Ingredient</button>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Additional preparation notes..." rows={4} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {editingRecipeId !== null && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
              <select
                value={recipeActive ? "true" : "false"}
                onChange={(e) => setRecipeActive(e.target.value === "true")}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">

            {editingRecipeId === null && (
              <button onClick={() => setOpenRecipeModal(false)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            )}
            <button onClick={handleAddRecipe} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              {editingRecipeId !== null ? "Save Recipe" : "Create Recipe"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!viewSupplier} title={`Supplier Details - ${viewSupplier?.companyName}`} onClose={() => setViewSupplier(null)} size="max-w-2xl">
        {viewSupplier && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${viewSupplier.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                {viewSupplier.isActive ? 'Active Supplier' : 'Inactive Supplier'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
              <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Supplier Name</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{viewSupplier.companyName}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Contact Person</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{viewSupplier.contactPerson}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Email</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{viewSupplier.email}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Phone Number</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{viewSupplier.phone}</p></div>
              <div className="col-span-2"><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Address</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{viewSupplier.address || "N/A"}</p></div>
              {viewSupplier.website && (
                <div className="col-span-2"><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Website</p><a href={viewSupplier.website.startsWith('http') ? viewSupplier.website : `https://${viewSupplier.website}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">{viewSupplier.website}</a></div>
              )}
            </div>

            <div className={`border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4 ${viewSupplier.isActive ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
              <div className="flex items-center gap-3">
                {viewSupplier.isActive ? (
                  <>
                    <CheckCircle className="text-green-500 shrink-0" size={24} />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Active and Verified</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">This supplier is currently active and eligible for new purchase orders.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-500 shrink-0" size={24} />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Inactive</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">This supplier is inactive and cannot be used for new purchase orders.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button onClick={() => setViewSupplier(null)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showDeleteConfirm} title="Confirm Delete" onClose={() => setShowDeleteConfirm(false)} size="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            Are you sure you want to permanently delete this {deleteTarget?.type}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setShowDeleteConfirm(false)} 
              className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmDelete} 
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}