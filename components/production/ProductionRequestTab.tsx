"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  MoreHorizontal,
  RefreshCw,
  Plus,
  Eye,
  Check,
  X as XIcon,
  Ban,
  Play,
  FileText,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductionRequest, FinishedProductItem, ProductionBatchItem } from "./types";
import ProductionKpiCards from "./ProductionKpiCards";
import ProductionSummaryModal from "./ProductionSummaryModal";
import ProductionBatchDetailsModal from "./ProductionBatchDetailsModal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import { toast } from "sonner";

interface RecipeOption {
  recipeId: number;
  recipeName: string;
  productId: number;
  outputQuantity: number;
  yieldUom?: { abbreviation?: string };
}

interface ProductionRequestTabProps {
  isAdmin: boolean;
  isHeadCook: boolean;
  onNavigateToTracking: (batchId: number) => void;
}

const DRAFTS_STORAGE_KEY = "production_draft_requests_v2";

export default function ProductionRequestTab({
  isAdmin,
  isHeadCook,
  onNavigateToTracking,
}: ProductionRequestTabProps) {
  const [batches, setBatches] = useState<ProductionRequest[]>([]);
  const [drafts, setDrafts] = useState<ProductionRequest[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<FinishedProductItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Active status tab: Admin sees Pending Approval (Request) and Approved tabs
  const [activeTab, setActiveTab] = useState<string>(isAdmin ? "Pending Approval" : "All");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Request Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState<number | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [purpose, setPurpose] = useState("");
  const [assignedCook, setAssignedCook] = useState("Elena Reyes");
  const [submitting, setSubmitting] = useState(false);

  // Modals state
  const [detailsBatch, setDetailsBatch] = useState<ProductionRequest | null>(null);
  const [viewingSummaryBatch, setViewingSummaryBatch] = useState<ProductionRequest | null>(null);
  const [rejectingBatch, setRejectingBatch] = useState<ProductionRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // 3-dots dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<number | string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load drafts from localStorage
  const loadDrafts = () => {
    try {
      const saved = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (saved) {
        setDrafts(JSON.parse(saved));
      } else {
        setDrafts([]);
      }
    } catch {
      setDrafts([]);
    }
  };

  const saveDraftsToStorage = (newDrafts: ProductionRequest[]) => {
    setDrafts(newDrafts);
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(newDrafts));
    } catch (e) {
      console.error("Failed to save drafts", e);
    }
  };

  const mapStatus = (statusStr: string): ProductionRequest["status"] => {
    const s = (statusStr || "").toLowerCase().trim();
    if (s === "scheduled") return "Pending Approval";
    if (s === "approved") return "Approved";
    if (s === "in progress" || s === "inprogress") return "In Progress";
    if (s === "passed qa" || s === "passedqa") return "Passed QA";
    if (s === "completed") return "Completed";
    if (s === "inventory added" || s === "inventoryadded") return "Completed";
    if (s === "rejected") return "Rejected";
    if (s === "cancelled") return "Cancelled";
    return "Pending Approval";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes, prodsRes, recipesRes] = await Promise.all([
        api.get("/api/ProductionBatches"),
        api.get("/api/FinishedProducts"),
        api.get("/api/Recipes"),
      ]);

      const rawBatches = batchesRes.data || [];
      const mappedBatches: ProductionRequest[] = rawBatches.map((b: ProductionBatchItem) => ({
        batchId: b.batchId,
        batchNumber: b.batchNumber,
        productId: b.productId,
        productName: b.productName,
        variant: b.variant,
        targetYield: b.estimatedQuantity,
        yieldUnit: "PCS",
        purpose: b.purpose || b.notes || "",
        status: mapStatus(b.status),
        stage: b.stage,
        scheduleDate: b.productionDate,
        rejectionReason: b.rejectionReason,
        recipeId: b.recipeId,
        recipeName: b.recipeName,
        batchMultiplier: b.batchMultiplier,
        actualQuantity: b.actualQuantity,
        scrapQuantity: b.scrapQuantity,
        scrapReason: b.scrapReason,
        fgLotId: b.fgLotId,
        assignedCook: b.assignedCook,
        imageUrl: b.imageUrl,
        qualityStatus: b.qualityStatus,
        createdAt: b.productionDate,
      }));

      setBatches(mappedBatches);

      const prodsList = prodsRes.data?.data || prodsRes.data || [];
      setFinishedProducts(prodsList);

      const recipesList = recipesRes.data?.data || recipesRes.data || [];
      setRecipes(recipesList);

      loadDrafts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load production data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Combined requests: API batches + local drafts
  const allRequests: ProductionRequest[] = isAdmin ? batches : [...drafts, ...batches];

  // Tabs
  const nonAdminTabs = [
    { key: "All", label: "All Requests" },
    { key: "Draft", label: "Draft" },
    { key: "Pending Approval", label: "Pending Approval" },
    { key: "Approved", label: "Approved" },
    { key: "In Progress", label: "In Progress" },
    { key: "Passed QA", label: "Passed QA" },
    { key: "Completed", label: "Completed" },
    { key: "Rejected", label: "Rejected" },
    { key: "Cancelled", label: "Cancelled" },
  ];

  const adminTabs = [
    { key: "Pending Approval", label: "Requests (Pending)" },
    { key: "Approved", label: "Approved Requests" },
  ];

  const currentTabs = isAdmin ? adminTabs : nonAdminTabs;

  // Filter requests
  const filteredRequests = allRequests.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.batchNumber?.toLowerCase().includes(q) ||
      r.productName?.toLowerCase().includes(q) ||
      r.variant?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (isAdmin) {
      if (activeTab === "Pending Approval") return r.status === "Pending Approval";
      if (activeTab === "Approved")
        return (
          r.status === "Approved" ||
          r.status === "In Progress" ||
          r.status === "Passed QA" ||
          r.status === "Completed"
        );
      return true;
    }

    if (activeTab === "All") return true;
    return r.status === activeTab;
  });

  // KPI counts
  const totalRequests = allRequests.length;
  const pendingApprovalCount = allRequests.filter((r) => r.status === "Pending Approval").length;
  const activeBatchesCount = allRequests.filter((r) => r.status === "In Progress").length;

  const handleOpenCreateModal = () => {
    if (finishedProducts.length === 0) {
      toast.error("Please configure at least one finished product in Configuration first.");
      return;
    }
    const firstProd = finishedProducts[0];
    setSelectedProdId(firstProd.productId);

    // Find recipes matching this product or by name similarity
    const matchingRecipes = recipes.filter((rc) => rc.productId === firstProd.productId);
    if (matchingRecipes.length > 0) {
      setSelectedRecipeId(matchingRecipes[0].recipeId);
    } else {
      const nameMatch = recipes.find(
        (r) =>
          r.recipeName.toLowerCase().includes(firstProd.itemName.toLowerCase()) ||
          firstProd.itemName.toLowerCase().includes(r.recipeName.toLowerCase())
      );
      setSelectedRecipeId(nameMatch ? nameMatch.recipeId : recipes[0]?.recipeId || null);
    }

    setBatchMultiplier(1);
    setTargetDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
    setPurpose("");
    setAssignedCook("Elena Reyes");
    setIsCreateOpen(true);
  };

  const handleProductChange = (prodId: number) => {
    setSelectedProdId(prodId);
    const prod = finishedProducts.find((p) => p.productId === prodId);
    const matchingRecipes = recipes.filter((rc) => rc.productId === prodId);
    if (matchingRecipes.length > 0) {
      setSelectedRecipeId(matchingRecipes[0].recipeId);
    } else if (recipes.length > 0) {
      const nameMatch = recipes.find(
        (r) =>
          prod &&
          (r.recipeName.toLowerCase().includes(prod.itemName.toLowerCase()) ||
            prod.itemName.toLowerCase().includes(r.recipeName.toLowerCase()))
      );
      if (nameMatch) {
        setSelectedRecipeId(nameMatch.recipeId);
      } else if (!selectedRecipeId || !recipes.some((r) => r.recipeId === selectedRecipeId)) {
        setSelectedRecipeId(recipes[0].recipeId);
      }
    }
  };

  const currentSelectedProduct = finishedProducts.find((p) => p.productId === selectedProdId);
  const currentSelectedRecipe = recipes.find((r) => r.recipeId === selectedRecipeId);
  const estimatedOutput = currentSelectedRecipe
    ? (currentSelectedRecipe.outputQuantity || 100) * (batchMultiplier || 1)
    : 100 * (batchMultiplier || 1);

  // Submit / Save Request
  const handleSaveRequest = async (isDraftMode: boolean) => {
    if (!selectedProdId) {
      toast.error("Please select a finished product");
      return;
    }
    if (!selectedRecipeId) {
      toast.error("Please select a recipe/BOM");
      return;
    }
    if (!targetDate) {
      toast.error("Please choose a schedule date");
      return;
    }

    if (isDraftMode) {
      // Save to localStorage draft
      const newDraft: ProductionRequest = {
        batchId: Date.now(),
        batchNumber: `DFT-${Date.now().toString().slice(-4)}`,
        productId: selectedProdId,
        productName: currentSelectedProduct?.itemName || "Draft Product",
        variant: currentSelectedProduct?.variant || "Standard",
        targetYield: estimatedOutput,
        yieldUnit: "PCS",
        purpose: purpose.trim() || "Batch Replenishment",
        status: "Draft",
        stage: "Preparation",
        scheduleDate: targetDate,
        recipeId: selectedRecipeId,
        recipeName: currentSelectedRecipe?.recipeName || "Recipe",
        batchMultiplier,
        assignedCook,
        createdAt: new Date().toISOString(),
      };

      const updatedDrafts = [newDraft, ...drafts];
      saveDraftsToStorage(updatedDrafts);
      toast.success(`Draft saved (${newDraft.batchNumber})`);
      setIsCreateOpen(false);
      return;
    }

    // Submit directly to API
    try {
      setSubmitting(true);
      const res = await api.post("/api/ProductionBatches", {
        recipeId: selectedRecipeId,
        productId: selectedProdId,
        batchMultiplier: Number(batchMultiplier) || 1,
        scheduleDate: new Date(targetDate).toISOString(),
        assignedCook,
        purpose: purpose.trim() || "Batch Replenishment",
      });

      const created = res.data;
      toast.success(
        `Production request submitted for approval! Batch: ${created.batchNumber || "Scheduled"}`
      );
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create production request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDraft = async (draft: ProductionRequest) => {
    try {
      toast.loading("Submitting request...", { id: "submit-draft" });
      const res = await api.post("/api/ProductionBatches", {
        recipeId: draft.recipeId || recipes[0]?.recipeId || 1,
        productId: draft.productId,
        batchMultiplier: Number(draft.batchMultiplier) || 1,
        scheduleDate: new Date(draft.scheduleDate || Date.now()).toISOString(),
        assignedCook: draft.assignedCook || "Elena Reyes",
        purpose: draft.purpose || "Batch Replenishment",
      });

      // Remove from drafts
      const remainingDrafts = drafts.filter((d) => d.batchId !== draft.batchId);
      saveDraftsToStorage(remainingDrafts);

      toast.success(
        `Request submitted! Batch: ${res.data?.batchNumber || "Scheduled"}`,
        { id: "submit-draft" }
      );
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit draft", {
        id: "submit-draft",
      });
    }
  };

  const handleDeleteDraft = (draftId: number) => {
    const remainingDrafts = drafts.filter((d) => d.batchId !== draftId);
    saveDraftsToStorage(remainingDrafts);
    toast.success("Draft removed");
  };

  const handleApprove = async (batchId: number) => {
    try {
      setActionLoading(true);
      await api.put(`/api/ProductionBatches/${batchId}/approve`);
      toast.success("Production batch approved!");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve batch");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (batch: ProductionRequest) => {
    setRejectingBatch(batch);
    setRejectReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingBatch) return;
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/api/ProductionBatches/${rejectingBatch.batchId}/reject`, {
        reason: rejectReason.trim(),
      });
      toast.success(`Batch ${rejectingBatch.batchNumber} has been rejected`);
      setRejectingBatch(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject batch");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBatch = async (batchId: number) => {
    try {
      setActionLoading(true);
      await api.put(`/api/ProductionBatches/${batchId}/cancel`);
      toast.success("Batch has been cancelled");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel batch");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & New Request Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Production Requests</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submit, review, and approve planned batches for production.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 h-9 rounded-xl border-border hover:bg-muted font-semibold text-xs text-foreground cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {!isAdmin && (
            <Button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background hover:bg-foreground/85 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Production Request
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards (Exact Inventory Design) */}
      <ProductionKpiCards
        totalRequests={totalRequests}
        pendingApprovalCount={pendingApprovalCount}
        activeBatchesCount={activeBatchesCount}
      />

      {/* Sub-tabs & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {currentTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search batch or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs border border-border bg-card"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading production requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs">
              No production requests found in this view.
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[260px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Batch Number</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Variant</th>
                    <th className="py-3 px-4">Target Output</th>
                    <th className="py-3 px-4">Target Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map((req, rowIdx) => {
                    const isDraft = req.status === "Draft";
                    const isPending = req.status === "Pending Approval";
                    const isApproved = req.status === "Approved";
                    const isInProgress = req.status === "In Progress";
                    const isPassedQa = req.status === "Passed QA";
                    const isCompleted = req.status === "Completed";
                    const isOpen = openDropdownId === req.batchId;

                    return (
                      <tr
                        key={req.batchId}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {req.batchNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {req.productName}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {req.variant || "Standard"}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-foreground">
                          {req.targetYield} {req.yieldUnit || "PCS"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {req.scheduleDate
                            ? new Date(req.scheduleDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(isOpen ? null : req.batchId);
                              }}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isOpen
                                  ? "bg-muted border-border text-foreground shadow-sm"
                                  : "border-transparent text-foreground hover:bg-muted/80"
                              }`}
                              aria-label="Actions menu"
                            >
                              <MoreHorizontal className="w-4 h-4 text-foreground" />
                            </button>

                            {isOpen && (
                              <div
                                ref={dropdownRef}
                                style={{ minWidth: "185px" }}
                                className={`absolute right-0 ${
                                  rowIdx >= filteredRequests.length - 1 && filteredRequests.length <= 2
                                    ? "bottom-full mb-1.5"
                                    : "top-full mt-1.5"
                                } z-[200] rounded-xl border border-border bg-card py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 text-left`}
                              >
                                {/* View Details (Always available) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    setDetailsBatch(req);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted text-foreground text-left cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-foreground shrink-0" />
                                  <span className="truncate text-foreground">View Details</span>
                                </button>

                                {/* ADMIN ACTIONS for Pending Approval */}
                                {isAdmin && isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        handleApprove(req.batchId);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted text-foreground text-left cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5 text-foreground shrink-0" />
                                      <span className="truncate text-foreground">Approve Request</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        handleOpenReject(req);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted text-destructive text-left cursor-pointer"
                                    >
                                      <XIcon className="w-3.5 h-3.5 text-destructive shrink-0" />
                                      <span className="truncate text-destructive">Reject Request</span>
                                    </button>
                                  </>
                                )}

                                {/* DRAFT ACTIONS */}
                                {!isAdmin && isDraft && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        handleSubmitDraft(req);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted text-foreground text-left cursor-pointer"
                                    >
                                      <Send className="w-3.5 h-3.5 text-foreground shrink-0" />
                                      <span className="truncate text-foreground">Submit for Approval</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        handleDeleteDraft(req.batchId);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted text-destructive text-left cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-destructive shrink-0" />
                                      <span className="truncate text-destructive">Delete Draft</span>
                                    </button>
                                  </>
                                )}

                                {/* ACTIONS FOR APPROVED (Available to both Admin and Head Cook) */}
                                {isApproved && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        onNavigateToTracking(req.batchId);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted text-foreground text-left cursor-pointer"
                                    >
                                      <Play className="w-3.5 h-3.5 text-foreground shrink-0" />
                                      <span className="truncate text-foreground">
                                        {isAdmin ? "Track / Pre-Prod" : "Start Pre-Prod"}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        handleCancelBatch(req.batchId);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted text-destructive text-left cursor-pointer"
                                    >
                                      <Ban className="w-3.5 h-3.5 text-destructive shrink-0" />
                                      <span className="truncate text-destructive">Cancel Batch</span>
                                    </button>
                                  </>
                                )}

                                {/* ACTIONS FOR IN PROGRESS (Both Admin and Head Cook) */}
                                {isInProgress && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        onNavigateToTracking(req.batchId);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted text-foreground text-left cursor-pointer"
                                    >
                                      <Play className="w-3.5 h-3.5 text-foreground shrink-0" />
                                      <span className="truncate text-foreground">Track Batch</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        handleCancelBatch(req.batchId);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted text-destructive text-left cursor-pointer"
                                    >
                                      <Ban className="w-3.5 h-3.5 text-destructive shrink-0" />
                                      <span className="truncate text-destructive">Cancel Batch</span>
                                    </button>
                                  </>
                                )}

                                {/* COMPLETED: View Summary Report */}
                                {(isCompleted || isPassedQa) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      setViewingSummaryBatch(req);
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted text-foreground text-left cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-foreground shrink-0" />
                                    <span className="truncate text-foreground">View Summary Report</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Production Request Modal ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border p-6 shadow-2xl">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-base font-bold text-foreground">
              New Production Batch Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Request authorization from Admin to produce finished goods
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Select Finished Product <span className="text-foreground">*</span>
              </label>
              <Select
                value={selectedProdId ? selectedProdId.toString() : ""}
                onValueChange={(val) => handleProductChange(parseInt(val, 10))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose Finished Product" />
                </SelectTrigger>
                <SelectContent>
                  {finishedProducts.map((p) => (
                    <SelectItem
                      key={p.productId}
                      value={p.productId.toString()}
                      className="text-xs"
                    >
                      {p.itemName} &bull; {p.variant || "Standard"} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipe / BOM Selection */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Recipe / BOM Formula <span className="text-foreground">*</span>
              </label>
              <Select
                value={selectedRecipeId ? selectedRecipeId.toString() : ""}
                onValueChange={(val) => setSelectedRecipeId(parseInt(val, 10))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose Recipe" />
                </SelectTrigger>
                <SelectContent>
                  {recipes.map((r) => (
                    <SelectItem
                      key={r.recipeId}
                      value={r.recipeId.toString()}
                      className="text-xs"
                    >
                      {r.recipeName} (Yield: {r.outputQuantity || 100} pcs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Batch Multiplier <span className="text-foreground">*</span>
                </label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="1.0"
                  value={batchMultiplier}
                  onChange={(e) =>
                    setBatchMultiplier(Math.max(0.1, Number(e.target.value) || 1))
                  }
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Est. Output (PCS)
                </label>
                <Input
                  type="text"
                  value={`${estimatedOutput} PCS`}
                  disabled
                  className="h-9 text-xs font-mono font-bold bg-muted/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Schedule Date <span className="text-foreground">*</span>
                </label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Assigned Cook / In-Charge
                </label>
                <Input
                  placeholder="e.g. Elena Reyes"
                  value={assignedCook}
                  onChange={(e) => setAssignedCook(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Purpose / Reason
              </label>
              <Textarea
                placeholder="e.g. Stock replenishment for upcoming weekend festival..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="text-xs resize-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs font-semibold border-border hover:bg-muted cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSaveRequest(true)}
                disabled={submitting}
                className="text-xs font-semibold border-border hover:bg-muted cursor-pointer"
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSaveRequest(false)}
                disabled={submitting}
                className="text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
              >
                {submitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Admin Rejection Reason Modal ── */}
      <Dialog
        open={Boolean(rejectingBatch)}
        onOpenChange={(open) => !open && setRejectingBatch(null)}
      >
        <DialogContent className="sm:max-w-md bg-card border-border p-6 shadow-2xl">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <XIcon size={16} /> Reject Production Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Please specify the reason for rejecting batch {rejectingBatch?.batchNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Rejection Reason <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="e.g. Insufficient warehouse space, seasonal adjustment..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-xs resize-none"
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectingBatch(null)}
                className="text-xs font-semibold border-border hover:bg-muted cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Batch Details Modal ── */}
      <ProductionBatchDetailsModal
        open={Boolean(detailsBatch)}
        onClose={() => setDetailsBatch(null)}
        batch={detailsBatch}
      />

      {/* ── Production Summary Modal ── */}
      {viewingSummaryBatch && (
        <ProductionSummaryModal
          open={Boolean(viewingSummaryBatch)}
          onClose={() => setViewingSummaryBatch(null)}
          report={
            viewingSummaryBatch.summaryReport || {
              batchNumber: viewingSummaryBatch.batchNumber,
              productName: viewingSummaryBatch.productName,
              variant: viewingSummaryBatch.variant || "Standard",
              targetYield: viewingSummaryBatch.targetYield,
              actualGoodOutput: viewingSummaryBatch.actualQuantity || viewingSummaryBatch.targetYield,
              purpose: viewingSummaryBatch.purpose,
              createdAt: viewingSummaryBatch.scheduleDate,
              approvedBy: "Administrator",
              completedAt: viewingSummaryBatch.scheduleDate,
              materialsUsed: [],
              stageLogs: [],
              qaResults: {
                overallAppearance: "Pass",
                aroma: "Pass",
                texture: "Pass",
                tasteTest: "Pass",
                consistency: "Pass",
                inspector: "QA Inspector",
                notes: "Passed quality standards",
                decision: "Approved",
                decisionDate: new Date().toLocaleDateString(),
              },
              packaging: {
                packagingSize: viewingSummaryBatch.variant || "Standard",
                goodQty: viewingSummaryBatch.actualQuantity || viewingSummaryBatch.targetYield,
                damagedQty: viewingSummaryBatch.scrapQuantity || 0,
                wasteQty: 0,
                fgLotNumber: `FG-${viewingSummaryBatch.batchNumber}`,
                expiryDate: new Date(Date.now() + 365 * 86400000).toLocaleDateString(),
                packagerName: viewingSummaryBatch.assignedCook || "Packager",
              },
            }
          }
        />
      )}
    </div>
  );
}
