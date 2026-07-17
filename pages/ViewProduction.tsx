// web-scms\pages\ViewProduction.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  Upload,
  Check,
  X,
  ChevronRight,
  ClipboardCheck,
  MoreHorizontal,
  Trash2,
  Loader2,
  Clock,
  XCircle,
  ArrowRight,
  Settings,
  Camera,
  MessageSquare,
} from "lucide-react";
import api from "../lib/api";
import CreateBatchModal from "../components/CreateBatchModal";
import ConfirmModal from "../components/ConfirmModal";

// ---------- Types ----------
type ProductionBatchResponse = {
  batchId: number;
  recipeId: number;
  recipeName: string;
  productId: number;
  productName: string;
  batchMultiplier: number;
  estimatedQuantity: number;
  actualQuantity: number;
  productionDate: string;
  stage: string;
  status: string;
  assignedCook: string;
  qualityStatus: string;
  rejectionReason: string;
  imageUrl: string;
  notes: string;
};

type DashboardSummaryResponse = {
  activeBatches: number;
  delayedBatches: number;
  passedQaBatches: number;
  completedBatches: number;
};

type FinishedProduct = {
  id: string;
  name: string;
  sku: string;
  variant: string; // user-editable, e.g. "100g", "500g"
};

// ---------- Stage definitions ----------
const STAGES = [
  "Preparation",
  "Mixing and Processing",
  "Cooking",
  "Cooling",
  "Quality Control",
  "Packaging",
] as const;

// ---------- Packaging Steps ----------
const PACKAGING_STEPS = [
  "Prepare Containers",
  "Fill and Weigh",
  "Containers Sealed",
  "Labels Applied",
  "Expiration Date Assigned",
  "Final Inspection",
];

// ---------- MOCK DATA ----------
// Backend handles data now

// ---------- Dark Mode Hook ----------
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

// ---------- Mock Stage Data ----------
// Stage data is stored on the backend as imageUrl/notes

