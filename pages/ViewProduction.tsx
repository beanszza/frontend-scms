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
  ChevronLeft,
  ClipboardCheck,
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react";
import api from "../lib/api";
import CreateBatchModal from "../components/CreateBatchModal";
import ConfirmModal from "../components/ConfirmModal";

// ---------- Types ----------
type ProductionBatch = {
  batchId: number;
  productName: string;
  quantity: number;
  scheduleDate: string;
  status: string; // "Scheduled" | "In Progress" | "Passed QA" | "Cancelled" | "Rejected" | "Completed"
  currentStage: string;
};

type SummaryCounts = {
  scheduled: number;
  inProgress: number;
  passedQA: number;
  cancelled: number;
  rejected: number;
  completed: number;
};

type FinishedProduct = {
  id: string;
  name: string;
  variant: string;
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
let MOCK_BATCHES: ProductionBatch[] = [
  { batchId: 1, productName: "Ube Halaya Yam Pudding", quantity: 100, scheduleDate: "2026-06-09", status: "In Progress", currentStage: "Preparation" },
  { batchId: 2, productName: "Tocino", quantity: 200, scheduleDate: "2026-06-07", status: "Scheduled", currentStage: "Cooking" },
  { batchId: 3, productName: "Longganisa", quantity: 500, scheduleDate: "2026-06-12", status: "In Progress", currentStage: "Cooking" },
  { batchId: 4, productName: "Tocino", quantity: 200, scheduleDate: "2026-06-07", status: "Cancelled", currentStage: "Cooking" },
  { batchId: 5, productName: "Longganisa", quantity: 500, scheduleDate: "2026-06-12", status: "In Progress", currentStage: "Quality Control" },
  { batchId: 6, productName: "Empanada", quantity: 80, scheduleDate: "2026-06-10", status: "Scheduled", currentStage: "Mixing and Processing" },
  { batchId: 7, productName: "Siomai", quantity: 600, scheduleDate: "2026-06-14", status: "Passed QA", currentStage: "Packaging" },
  { batchId: 8, productName: "Tocino", quantity: 150, scheduleDate: "2026-06-05", status: "Completed", currentStage: "Packaging" },
  { batchId: 9, productName: "Longganisa", quantity: 300, scheduleDate: "2026-06-11", status: "Rejected", currentStage: "QA Review" },
  { batchId: 10, productName: "Empanada", quantity: 90, scheduleDate: "2026-06-15", status: "In Progress", currentStage: "Preparation" },
  { batchId: 11, productName: "Longganisa", quantity: 120, scheduleDate: "2026-06-13", status: "Scheduled", currentStage: "Cooling" },
];

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
const MOCK_STAGE_DATA: Record<number, Record<string, { images: string[]; comment: string }>> = {};

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
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setVariant(initialVariant);
      setShowConfirm(false);
    }
  }, [open, initialName, initialVariant]);

  const handleSubmit = () => {
    if (!name.trim() || !variant.trim()) return;
    setShowConfirm(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1D2939] border border-gray-200 dark:border-gray-700 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === "add" ? "Add Finished Product" : "Edit Finished Product"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ube Jam"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101828] py-2.5 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Variant</label>
            <input
              type="text"
              value={variant}
              onChange={e => setVariant(e.target.value)}
              placeholder="e.g. 300g"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101828] py-2.5 px-3 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim() || !variant.trim()} className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {mode === "add" ? "Add Product" : "Save Changes"}
          </button>
        </div>
        {showConfirm && (
          <ConfirmModal
            message={`Are you sure you want to ${mode === "add" ? "add" : "update"} ${name} ${variant}?`}
            onConfirm={() => { onSave(name, variant); setShowConfirm(false); onClose(); }}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </div>
  );
};

// ---------- Main Page Component ----------
export default function ProductionPage() {
  useDarkMode();

  // General state
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [summary, setSummary] = useState<SummaryCounts>({
    scheduled: 0,
    inProgress: 0,
    passedQA: 0,
    cancelled: 0,
    rejected: 0,
    completed: 0,
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
  const [finishedProducts, setFinishedProducts] = useState<FinishedProduct[]>([
    { id: "1", name: "Longganisa", variant: "500g" },
    { id: "2", name: "Tocino", variant: "300g" },
    { id: "3", name: "Siomai", variant: "1000g" },
  ]);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductName, setEditingProductName] = useState("");
  const [editingProductVariant, setEditingProductVariant] = useState("");

  // Reset tracking panels when switching batches
  useEffect(() => {
    setStagePanelVisible(false);
    setUploadFiles([]);
    setUploadPreviews([]);
    setUploadComment("");
    setStagePanelReadOnly(false);
    setStagePanelIsQcTransition(false);
  }, [trackingSelectedBatchId]);

  // Reset QA panel when selecting a different batch
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
  const fetchBatches = () => {
    setIsLoading(true);
    setTimeout(() => {
      let filtered = MOCK_BATCHES;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(b => b.productName.toLowerCase().includes(q));
      }
      if (statusFilter !== "All") {
        filtered = filtered.filter(b => b.status === statusFilter);
      }
      const limit = 10;
      const startIndex = (currentPage - 1) * limit;
      setBatches(filtered.slice(startIndex, startIndex + limit));
      setTotalPages(Math.ceil(filtered.length / limit));

      const all = MOCK_BATCHES;
      setSummary({
        scheduled: all.filter(b => b.status === "Scheduled").length,
        inProgress: all.filter(b => b.status === "In Progress").length,
        passedQA: all.filter(b => b.status === "Passed QA").length,
        cancelled: all.filter(b => b.status === "Cancelled").length,
        rejected: all.filter(b => b.status === "Rejected").length,
        completed: all.filter(b => b.status === "Completed").length,
      });
      setIsLoading(false);
    }, 600);
  };

  useEffect(() => { fetchBatches(); }, [currentPage, searchQuery, statusFilter]);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const isOverdue = (batch: ProductionBatch) => {
    if (batch.status === "Completed" || batch.status === "Cancelled" || batch.status === "Rejected") return false;
    const sched = new Date(batch.scheduleDate);
    const today = new Date(); today.setHours(0,0,0,0);
    return sched < today;
  };

  // ---------- Cancel batch (Scheduled only) ----------
  const handleCancelBatch = (batchId: number) => {
    setCancelTarget(batchId);
    setOpenDropdownId(null);
  };

  const confirmCancelBatch = () => {
    if (cancelTarget === null) return;
    const idx = MOCK_BATCHES.findIndex(b => b.batchId === cancelTarget);
    if (idx !== -1) {
      MOCK_BATCHES[idx] = { ...MOCK_BATCHES[idx], status: "Cancelled" };
    }
    setCancelTarget(null);
    fetchBatches();
  };

  // ---------- Start Production ----------
  const startStageBatch = (batchId: number) => {
    const idx = MOCK_BATCHES.findIndex(b => b.batchId === batchId);
    if (idx !== -1) {
      MOCK_BATCHES[idx] = { ...MOCK_BATCHES[idx], status: "In Progress" };
      fetchBatches();
    }
  };

  // ---------- QA Navigation ----------
  const goToQualityCheck = (batchId: number) => {
    setSelectedBatchId(batchId);
    setActiveMainTab("quality");
  };

  // ---------- QA Submission ----------
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
      await new Promise(resolve => setTimeout(resolve, 500));
      const idx = MOCK_BATCHES.findIndex(b => b.batchId === selectedBatch.batchId);
      if (idx !== -1) {
        // Advance to packaging
        MOCK_BATCHES[idx] = { ...MOCK_BATCHES[idx], status: "Passed QA", currentStage: "Packaging" };
      }
      setQaPassedBatchId(selectedBatch.batchId);
      fetchBatches();
    } catch (err) { console.error(err); }
    finally { setSubmittingQA(false); }
  };

  const confirmQaFailure = () => {
    if (!selectedBatch) return;
    const idx = MOCK_BATCHES.findIndex(b => b.batchId === selectedBatch.batchId);
    if (idx !== -1) {
      MOCK_BATCHES[idx] = { ...MOCK_BATCHES[idx], status: "Rejected" }; // QA fail -> Rejected
    }
    setShowQaFailureConfirm(false);
    fetchBatches();
  };

  const selectedBatch = selectedBatchId ? MOCK_BATCHES.find(b => b.batchId === selectedBatchId) ?? null : null;

  // ---------- Stage Update (Tracking) ----------
  const handleStageUpdateConfirm = () => {
    if (!trackingSelectedBatchId || !stagePanelStage) return;
    setIsStageSubmitting(true);
    setTimeout(() => {
      const idx = MOCK_BATCHES.findIndex(b => b.batchId === trackingSelectedBatchId);
      if (idx !== -1) {
        MOCK_BATCHES[idx] = { ...MOCK_BATCHES[idx], currentStage: stagePanelStage };
      }
      fetchBatches();
      setIsStageSubmitting(false);
      setShowStageConfirm(false);
      setStagePanelVisible(false);
      setUploadFiles([]);
      setUploadPreviews([]);
      setUploadComment("");
      setStagePanelReadOnly(false);
      setStagePanelIsQcTransition(false);
    }, 600);
  };

  // ---------- Packaging Handlers ----------
  const togglePackagingStep = (batchId: number, stepIdx: number) => {
    setPackagingCompletedSteps(prev => {
      const current = prev[batchId] || [];
      if (current.includes(stepIdx)) {
        return { ...prev, [batchId]: current.filter(i => i !== stepIdx).sort((a,b)=>a-b) };
      } else {
        if (stepIdx === 0 || current.includes(stepIdx-1)) {
          return { ...prev, [batchId]: [...current, stepIdx].sort((a,b)=>a-b) };
        }
        return prev;
      }
    });
  };

  const handleAddToInventory = () => {
    if (packagingSelectedBatchId && packagingQuantity !== "" && packagingDate && packagingExpiration && packagingExpiry && packagingPackedBy) {
      const idx = MOCK_BATCHES.findIndex(b => b.batchId === packagingSelectedBatchId);
      if (idx !== -1) {
        MOCK_BATCHES[idx] = { ...MOCK_BATCHES[idx], status: "Completed" };
      }
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
    }
  };

  // ---------- Configuration Handlers ----------
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setEditingProductName("");
    setEditingProductVariant("");
    setConfigModalOpen(true);
  };

  const handleOpenEditProduct = (product: FinishedProduct) => {
    setEditingProductId(product.id);
    setEditingProductName(product.name);
    setEditingProductVariant(product.variant);
    setConfigModalOpen(true);
  };

  const handleSaveProduct = (name: string, variant: string) => {
    if (editingProductId) {
      setFinishedProducts(prev => prev.map(p => p.id === editingProductId ? { ...p, name, variant } : p));
    } else {
      const newProduct: FinishedProduct = {
        id: Date.now().toString(),
        name,
        variant,
      };
      setFinishedProducts(prev => [...prev, newProduct]);
    }
  };

  // ---------- Summary Cards ----------
  const summaryCards = [
    { label: "Scheduled", value: summary.scheduled, icon: <Package size={20} />, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
    { label: "In Progress", value: summary.inProgress, icon: <Loader2 size={20} className="animate-spin" />, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
    { label: "Passed QA", value: summary.passedQA, icon: <ClipboardCheck size={20} />, color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10" },
    { label: "Rejected", value: summary.rejected, icon: <X size={20} />, color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
    { label: "Cancelled", value: summary.cancelled, icon: <X size={20} />, color: "text-gray-600 bg-gray-50 dark:bg-gray-500/10" },
    { label: "Completed", value: summary.completed, icon: <CheckCircle size={20} />, color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
  ];

  // Format batch ID
  const formatBatchId = (id: number | undefined | null) => {
    if (id == null) return "N/A";
    return `Batch-${String(id).padStart(3, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#101828] p-4 sm:p-6 transition-colors">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Production & Quality</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage production batches, track stages, and perform QA reviews.</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { key: "planning", label: "Production Planning" },
          { key: "tracking", label: "Production Tracking" },
          { key: "quality", label: "Quality Control" },
          { key: "packaging", label: "Packaging" },
          { key: "configuration", label: "Configuration" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveMainTab(tab.key as any);
              if (tab.key === "planning") setSelectedBatchId(null);
            }}
            className={`px-5 py-3 text-sm font-medium rounded-t-xl transition-colors whitespace-nowrap ${
              activeMainTab === tab.key
                ? "bg-white dark:bg-[#1D2939] text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== PRODUCTION PLANNING TAB ========== */}
      {activeMainTab === "planning" && (
        <>
          {/* Summary */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {summaryCards.map(card => (
              <div key={card.label} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
                <div className={`inline-flex p-2 rounded-lg ${card.color}`}>{card.icon}</div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h2>
              </div>
            ))}
          </div>

          {/* Create Batch Button */}
          <div className="mb-5 flex justify-end">
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus size={18} /> Create Batch
            </button>
          </div>

          {/* Search and Filter */}
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError(/^[A-Za-z0-9\s]*$/.test(e.target.value) ? "" : "Special characters are not allowed.");
                }}
                placeholder="Search by product..."
                className={`w-full rounded-xl border ${searchError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-[#1D2939] py-3 pl-11 pr-4 text-sm`}
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-5 flex gap-2 flex-wrap">
            {["All","Scheduled","In Progress","Rejected","Cancelled","Completed"].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  statusFilter === tab ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-[#1D2939] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1D2939]">
                  <th className="px-5 py-4">Batch ID</th>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Quantity</th>
                  <th className="px-5 py-4">Schedule Date</th>
                  <th className="px-5 py-4">Current Stage</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading batches...</td></tr>
                ) : batches.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-sm font-semibold text-gray-500">No Results Found</td></tr>
                ) : (
                  batches.map(batch => {
                    const overdue = isOverdue(batch);
                    return (
                      <tr key={batch.batchId} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${overdue ? "bg-red-50 dark:bg-red-500/5" : ""}`}>
                        <td className="px-5 py-5 text-sm font-medium">{formatBatchId(batch.batchId)}</td>
                        <td className="px-5 py-5 text-sm max-w-[150px] break-words">{batch.productName}</td>
                        <td className="px-5 py-5 text-sm">{batch.quantity}</td>
                        <td className="px-5 py-5 text-sm">
                          <span className="flex items-center gap-1">{batch.scheduleDate}{overdue && <AlertTriangle size={14} className="text-red-500"/>}</span>
                        </td>
                        <td className="px-5 py-5"><span className="rounded-lg bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium">{batch.currentStage}</span></td>
                        <td className="px-5 py-5">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full w-max ${
                            batch.status === "Completed" ? "text-green-600 bg-green-50" :
                            batch.status === "Rejected" ? "text-red-600 bg-red-50" :
                            batch.status === "Cancelled" ? "text-gray-600 bg-gray-50" :
                            batch.status === "In Progress" ? "text-amber-600 bg-amber-50" :
                            batch.status === "Passed QA" ? "text-purple-600 bg-purple-50" :
                            "text-blue-600 bg-blue-50"
                          }`}>
                            {batch.status}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <div className="relative flex justify-end" ref={openDropdownId === batch.batchId ? dropdownRef : undefined}>
                            <button onClick={() => setOpenDropdownId(openDropdownId === batch.batchId ? null : batch.batchId)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700">
                              <MoreHorizontal size={18}/>
                            </button>
                            {openDropdownId === batch.batchId && (
                              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border bg-white dark:bg-[#1D2939] shadow-lg z-50 py-1">
                                {batch.status === "Scheduled" && (
                                  <button onClick={() => { startStageBatch(batch.batchId); setOpenDropdownId(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <ChevronRight size={16}/> Start Production
                                  </button>
                                )}
                                {batch.status === "Scheduled" && (
                                  <button onClick={() => handleCancelBatch(batch.batchId)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <Trash2 size={16}/> Cancel Batch
                                  </button>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-4 py-2 text-sm rounded-xl border disabled:opacity-50">Previous</button>
              <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-4 py-2 text-sm rounded-xl border disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}

      {/* ========== PRODUCTION TRACKING TAB ========== */}
      {activeMainTab === "tracking" && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-80 order-2 lg:order-1">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-4">
              <h3 className="text-sm font-semibold mb-4">Active Batches</h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {MOCK_BATCHES.filter(b => b.status === "In Progress").length === 0 ? (
                  <p className="text-sm text-gray-500">No active batches.</p>
                ) : (
                  MOCK_BATCHES.filter(b => b.status === "In Progress").map(batch => (
                    <button key={batch.batchId} onClick={() => setTrackingSelectedBatchId(batch.batchId)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${trackingSelectedBatchId === batch.batchId ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                      <p className="text-sm font-medium">{formatBatchId(batch.batchId)} – {batch.productName}</p>
                      <p className="text-xs text-gray-500 mt-1">Stage: {batch.currentStage}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 order-1 lg:order-2">
            {trackingSelectedBatchId ? (
              (() => {
                const batch = MOCK_BATCHES.find(b => b.batchId === trackingSelectedBatchId);
                if (!batch) return <div className="rounded-2xl border p-6 text-center">Batch not found.</div>;

                const currentStage = batch.currentStage;
                const currentIdx = STAGES.indexOf(currentStage as any);
                const completedCount = currentIdx >= 0 ? currentIdx : 0;
                const progressPercent = (completedCount / STAGES.length) * 100;

                return (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-6">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold">Tracking {formatBatchId(batch.batchId)}</h2>
                      <p className="text-sm text-gray-500">{batch.productName} – {batch.quantity} units</p>
                      <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}/>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                      {STAGES.map((stage, idx) => {
                        const isCompleted = idx < currentIdx;
                        const isCurrent = idx === currentIdx;
                        const isNext = !isCompleted && !isCurrent && idx === currentIdx + 1;
                        const circleClasses = isCompleted ? "bg-green-500 border-green-500 text-white" : isCurrent ? "bg-blue-500 border-blue-500 text-white" : isNext ? "border-2 border-blue-400 text-blue-400" : "border-2 border-gray-300 text-gray-400";
                        const boxClasses = `flex items-center p-4 rounded-xl border ${isNext ? "cursor-pointer hover:bg-blue-50 border-blue-400" : isCurrent ? "border-blue-400 bg-blue-50 cursor-pointer hover:bg-blue-100" : isCompleted ? "border-green-400 bg-green-50 cursor-pointer hover:bg-green-100" : "border-gray-200 bg-gray-50 opacity-60"}`;

                        const handleClick = () => {
                          if (isCompleted || isCurrent) {
                            const data = MOCK_STAGE_DATA[batch.batchId]?.[stage];
                            setStagePanelStage(stage);
                            setStagePanelVisible(true);
                            setStagePanelReadOnly(true);
                            setStagePanelIsQcTransition(false);
                            setUploadPreviews(data?.images || []);
                            setUploadComment(data?.comment || "");
                            setUploadFiles([]);
                          } else if (isNext) {
                            if (stage === "Quality Control") {
                              // Special handling for QC transition
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

                        return (
                          <div key={stage} className="w-full">
                            <button onClick={handleClick} disabled={!isCompleted && !isCurrent && !isNext} className={`w-full ${boxClasses}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${circleClasses}`}>
                                {isCompleted ? <Check size={16} strokeWidth={3}/> : isCurrent ? <div className="w-3 h-3 rounded-full bg-white"/> : isNext ? <div className="w-3 h-3 rounded-full border-2 border-current"/> : <div className="w-3 h-3 rounded-full border-2 border-current opacity-40"/>}
                              </div>
                              <span className="ml-3 text-sm font-medium">{stage}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {stagePanelVisible && stagePanelStage && (
                      stagePanelIsQcTransition ? (
                        // Special panel for QC transition
                        <div className="border border-green-400 rounded-xl p-6 bg-green-50 dark:bg-green-500/10 text-center">
                          <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
                          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">Quality Control stage reached!</h3>
                          <p className="text-sm text-green-700 dark:text-green-300 mb-4">Ready for Quality Check.</p>
                          <button
                            onClick={() => goToQualityCheck(batch.batchId)}
                            className="px-5 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700"
                          >
                            Go to Quality Control
                          </button>
                        </div>
                      ) : (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">{stagePanelStage}</h3>
                              <p className="text-sm text-gray-500">Stage {STAGES.indexOf(stagePanelStage as any) + 1} of {STAGES.length}</p>
                            </div>
                            {!stagePanelReadOnly && (
                              <button onClick={() => setShowStageConfirm(true)} disabled={uploadFiles.length === 0 || isStageSubmitting} className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                                {isStageSubmitting ? <Loader2 size={16} className="animate-spin"/> : "Submit Stage Update"}
                              </button>
                            )}
                          </div>

                          {stagePanelReadOnly ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">Uploaded Images</label>
                                {uploadPreviews.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    {uploadPreviews.map((src, i) => <img key={i} src={src} className="w-full h-24 object-cover rounded-lg"/>)}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-gray-400"><Upload size={28}/> <p className="text-sm">No images uploaded.</p></div>
                                )}
                              </div>
                              <div className="flex flex-col min-h-[120px]">
                                <label className="block text-sm font-medium mb-2">Comments</label>
                                <textarea value={uploadComment} readOnly className="w-full flex-1 rounded-xl border bg-gray-100 dark:bg-gray-700 p-3 text-sm resize-none opacity-70" rows={4}/>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">Upload Images</label>
                                <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:bg-gray-100">
                                  <Upload size={28} className="text-gray-400 mb-2"/> <p className="text-sm text-gray-500">Click to add images</p>
                                </div>
                                <input ref={fileInputRef} type="file" multiple accept="image/png,image/jpeg,image/jpg" onChange={e => {
                                  const files = Array.from(e.target.files||[]).filter(f => f.type.startsWith("image/"));
                                  setUploadFiles(prev => [...prev, ...files]);
                                  files.forEach(f => setUploadPreviews(prev => [...prev, URL.createObjectURL(f)]));
                                  e.target.value = "";
                                }} className="hidden"/>
                                {uploadPreviews.length > 0 && (
                                  <div className="mt-3 grid grid-cols-3 gap-3">
                                    {uploadPreviews.map((src, i) => (
                                      <div key={i} className="relative group rounded-lg overflow-hidden">
                                        <img src={src} className="w-full h-20 object-cover"/>
                                        <button onClick={() => { setUploadPreviews(prev => prev.filter((_,j)=>j!==i)); setUploadFiles(prev => prev.filter((_,j)=>j!==i)); }} className="absolute top-1 right-1 p-1 bg-white rounded-full shadow opacity-0 group-hover:opacity-100"><Trash2 size={14} className="text-red-500"/></button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col min-h-[120px]">
                                <label className="block text-sm font-medium mb-2">Add Comments</label>
                                <textarea value={uploadComment} onChange={e => setUploadComment(e.target.value)} placeholder="Optional comments..." className="w-full flex-1 rounded-xl border bg-white dark:bg-[#101828] p-3 text-sm resize-none" rows={4}/>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                    {showStageConfirm && (
                      <ConfirmModal message={`Update the current stage into ${stagePanelStage}?`} onConfirm={handleStageUpdateConfirm} onCancel={() => setShowStageConfirm(false)}/>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-2xl border p-6 text-center text-gray-500">
                <Package size={32} className="mx-auto mb-3 opacity-50"/>
                <p>Select an active batch from the left panel to view tracking details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== QUALITY CONTROL TAB ========== */}
      {activeMainTab === "quality" && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-80 order-2 lg:order-1">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-4">
              <h3 className="text-sm font-semibold mb-4">Batches</h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {MOCK_BATCHES.filter(b => b.status === "In Progress" && b.currentStage === "Quality Control").length === 0 ? (
                  <p className="text-sm text-gray-500">No batches ready for QA.</p>
                ) : (
                  MOCK_BATCHES.filter(b => b.status === "In Progress" && b.currentStage === "Quality Control").map(batch => (
                    <button key={batch.batchId} onClick={() => { setSelectedBatchId(batch.batchId); setQaPassedBatchId(null); }}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedBatchId === batch.batchId ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                      <p className="text-sm font-medium">{formatBatchId(batch.batchId)} – {batch.productName}</p>
                      <p className="text-xs text-gray-500 mt-1">Status: {batch.status}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 order-1 lg:order-2">
            {selectedBatch ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-6">
                {qaPassedBatchId === selectedBatch.batchId ? (
                  <div className="text-center p-8">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4"/>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Batch passed Quality Control!</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Proceed to the Packaging tab to complete packaging and add to inventory.</p>
                    <button onClick={() => { setActiveMainTab("packaging"); setPackagingSelectedBatchId(selectedBatch.batchId); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700">Proceed to packaging</button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold">Quality Control – {formatBatchId(selectedBatch.batchId)}</h2>
                      <p className="text-sm text-gray-500">Quality Checking - {selectedBatch.productName}</p>
                    </div>

                    <div className="space-y-3 max-w-xl">
                      {[
                        { label: "Taste", value: taste, setter: setTaste },
                        { label: "Texture", value: texture, setter: setTexture },
                        { label: "Packaging", value: packagingQA, setter: setPackagingQA },
                        { label: "Appearance", value: appearance, setter: setAppearance },
                      ].map(field => {
                        const isPassed = field.value === "Pass";
                        return (
                          <div key={field.label} onClick={() => field.setter(isPassed ? "Fail" : "Pass")}
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition-colors ${isPassed ? "border-green-400 bg-green-50" : "border-gray-200 bg-white dark:bg-[#101828]"}`}>
                            <span className={`text-sm font-medium ${isPassed ? "text-green-700" : "text-gray-700"}`}>{field.label}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${isPassed ? "text-green-600" : "text-gray-400"}`}>{isPassed ? "Pass" : "Fail"}</span>
                              <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${isPassed ? "bg-green-500 border-green-500" : "bg-white border-gray-300"}`}>
                                {isPassed && <Check size={12} className="text-white" strokeWidth={3}/>}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Quality Control Inspector */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quality Control Inspector</label>
                        <input
                          type="text"
                          value={qaInspector}
                          onChange={e => setQaInspector(e.target.value)}
                          placeholder="Inspector name"
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101828] p-2.5 text-sm"
                        />
                      </div>

                      {/* QA Image Upload */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload QA Images</label>
                        <div onClick={() => {
                          const input = document.getElementById('qa-image-upload') as HTMLInputElement;
                          input?.click();
                        }} className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50">
                          <Upload size={28} className="text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Click to add QA images (required)</p>
                        </div>
                        <input
                          id="qa-image-upload"
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={e => {
                            const files = Array.from(e.target.files||[]).filter(f => f.type.startsWith("image/"));
                            setQaImages(prev => [...prev, ...files]);
                            files.forEach(f => setQaImagePreviews(prev => [...prev, URL.createObjectURL(f)]));
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                        {qaImagePreviews.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            {qaImagePreviews.map((src, i) => (
                              <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img src={src} className="w-full h-20 object-cover" />
                                <button onClick={() => {
                                  setQaImagePreviews(prev => prev.filter((_,j) => j !== i));
                                  setQaImages(prev => prev.filter((_,j) => j !== i));
                                }} className="absolute top-1 right-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow opacity-0 group-hover:opacity-100">
                                  <Trash2 size={14} className="text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Overall Inspection Comment */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Overall Inspection Comment</label>
                        <textarea
                          value={overallComment}
                          onChange={e => setOverallComment(e.target.value)}
                          placeholder="Any additional comments..."
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101828] p-3 text-sm resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => { setSelectedBatchId(null); setActiveMainTab("planning"); }} className="px-4 py-2 text-sm rounded-xl border text-gray-700 hover:bg-gray-50">Back to Planning</button>
                        <button
                          onClick={handleQaSubmit}
                          disabled={submittingQA || !qaInspector.trim() || qaImages.length === 0}
                          className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submittingQA ? <Loader2 size={16} className="animate-spin"/> : "Submit QA & Decision"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border p-6 text-center text-gray-500">
                <ClipboardCheck size={32} className="mx-auto mb-3 opacity-50"/>
                <p>Select a batch from the left panel to begin quality control.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== PACKAGING TAB ========== */}
      {activeMainTab === "packaging" && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-80 order-2 lg:order-1">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-4">
              <h3 className="text-sm font-semibold mb-4">Batches</h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {MOCK_BATCHES.filter(b => b.status === "Passed QA").length === 0 ? (
                  <p className="text-sm text-gray-500">No batches ready for packaging.</p>
                ) : (
                  MOCK_BATCHES.filter(b => b.status === "Passed QA").map(batch => (
                    <button key={batch.batchId} onClick={() => { setPackagingSelectedBatchId(batch.batchId); setPackagingQuantity(""); setPackagingDate(new Date().toISOString().split("T")[0]); setPackagingExpiration(""); setPackagingExpiry(""); setPackagingNotes(""); setPackagingPackedBy(""); }}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${packagingSelectedBatchId === batch.batchId ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                      <p className="text-sm font-medium">{formatBatchId(batch.batchId)} – {batch.productName}</p>
                      <p className="text-xs text-gray-500 mt-1">Quantity: {batch.quantity}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 order-1 lg:order-2">
            {packagingSelectedBatchId ? (
              (() => {
                const batch = MOCK_BATCHES.find(b => b.batchId === packagingSelectedBatchId);
                if (!batch) return <div className="rounded-2xl border p-6 text-center">Batch not found.</div>;

                const stepsDone = (packagingCompletedSteps[batch.batchId] || []).length;
                const progressPercent = (stepsDone / PACKAGING_STEPS.length) * 100;
                const allStepsDone = stepsDone === PACKAGING_STEPS.length;

                return (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-6">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold">Packaging {formatBatchId(batch.batchId)}</h2>
                      <p className="text-sm text-gray-500">{batch.productName} – {batch.quantity} units</p>
                      <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}/>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-semibold mb-3">Packaging Checklist</h3>
                      <p className="text-xs text-gray-500 mb-4">Instruction: Check off each step as it is completed</p>
                      <div className="space-y-2">
                        {PACKAGING_STEPS.map((step, idx) => {
                          const isChecked = (packagingCompletedSteps[batch.batchId] || []).includes(idx);
                          const canCheck = idx === 0 || (packagingCompletedSteps[batch.batchId] || []).includes(idx-1);
                          return (
                            <div key={idx} onClick={() => togglePackagingStep(batch.batchId, idx)}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                isChecked ? "border-green-400 bg-green-50" :
                                canCheck ? "border-gray-200 bg-white dark:bg-[#101828] hover:bg-gray-50" :
                                "border-gray-200 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed"
                              }`}>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isChecked ? "bg-green-500 border-green-500" : "border-gray-300"
                              }`}>
                                {isChecked && <Check size={12} className="text-white" strokeWidth={3}/>}
                              </div>
                              <span className={`text-sm ${isChecked ? "text-green-700 line-through" : "text-gray-700"}`}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {allStepsDone && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="text-lg font-semibold mb-4">Packaging Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Packaging Date</label>
                            <input type="date" value={packagingDate} onChange={e => setPackagingDate(e.target.value)}
                              className="w-full rounded-xl border px-3 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Expiration</label>
                            <input type="date" value={packagingExpiration} onChange={e => setPackagingExpiration(e.target.value)}
                              className="w-full rounded-xl border px-3 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Expiry Date</label>
                            <input type="date" value={packagingExpiry} onChange={e => setPackagingExpiry(e.target.value)}
                              className="w-full rounded-xl border px-3 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Actual Quantity Produced</label>
                            <input type="number" value={packagingQuantity} onChange={e => setPackagingQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Enter quantity" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Packed by</label>
                            <input type="text" value={packagingPackedBy} onChange={e => setPackagingPackedBy(e.target.value)}
                              className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Name of packer" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Package Notes</label>
                            <textarea value={packagingNotes} onChange={e => setPackagingNotes(e.target.value)} rows={2}
                              className="w-full rounded-xl border px-3 py-2 text-sm resize-none" placeholder="Optional notes" />
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button onClick={() => setShowPackagingConfirm(true)}
                            disabled={packagingQuantity === "" || !packagingDate || !packagingExpiration || !packagingExpiry || !packagingPackedBy}
                            className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                            Add To Inventory
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-2xl border p-6 text-center text-gray-500">
                <Package size={32} className="mx-auto mb-3 opacity-50"/>
                <p>Select a batch from the left panel to start packaging.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== CONFIGURATION TAB ========== */}
      {activeMainTab === "configuration" && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Production Configuration</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage finished products and recipes / bill of materials</p>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Finished Products</h3>
            <button onClick={handleOpenAddProduct} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus size={18} /> Add Product
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full min-w-[500px]">
              <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">Variant</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {finishedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-gray-500">No products found.</td>
                  </tr>
                ) : (
                  finishedProducts.map(product => (
                    <tr key={product.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">{product.name}</td>
                      <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{product.variant}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => handleOpenEditProduct(product)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Edit</button>
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

      {/* Modals */}
      {showCreateModal && <CreateBatchModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); fetchBatches(); }} />}

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
          message={`This batch has failed Quality Control. Confirm to mark it as Rejected.`}
          onConfirm={confirmQaFailure}
          onCancel={() => setShowQaFailureConfirm(false)}
        />
      )}

      {showPackagingConfirm && (
        <ConfirmModal
          message={`Add ${formatBatchId(packagingSelectedBatchId)} to inventory with quantity ${packagingQuantity}?`}
          onConfirm={handleAddToInventory}
          onCancel={() => setShowPackagingConfirm(false)}
        />
      )}
    </div>
  );
}