// ---------- Status Badge ----------
function StatusBadge({ status }: { status: string }) {
  const displayStatus = status === "Inventory Added" ? "Completed" : status;
  const styles: Record<string, string> = {
    "Scheduled": "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    "In Progress": "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    "Passed QA": "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    "Rejected": "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    "Cancelled": "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    "Completed": "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${styles[displayStatus] ?? "bg-gray-100 text-gray-600"}`}>
      {displayStatus}
    </span>
  );
}

// ---------- Configuration Product Modal ----------
const ConfigProductModal = ({
  open,
  onClose,
  onSave,
  initialName = "",
  initialVariant = "",
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, variant: string) => void;
  initialName?: string;
  initialVariant?: string;
  mode: "add" | "edit";
}) => {
  const [name, setName] = useState(initialName);
  const [variant, setVariant] = useState(initialVariant);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setVariant(initialVariant);
    }
  }, [open, initialName, initialVariant]);

  const handleSubmit = () => {
    if (!name.trim() || !variant.trim()) return;
    onSave(name, variant);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1D2939] border border-gray-200 dark:border-gray-700 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {mode === "add" ? "Add Finished Product" : "Edit Finished Product"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ube Jam"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Variant <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={variant}
              onChange={e => setVariant(e.target.value)}
              placeholder="e.g., 100g, 250g, 500g"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101828] py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !variant.trim()}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {mode === "add" ? "Add Product" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};


// ---------- Main Page Component ----------
export default function ProductionPage() {
  useDarkMode();

  const [batches, setBatches] = useState<ProductionBatchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [summary, setSummary] = useState<DashboardSummaryResponse>({
    activeBatches: 0,
    delayedBatches: 0,
    passedQaBatches: 0,
    completedBatches: 0,
  });

  const [activeMainTab, setActiveMainTab] = useState<"planning" | "tracking" | "quality" | "packaging" | "configuration">("planning");
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  // QA state
  const [taste, setTaste] = useState("Pass");
  const [texture, setTexture] = useState("Pass");
  const [packagingQA, setPackagingQA] = useState("Pass");
  const [appearance, setAppearance] = useState("Pass");
  const [qaInspector, setQaInspector] = useState("");
  const [qaImages, setQaImages] = useState<File[]>([]);
  const [qaImagePreviews, setQaImagePreviews] = useState<string[]>([]);
  const [overallComment, setOverallComment] = useState("");
  const [submittingQA, setSubmittingQA] = useState(false);
  const [showQaConfirm, setShowQaConfirm] = useState(false);
  const [qaPassedBatchId, setQaPassedBatchId] = useState<number | null>(null);
  const [showQaFailureConfirm, setShowQaFailureConfirm] = useState(false);

  // Modals & dropdown
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tracking tab state
  const [trackingSelectedBatchId, setTrackingSelectedBatchId] = useState<number | null>(null);
  const [stagePanelVisible, setStagePanelVisible] = useState(false);
  const [stagePanelStage, setStagePanelStage] = useState<string | null>(null);
  const [stagePanelReadOnly, setStagePanelReadOnly] = useState(false);
  const [stagePanelIsQcTransition, setStagePanelIsQcTransition] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [uploadComment, setUploadComment] = useState("");
  const [isStageSubmitting, setIsStageSubmitting] = useState(false);
  const [showStageConfirm, setShowStageConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Packaging tab state
  const [packagingSelectedBatchId, setPackagingSelectedBatchId] = useState<number | null>(null);
  const [packagingCompletedSteps, setPackagingCompletedSteps] = useState<Record<number, number[]>>({});
  const [packagingQuantity, setPackagingQuantity] = useState<number | "">("");
  const [packagingDate, setPackagingDate] = useState(new Date().toISOString().split("T")[0]);
  const [packagingExpiration, setPackagingExpiration] = useState("");
  const [packagingExpiry, setPackagingExpiry] = useState("");
  const [packagingNotes, setPackagingNotes] = useState("");
  const [packagingPackedBy, setPackagingPackedBy] = useState("");
  const [showPackagingConfirm, setShowPackagingConfirm] = useState(false);

  // Configuration tab state
  const [finishedProducts, setFinishedProducts] = useState<FinishedProduct[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductName, setEditingProductName] = useState("");
  const [editingProductVariant, setEditingProductVariant] = useState("");

  // Fetch finished products for configuration tab
  const fetchFinishedProducts = async () => {
    setConfigLoading(true);
    try {
      const res = await api.get("/api/scms/api/FinishedProducts");
      if (res.data.success) {
        setFinishedProducts(
          (res.data.data || []).map((p: any) => ({
            id: p.productId.toString(),
            name: p.itemName || "",
            sku: p.sku || "",
            variant: p.variant || "",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch finished products", err);
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    fetchFinishedProducts();
  }, []);

  useEffect(() => {
    setStagePanelVisible(false);
    setUploadFiles([]);
    setUploadPreviews([]);
    setUploadComment("");
    setStagePanelReadOnly(false);
    setStagePanelIsQcTransition(false);
  }, [trackingSelectedBatchId]);

  useEffect(() => {
    setQaInspector("");
    setQaImages([]);
    setQaImagePreviews([]);
    setOverallComment("");
    setTaste("Pass");
    setTexture("Pass");
    setPackagingQA("Pass");
    setAppearance("Pass");
  }, [selectedBatchId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------- Fetch / Refresh ----------
  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const [batchesRes, dashboardRes] = await Promise.all([
        api.get("/api/scms/api/ProductionBatches"),
        api.get("/api/scms/api/ProductionBatches/dashboard")
      ]);

      let filtered = batchesRes.data || [];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((b: ProductionBatchResponse) =>
          b.productName.toLowerCase().includes(q) ||
          b.recipeName.toLowerCase().includes(q) ||
          b.stage.toLowerCase().includes(q) ||
          b.status.toLowerCase().includes(q) ||
          b.batchId.toString().includes(q)
        );
      }
      if (statusFilter !== "All") {
        filtered = filtered.filter((b: ProductionBatchResponse) => {
          if (statusFilter === "Completed") return b.status === "Completed" || b.status === "Inventory Added";
          return b.status === statusFilter;
        });
      }
      const limit = 10;
      const startIndex = (currentPage - 1) * limit;
      setBatches(filtered.slice(startIndex, startIndex + limit));
      setTotalPages(Math.ceil(filtered.length / limit));

      if (dashboardRes.data) {
        setSummary(dashboardRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch batches", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, [currentPage, searchQuery, statusFilter]);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const isOverdue = (batch: ProductionBatchResponse) => {
    if (batch.status === "Completed" || batch.status === "Cancelled" || batch.status === "Rejected") return false;
    const sched = new Date(batch.productionDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return sched < today;
  };

  const handleCancelBatch = (batchId: number) => {
    setCancelTarget(batchId);
    setOpenDropdownId(null);
  };

  const confirmCancelBatch = async () => {
    if (cancelTarget === null) return;
    try {
      await api.put(`/api/scms/api/ProductionBatches/${cancelTarget}/stage`, { stage: "Cancelled" });
      setCancelTarget(null);
      fetchBatches();
    } catch (err) {
      console.error("Failed to cancel batch", err);
    }
  };

  const startStageBatch = async (batchId: number) => {
    try {
      await api.put(`/api/scms/api/ProductionBatches/${batchId}/stage`, { stage: "Preparation" });
      fetchBatches();
    } catch (err) {
      console.error("Failed to start batch", err);
    }
  };

  const goToQualityCheck = (batchId: number) => {
    setSelectedBatchId(batchId);
    setActiveMainTab("quality");
  };

  const handleQaSubmit = () => {
    if (!selectedBatch) return;
    const isFailed = taste === "Fail" || texture === "Fail" || packagingQA === "Fail" || appearance === "Fail";
    if (isFailed) {
      setShowQaFailureConfirm(true);
    } else {
      setShowQaConfirm(true);
    }
  };

  const confirmQaPass = async () => {
    if (!selectedBatch) return;
    setSubmittingQA(true);
    setShowQaConfirm(false);
    try {
      if (overallComment) {
        await api.put(`/api/scms/api/ProductionBatches/${selectedBatch.batchId}/qa-notes`, { notes: overallComment });
      }
      await api.put(`/api/scms/api/ProductionBatches/${selectedBatch.batchId}/qa-status`, { isApproved: true, rejectionReason: "", locationId: 1 });
      setQaPassedBatchId(selectedBatch.batchId);
      fetchBatches();
    } catch (err) { console.error(err); }
    finally { setSubmittingQA(false); }
  };

  const confirmQaFailure = async () => {
    if (!selectedBatch) return;
    try {
      if (overallComment) {
        await api.put(`/api/scms/api/ProductionBatches/${selectedBatch.batchId}/qa-notes`, { notes: overallComment });
      }
      await api.put(`/api/scms/api/ProductionBatches/${selectedBatch.batchId}/qa-status`, { isApproved: false, rejectionReason: "Failed QA inspection.", locationId: 1 });
      setShowQaFailureConfirm(false);
      fetchBatches();
    } catch (err) { console.error(err); }
  };

  const selectedBatch = selectedBatchId ? batches.find(b => b.batchId === selectedBatchId) ?? null : null;

  const handleStageUpdateConfirm = async () => {
    if (!trackingSelectedBatchId || !stagePanelStage) return;
    setIsStageSubmitting(true);
    try {
      const batch = batches.find(b => b.batchId === trackingSelectedBatchId);
      if (batch) {
        if (uploadFiles.length > 0) {
          const formData = new FormData();
          formData.append("file", uploadFiles[0]);
          await api.post(`/api/scms/api/ProductionBatches/${trackingSelectedBatchId}/images`, formData);
        }
        
        if (uploadComment) {
            await api.put(`/api/scms/api/ProductionBatches/${trackingSelectedBatchId}/qa-notes`, { notes: uploadComment });
        }

        const currentStageIdx = STAGES.indexOf(stagePanelStage as any);
        if (currentStageIdx >= 0 && currentStageIdx < STAGES.length - 1) {
          const nextStage = STAGES[currentStageIdx + 1];
          await api.put(`/api/scms/api/ProductionBatches/${trackingSelectedBatchId}/stage`, { stage: nextStage });
        } else if (currentStageIdx === STAGES.length - 1) {
          await api.put(`/api/scms/api/ProductionBatches/${trackingSelectedBatchId}/stage`, { stage: "Completed" });
        }
      }
    } catch (err) {
      console.error("Failed to update stage", err);
    } finally {
      fetchBatches();
      setIsStageSubmitting(false);
      setShowStageConfirm(false);
      setStagePanelVisible(false);
      setUploadFiles([]);
      setUploadPreviews([]);
      setUploadComment("");
      setStagePanelReadOnly(false);
    }
  };

  const togglePackagingStep = (batchId: number, stepIdx: number) => {
    setPackagingCompletedSteps(prev => {
      const current = prev[batchId] || [];
      if (current.includes(stepIdx)) {
        return { ...prev, [batchId]: current.filter(i => i !== stepIdx).sort((a, b) => a - b) };
      } else {
        if (stepIdx === 0 || current.includes(stepIdx - 1)) {
          return { ...prev, [batchId]: [...current, stepIdx].sort((a, b) => a - b) };
        }
        return prev;
      }
    });
  };

  const handlePackagingSubmit = async () => {
    if (packagingSelectedBatchId && packagingQuantity !== "" && packagingDate && packagingExpiration && packagingExpiry && packagingPackedBy) {
      try {
        await api.put(`/api/scms/api/ProductionBatches/${packagingSelectedBatchId}/stage`, { stage: "Completed" });
        
        setPackagingCompletedSteps(prev => {
          const { [packagingSelectedBatchId]: _, ...rest } = prev;
          return rest;
        });
        setShowPackagingConfirm(false);
        setPackagingSelectedBatchId(null);
        setPackagingQuantity("");
        setPackagingDate(new Date().toISOString().split("T")[0]);
        setPackagingExpiration("");
        setPackagingExpiry("");
        setPackagingNotes("");
        setPackagingPackedBy("");
        fetchBatches();
        setActiveMainTab("tracking");
      } catch (err) {
        console.error("Failed to add to inventory", err);
      }
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setEditingProductName("");
    setEditingProductVariant("");
    setConfigModalOpen(true);
  };

  const handleOpenEditProduct = (product: FinishedProduct) => {
    setEditingProductId(product.id);
    setEditingProductName(product.name);
    setEditingProductVariant(product.variant); // use the variant field, not sku
    setConfigModalOpen(true);
  };

  const handleSaveProduct = async (name: string, variant: string) => {
    try {
      if (editingProductId) {
        await api.put(`/api/scms/api/FinishedProducts/${editingProductId}`, { productName: name, variant });
      } else {
        await api.post("/api/scms/api/FinishedProducts", { productName: name, variant });
      }
      fetchFinishedProducts();
    } catch (err) {
      console.error("Failed to save product", err);
    }
  };

  // ---------- Summary Cards ----------
  const summaryCards = [
    { label: "Active Batches", value: summary.activeBatches, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Passed QA", value: summary.passedQaBatches, color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400" },
    { label: "Completed", value: summary.completedBatches, color: "text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400" },
  ];

  const formatBatchId = (id: number | undefined | null) => {
    if (id == null) return "N/A";
    return String(id);
  };

  const mainTabs = [
    { key: "planning", label: "Production Planning" },
    { key: "tracking", label: "Production Tracking" },
    { key: "quality", label: "Quality Control" },
    { key: "packaging", label: "Packaging" },
    { key: "configuration", label: "Configuration" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 transition-colors">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">Production & Quality</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage production batches, track stages, and perform QA reviews.
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex gap-0">
          {mainTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveMainTab(tab.key as any);
                if (tab.key === "planning") setSelectedBatchId(null);
              }}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeMainTab === tab.key
                  ? "border-brand-500 text-brand-500 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========== PRODUCTION PLANNING TAB ========== */}
      {activeMainTab === "planning" && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 mt-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Production Planning</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of all production batches</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-11 px-5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
              >
                <Plus size={16} />
                Create Batch
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {summaryCards.map(card => (
              <div key={card.label} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</h2>

              </div>
            ))}
          </div>

          {/* Actions Bar & Status Filter */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-5">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex flex-wrap gap-1.5">
                {(["All", "Scheduled", "In Progress", "Rejected", "Cancelled", "Completed"]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      statusFilter === tab 
                        ? "bg-brand-600 text-white" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="relative w-full lg:max-w-md">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchError(/^[A-Za-z0-9\s]*$/.test(e.target.value) ? "" : "Special characters are not allowed.");
                  }}
                  placeholder="Search by product name..."
                  className={`w-full rounded-xl border ${searchError ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-800 py-[9px] pl-11 pr-4 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 h-[42px]`}
                />
              </div>
            </div>
            {searchError && <div className="px-3 pb-2"><p className="text-xs text-red-500">{searchError}</p></div>}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-visible">
            <div className="overflow-x-auto min-h-[200px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">BATCH NO.</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">PRODUCT</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">QUANTITY</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">SCHEDULE DATE</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">CURRENT STAGE</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">STATUS</th>
                    <th className="px-2 py-2 text-center font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                        Loading batches...
                      </td>
                    </tr>
                  ) : batches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                        No Results Found
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch, idx) => {
                      const overdue = isOverdue(batch);
                      return (
                        <tr
                          key={batch.batchId}
                          className={`${idx < batches.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${overdue ? "bg-red-50/60 dark:bg-red-500/5" : ""}`}
                        >
                          <td className="px-2 py-2.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                            {(currentPage - 1) * 10 + idx + 1}
                          </td>
                          <td className="px-2 py-2.5 font-medium text-gray-800 dark:text-gray-200 max-w-[160px] truncate">
                            {batch.productName}
                          </td>
                          <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {batch.estimatedQuantity}
                          </td>
                          <td className="px-2 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              {batch.productionDate}
                              {overdue && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                                  <AlertTriangle size={13} /> Overdue
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 whitespace-nowrap">
                            <span className="rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                              {batch.stage}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 whitespace-nowrap">
                            <StatusBadge status={batch.status} />
                          </td>
                          <td className="px-2 py-2.5 text-center relative">
                            <div className="relative inline-block text-center" ref={openDropdownId === batch.batchId ? dropdownRef : undefined}>
                              <button
                                onClick={() => setOpenDropdownId(openDropdownId === batch.batchId ? null : batch.batchId)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                              >
                                <MoreHorizontal size={18} />
                              </button>
                              {openDropdownId === batch.batchId && (
                                <div className="absolute right-[40px] top-[10px] w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-[9999] py-1.5 focus:outline-none text-left">
                                  {batch.status === "Scheduled" && (
                                    <button
                                      onClick={() => { startStageBatch(batch.batchId); setOpenDropdownId(null); }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      <ChevronRight size={14} className="text-brand-600 dark:text-brand-400" /> Start Production
                                    </button>
                                  )}
                                  {batch.status === "Scheduled" && (
                                    <button
                                      onClick={() => handleCancelBatch(batch.batchId)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                    >
                                      <XCircle size={14} /> Cancel Batch
                                    </button>
                                  )}
                                  {batch.status !== "Scheduled" && (
                                    <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 font-medium">No actions available</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronRight className="h-4 w-4 rotate-180" aria-hidden="true" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                            currentPage === page
                              ? 'z-10 bg-brand-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'
                              : 'text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-offset-0'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========== PRODUCTION TRACKING TAB ========== */}
      {activeMainTab === "tracking" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-72 order-2 lg:order-1">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Active Batches</h3>
              </div>
              <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                {batches.filter(b => b.status === "In Progress" || b.status === "Passed QA").length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No active batches.</p>
                ) : (
                  batches.filter(b => b.status === "In Progress" || b.status === "Passed QA").map(batch => {
                    const currentIdx = STAGES.indexOf(batch.stage as any);
                    const completedCount = currentIdx >= 0 ? currentIdx : 0;
                    const progressPercent = (completedCount / STAGES.length) * 100;
                    
                    return (
                      <button
                        key={batch.batchId}
                        onClick={() => setTrackingSelectedBatchId(batch.batchId)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          trackingSelectedBatchId === batch.batchId
                            ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <p className="text-sm font-bold text-brand-600 dark:text-brand-400">BATCH-{formatBatchId(batch.batchId).padStart(3, '0')}</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5 mb-2">{batch.productName}</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden mb-1">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                          {completedCount}/{STAGES.length} stages
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Main panel */}
          <div className="flex-1 order-1 lg:order-2">
            {trackingSelectedBatchId ? (
              (() => {
                const batch = batches.find(b => b.batchId === trackingSelectedBatchId);
                if (!batch) return (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500">
                    Batch not found.
                  </div>
                );

                const currentStage = batch.stage;
                const isAllCompleted = currentStage === "Completed" || batch.status === "Completed" || batch.status === "Inventory Added";
                const currentIdx = isAllCompleted ? STAGES.length : STAGES.indexOf(currentStage as any);
                const completedCount = isAllCompleted ? STAGES.length : (currentIdx >= 0 ? currentIdx : 0);
                const progressPercent = (completedCount / STAGES.length) * 100;

                return (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                    <div className="mb-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {formatBatchId(batch.batchId)}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {batch.productName} &mdash; {batch.estimatedQuantity} units
                          </p>
                        </div>
                        <StatusBadge status={batch.status} />
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                          <span>Progress</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stage Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                      {STAGES.map((stage, idx) => {
                        const isCompleted = idx < currentIdx;
                        const isCurrent = idx === currentIdx;
                        const isNext = !isCompleted && !isCurrent && idx === currentIdx + 1;
                        const isLocked = !isCompleted && !isCurrent && !isNext;

                        const handleClick = () => {
                          if (isCompleted) {
                            const hasData = isCompleted || (isCurrent && batch.stage === stage);
                            setStagePanelStage(stage);
                            setStagePanelVisible(true);
                            setStagePanelReadOnly(true);
                            setStagePanelIsQcTransition(false);
                            setUploadPreviews(hasData && batch.imageUrl ? [batch.imageUrl] : []);
                            setUploadComment(hasData && batch.notes ? batch.notes : "");
                            setUploadFiles([]);
                          } else if (isCurrent) {
                            const hasData = batch.stage === stage;
                            setStagePanelStage(stage);
                            setStagePanelVisible(true);
                            setStagePanelReadOnly(false);
                            setStagePanelIsQcTransition(false);
                            setUploadPreviews(hasData && batch.imageUrl ? [batch.imageUrl] : []);
                            setUploadComment(hasData && batch.notes ? batch.notes : "");
                            setUploadFiles([]);
                          } else if (isNext) {
                            if (stage === "Quality Control") {
                              setStagePanelStage(stage);
                              setStagePanelVisible(true);
                              setStagePanelIsQcTransition(true);
                              setStagePanelReadOnly(false);
                              setUploadFiles([]);
                              setUploadPreviews([]);
                              setUploadComment("");
                            } else {
                              setStagePanelStage(stage);
                              setStagePanelVisible(true);
                              setStagePanelReadOnly(false);
                              setStagePanelIsQcTransition(false);
                              setUploadFiles([]);
                              setUploadPreviews([]);
                              setUploadComment("");
                            }
                          }
                        };

                        const hasStageData = isCompleted || (isCurrent && batch.stage === stage);
                        const imageCount = hasStageData && batch.imageUrl ? 1 : 0;
                        const commentCount = hasStageData && batch.notes ? 1 : 0;

                        return (
                          <button
                            key={stage}
                            onClick={handleClick}
                            disabled={isLocked}
                            className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                              isCompleted
                                ? "border-brand-500 bg-white dark:bg-gray-800 cursor-pointer hover:bg-brand-50 dark:hover:bg-gray-700 shadow-sm"
                                : isCurrent
                                ? "border-gray-900 dark:border-gray-300 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
                                : isNext
                                ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 opacity-60 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isCompleted ? "bg-brand-500" : isCurrent ? "border-2 border-gray-400 dark:border-gray-500" : "border-2 border-gray-200 dark:border-gray-700"
                              }`}>
                                {isCompleted && <Check size={12} className="text-white" strokeWidth={3} />}
                              </div>
                              <span className={`text-sm font-bold leading-tight ${
                                isCompleted ? "text-brand-600 dark:text-brand-400"
                                : isCurrent ? "text-gray-900 dark:text-white"
                                : "text-gray-400 dark:text-gray-500"
                              }`}>
                                {stage}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-auto">
                              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                                <Camera size={13} />
                                <span className="text-[11px] font-semibold">{imageCount}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                                <MessageSquare size={13} />
                                <span className="text-[11px] font-semibold">{commentCount}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {isAllCompleted && batch.status !== "Inventory Added" && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={async () => {
                            try {
                              setIsStageSubmitting(true);
                              await api.put(`/api/scms/api/ProductionBatches/${batch.batchId}/add-to-inventory`);
                              fetchBatches();
                              setStagePanelVisible(false);
                            } catch (err) {
                              console.error("Failed to add to inventory", err);
                            } finally {
                              setIsStageSubmitting(false);
                            }
                          }}
                          disabled={isStageSubmitting}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                          {isStageSubmitting ? <Loader2 size={15} className="animate-spin" /> : "Add to Inventory"}
                        </button>
                      </div>
                    )}

                    {stagePanelVisible && stagePanelStage && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-900/50 mt-2">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{stagePanelStage}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Stage {(STAGES.indexOf(stagePanelStage as any) + 1)} of {STAGES.length}
                              </p>
                            </div>
                            {!stagePanelReadOnly && (
                              (stagePanelStage === "Quality Control" || stagePanelStage === "Packaging") ? (
                                batch.stage === stagePanelStage && (
                                  <button
                                    onClick={() => {
                                      if (stagePanelStage === "Quality Control") {
                                        setSelectedBatchId(batch.batchId);
                                        setActiveMainTab("quality");
                                      } else {
                                        setPackagingSelectedBatchId(batch.batchId);
                                        setActiveMainTab("packaging");
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                                  >
                                    Proceed to {stagePanelStage} <ArrowRight size={15} />
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={() => setShowStageConfirm(true)}
                                  disabled={uploadFiles.length === 0 || isStageSubmitting}
                                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                                >
                                  {isStageSubmitting ? <Loader2 size={15} className="animate-spin" /> : "Submit Stage Update"}
                                </button>
                              )
                            )}
                          </div>

                          {(stagePanelStage === "Quality Control" || stagePanelStage === "Packaging") ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                              {stagePanelReadOnly 
                                ? `This batch has already passed the ${stagePanelStage} stage.` 
                                : batch.stage !== stagePanelStage
                                  ? `You must complete the previous stages before proceeding to ${stagePanelStage}.`
                                  : `Click "Proceed to ${stagePanelStage}" to perform the steps in the ${stagePanelStage} tab.`}
                            </div>
                          ) : stagePanelReadOnly ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Uploaded Images</label>
                                {uploadPreviews.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    {uploadPreviews.map((src, i) => (
                                      <img key={i} src={src} className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-gray-400">
                                    <Upload size={24} className="mb-1" />
                                    <p className="text-sm">No images uploaded.</p>
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comments</label>
                                <textarea
                                  value={uploadComment}
                                  readOnly
                                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 p-3 text-sm resize-none opacity-70 text-gray-700 dark:text-gray-300"
                                  rows={4}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Images</label>
                                <div
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                  <Upload size={24} className="text-gray-400 mb-1.5" />
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Click to add images</p>
                                </div>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  multiple
                                  accept="image/png,image/jpeg,image/jpg"
                                  onChange={e => {
                                    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
                                    setUploadFiles(prev => [...prev, ...files]);
                                    files.forEach(f => setUploadPreviews(prev => [...prev, URL.createObjectURL(f)]));
                                    e.target.value = "";
                                  }}
                                  className="hidden"
                                />
                                {uploadPreviews.length > 0 && (
                                  <div className="mt-3 grid grid-cols-3 gap-2">
                                    {uploadPreviews.map((src, i) => (
                                      <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                        <img src={src} className="w-full h-20 object-cover" />
                                        <button
                                          onClick={() => {
                                            setUploadPreviews(prev => prev.filter((_, j) => j !== i));
                                            setUploadFiles(prev => prev.filter((_, j) => j !== i));
                                          }}
                                          className="absolute top-1 right-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 size={12} className="text-red-500" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Comments</label>
                                <textarea
                                  value={uploadComment}
                                  onChange={e => setUploadComment(e.target.value)}
                                  placeholder="Optional comments..."
                                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm resize-none text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                  rows={4}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                    )}

                    {showStageConfirm && (
                      <ConfirmModal
                        message={`Update the current stage to "${stagePanelStage}"?`}
                        onConfirm={handleStageUpdateConfirm}
                        onCancel={() => setShowStageConfirm(false)}
                      />
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                  <Package size={22} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select an active batch from the list to view tracking details.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== QUALITY CONTROL TAB ========== */}
      {activeMainTab === "quality" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-72 order-2 lg:order-1">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ready for QA</h3>
              </div>
              <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                {batches.filter(b => b.status === "In Progress" && b.stage === "Quality Control").length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No batches ready for QA.</p>
                ) : (
                  batches.filter(b => b.status === "In Progress" && b.stage === "Quality Control").map(batch => (
                    <button
                      key={batch.batchId}
                      onClick={() => { setSelectedBatchId(batch.batchId); setQaPassedBatchId(null); }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedBatchId === batch.batchId
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatBatchId(batch.batchId)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{batch.productName}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* QA Panel */}
          <div className="flex-1 order-1 lg:order-2">
            {selectedBatch ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                {qaPassedBatchId === selectedBatch.batchId ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Batch Passed Quality Control
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Proceed to the Packaging tab to complete packaging and add to inventory.
                    </p>
                    <button
                      onClick={() => { setActiveMainTab("packaging"); setPackagingSelectedBatchId(selectedBatch.batchId); }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                    >
                      Proceed to Packaging <ArrowRight size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Quality Control &mdash; {formatBatchId(selectedBatch.batchId)}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {selectedBatch.productName}
                      </p>
                    </div>

                    {/* QA Checklist */}
                    <div className="space-y-2.5 mb-6 max-w-xl">
                      {[
                        { label: "Taste", value: taste, setter: setTaste },
                        { label: "Texture", value: texture, setter: setTexture },
                        { label: "Packaging", value: packagingQA, setter: setPackagingQA },
                        { label: "Appearance", value: appearance, setter: setAppearance },
                      ].map(field => {
                        const isPassed = field.value === "Pass";
                        return (
                          <div
                            key={field.label}
                            onClick={() => field.setter(isPassed ? "Fail" : "Pass")}
                            className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-colors select-none ${
                              isPassed
                                ? "border-green-300 bg-green-50 dark:bg-green-500/10 dark:border-green-600"
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <span className={`text-sm font-medium ${isPassed ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
                              {field.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${isPassed ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                                {isPassed ? "Pass" : "Fail"}
                              </span>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isPassed ? "bg-green-500 border-green-500" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                              }`}>
                                {isPassed && <Check size={11} className="text-white" strokeWidth={3} />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="max-w-xl space-y-4">
                      {/* Inspector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Quality Control Inspector <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={qaInspector}
                          onChange={e => setQaInspector(e.target.value)}
                          placeholder="Inspector name"
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      {/* QA Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Upload QA Images <span className="text-red-500">*</span>
                        </label>
                        <div
                          onClick={() => { const input = document.getElementById("qa-image-upload") as HTMLInputElement; input?.click(); }}
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Upload size={22} className="text-gray-400 mb-1.5" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">Click to add QA images (required)</p>
                        </div>
                        <input
                          id="qa-image-upload"
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={e => {
                            const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
                            setQaImages(prev => [...prev, ...files]);
                            files.forEach(f => setQaImagePreviews(prev => [...prev, URL.createObjectURL(f)]));
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                        {qaImagePreviews.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {qaImagePreviews.map((src, i) => (
                              <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img src={src} className="w-full h-20 object-cover" />
                                <button
                                  onClick={() => {
                                    setQaImagePreviews(prev => prev.filter((_, j) => j !== i));
                                    setQaImages(prev => prev.filter((_, j) => j !== i));
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={12} className="text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Overall Inspection Comment
                        </label>
                        <textarea
                          value={overallComment}
                          onChange={e => setOverallComment(e.target.value)}
                          placeholder="Any additional comments..."
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm resize-none text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <button
                          onClick={() => { setSelectedBatchId(null); setActiveMainTab("planning"); }}
                          className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Back to Planning
                        </button>
                        <button
                          onClick={handleQaSubmit}
                          disabled={submittingQA || !qaInspector.trim() || qaImages.length === 0}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                        >
                          {submittingQA ? <Loader2 size={15} className="animate-spin" /> : "Submit QA & Decision"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                  <ClipboardCheck size={22} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select a batch from the list to begin quality control.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== PACKAGING TAB ========== */}
      {activeMainTab === "packaging" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-72 order-2 lg:order-1">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Passed QA</h3>
              </div>
              <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                {batches.filter(b => b.status === "Passed QA").length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No batches ready for packaging.</p>
                ) : (
                  batches.filter(b => b.status === "Passed QA").map(batch => (
                    <button
                      key={batch.batchId}
                      onClick={() => {
                        setPackagingSelectedBatchId(batch.batchId);
                        setPackagingQuantity("");
                        setPackagingDate(new Date().toISOString().split("T")[0]);
                        setPackagingExpiration("");
                        setPackagingExpiry("");
                        setPackagingNotes("");
                        setPackagingPackedBy("");
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        packagingSelectedBatchId === batch.batchId
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatBatchId(batch.batchId)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{batch.productName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Qty: {batch.estimatedQuantity}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Packaging Panel */}
          <div className="flex-1 order-1 lg:order-2">
            {packagingSelectedBatchId ? (
              (() => {
                const batch = batches.find(b => b.batchId === packagingSelectedBatchId);
                if (!batch) return (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500">
                    Batch not found.
                  </div>
                );

                const stepsDone = (packagingCompletedSteps[batch.batchId] || []).length;
                const progressPercent = (stepsDone / PACKAGING_STEPS.length) * 100;
                const allStepsDone = stepsDone === PACKAGING_STEPS.length;

                return (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                    <div className="mb-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {formatBatchId(batch.batchId)}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {batch.productName} &mdash; {batch.estimatedQuantity} units
                          </p>
                        </div>
                        <StatusBadge status={batch.status} />
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                          <span>Checklist Progress</span>
                          <span>{stepsDone}/{PACKAGING_STEPS.length} steps</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Packaging Checklist */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Packaging Checklist</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Complete steps in order</p>
                      </div>
                      <div className="space-y-2">
                        {PACKAGING_STEPS.map((step, idx) => {
                          const isChecked = (packagingCompletedSteps[batch.batchId] || []).includes(idx);
                          const canCheck = idx === 0 || (packagingCompletedSteps[batch.batchId] || []).includes(idx - 1);
                          return (
                            <div
                              key={idx}
                              onClick={() => canCheck && togglePackagingStep(batch.batchId, idx)}
                              className={`flex items-center gap-3 p-3.5 rounded-lg border transition-colors ${
                                isChecked
                                  ? "border-green-300 bg-green-50 dark:bg-green-500/10 dark:border-green-700"
                                  : canCheck
                                  ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50 cursor-not-allowed"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isChecked ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                              }`}>
                                {isChecked && <Check size={11} className="text-white" strokeWidth={3} />}
                              </div>
                              <span className={`text-sm ${
                                isChecked ? "text-green-700 dark:text-green-400 line-through" : "text-gray-700 dark:text-gray-300"
                              }`}>
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Packaging Details Form */}
                    {allStepsDone && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Packaging Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Packaging Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={packagingDate}
                              onChange={e => setPackagingDate(e.target.value)}
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Production Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={packagingExpiry}
                              onChange={e => setPackagingExpiry(e.target.value)}
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Expiration Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              min={packagingExpiry || undefined}
                              value={packagingExpiration}
                              onChange={e => setPackagingExpiration(e.target.value)}
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Actual Quantity Produced <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={packagingQuantity}
                              onChange={e => setPackagingQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                              placeholder="Enter quantity"
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Packed By <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={packagingPackedBy}
                              onChange={e => setPackagingPackedBy(e.target.value)}
                              placeholder="Name of packer"
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Package Notes
                            </label>
                            <textarea
                              value={packagingNotes}
                              onChange={e => setPackagingNotes(e.target.value)}
                              rows={2}
                              placeholder="Optional notes"
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm resize-none text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                        </div>
                        <div className="mt-5 flex justify-end">
                          <button
                            onClick={() => setShowPackagingConfirm(true)}
                            disabled={packagingQuantity === "" || !packagingDate || !packagingExpiration || !packagingExpiry || !packagingPackedBy || packagingExpiration < packagingExpiry}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                          >
                            Submit & Go back to Production Tracking
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                  <Package size={22} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select a batch from the list to start packaging.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== CONFIGURATION TAB ========== */}
      {activeMainTab === "configuration" && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Production Configuration</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage finished products and their packaging variants
              </p>
            </div>
            <button
              onClick={handleOpenAddProduct}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">PRODUCT NAME</th>
                  <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">VARIANT</th>
                  <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {configLoading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-gray-400">
                      Loading products…
                    </td>
                  </tr>
                ) : finishedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                      No finished products found.
                    </td>
                  </tr>
                ) : (
                  finishedProducts.map((product, idx) => (
                    <tr key={product.id} className={`${idx < finishedProducts.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}>
                      <td className="px-2 py-2.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">{product.name}</td>
                      <td className="px-2 py-2.5 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {product.variant || <span className="italic text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-2.5">
                        <button
                          onClick={() => handleOpenEditProduct(product)}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors flex items-center gap-1.5"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <ConfigProductModal
            open={configModalOpen}
            onClose={() => setConfigModalOpen(false)}
            onSave={handleSaveProduct}
            initialName={editingProductName}
            initialVariant={editingProductVariant}
            mode={editingProductId ? "edit" : "add"}
          />
        </div>
      )}

      {/* ===== Modals ===== */}
      {showCreateModal && (
        <CreateBatchModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchBatches(); }}
        />
      )}

      {cancelTarget !== null && (
        <ConfirmModal
          message={`Cancel batch ${formatBatchId(cancelTarget)}? It will be moved to Cancelled status.`}
          onConfirm={confirmCancelBatch}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      {showQaConfirm && (
        <ConfirmModal
          message={`Submit QA results as PASS for ${formatBatchId(selectedBatch?.batchId)}?`}
          onConfirm={confirmQaPass}
          onCancel={() => setShowQaConfirm(false)}
        />
      )}

      {showQaFailureConfirm && (
        <ConfirmModal
          message="This batch has failed Quality Control. Confirm to mark it as Rejected."
          onConfirm={confirmQaFailure}
          onCancel={() => setShowQaFailureConfirm(false)}
        />
      )}

      {showPackagingConfirm && (
        <ConfirmModal
          message={`Complete packaging for ${formatBatchId(packagingSelectedBatchId)} and go back to production tracking?`}
          onConfirm={handlePackagingSubmit}
          onCancel={() => setShowPackagingConfirm(false)}
        />
      )}
    </div>
  );
}