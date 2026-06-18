// web-scms\pages\ViewProduction.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Package, AlertTriangle, CheckCircle, Search, Plus, Upload, Check, X,
  ChevronRight, ChevronLeft, ClipboardCheck, MoreHorizontal, Trash2,
  Loader2,
} from "lucide-react";
import api from "../lib/api";
import CreateBatchModal from "../components/CreateBatchModal";
import UploadImagesModal from "../components/UploadImagesModal";
import ConfirmModal from "../components/ConfirmModal";

// ---------- Types ----------
type ProductionBatch = {
  batchId: number;
  productName: string;
  quantity: number;
  scheduleDate: string;
  status: string;
  currentStage: string;
};

type SummaryCounts = {
  active: number;
  completed: number;
  delayed: number;
  rejected: number;
};

// ---------- MOCK DATA (mutable) ----------
let MOCK_BATCHES: ProductionBatch[] = [
  {
    batchId: 1001,
    productName: "Ube Halaya Yam Pudding with tidbits",
    quantity: 100,
    scheduleDate: "2026-06-09",
    status: "In progress",
    currentStage: "QA Review",
  },
  {
    batchId: 1002,
    productName: "Tocino",
    quantity: 200,
    scheduleDate: "2026-06-07",
    status: "Delayed",
    currentStage: "Cooking",
  },
  {
    batchId: 1043,
    productName: "Longganisa",
    quantity: 500,
    scheduleDate: "2026-06-12",
    status: "In progress",
    currentStage: "Peeling",
  },
  {
    batchId: 1202,
    productName: "Tocino",
    quantity: 200,
    scheduleDate: "2026-06-07",
    status: "Delayed",
    currentStage: "Cooking",
  },
  {
    batchId: 1003,
    productName: "Longganisa",
    quantity: 500,
    scheduleDate: "2026-06-12",
    status: "In progress",
    currentStage: "Peeling",
  },
  {
    batchId: 1011,
    productName: "Longganisa",
    quantity: 100,
    scheduleDate: "2026-06-09",
    status: "In progress",
    currentStage: "QA Review",
  },
  {
    batchId: 1032,
    productName: "Tocino",
    quantity: 200,
    scheduleDate: "2026-06-07",
    status: "Delayed",
    currentStage: "Cooking",
  },
  {
    batchId: 1005,
    productName: "Tocino",
    quantity: 150,
    scheduleDate: "2026-06-05",
    status: "In Progress",
    currentStage: "Packaging",
  },
  {
    batchId: 1006,
    productName: "Empanada",
    quantity: 80,
    scheduleDate: "2026-06-10",
    status: "Planned",
    currentStage: "Mixing",
  },
  {
    batchId: 1007,
    productName: "Longganisa",
    quantity: 300,
    scheduleDate: "2026-06-11",
    status: "Reviewing",
    currentStage: "QA Review",
  },
  {
    batchId: 1008,
    productName: "Tocino",
    quantity: 250,
    scheduleDate: "2026-06-01",
    status: "Delayed",
    currentStage: "Rejected",
  },
  {
    batchId: 1009,
    productName: "Siomai",
    quantity: 600,
    scheduleDate: "2026-06-14",
    status: "Planned",
    currentStage: "Cooking",
  },
  {
    batchId: 1010,
    productName: "Empanada",
    quantity: 90,
    scheduleDate: "2026-06-15",
    status: "In progress",
    currentStage: "Peeling",
  },
  {
    batchId: 1012,
    productName: "Longganisa",
    quantity: 120,
    scheduleDate: "2026-06-13",
    status: "Reviewing",
    currentStage: "QA Review",
  },
];

// ---------- Dark Mode Hook ----------
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

// ---------- Stage definitions ----------
const STAGES = ["Peeling", "Steaming", "Mixing", "Cooking", "Cooling", "Packaging"] as const;
const STAGE_ICONS: Record<string, React.ReactNode> = {
  Peeling: <Package size={17} />,
  Steaming: <Upload size={17} />,
  Mixing: <Package size={17} />,
  Cooking: <Package size={17} />,
  Cooling: <Package size={17} />,
  Packaging: <Package size={17} />,
};

export default function ProductionPage() {
  useDarkMode();

  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [summary, setSummary] = useState<SummaryCounts>({
    active: 0,
    completed: 0,
    delayed: 0,
    rejected: 0,
  });

  const [activeMainTab, setActiveMainTab] = useState<"planning" | "tracking" | "quality">("planning");
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  const [pendingQaConfirm, setPendingQaConfirm] = useState<ProductionBatch | null>(null);
  const [pendingTrackingConfirm, setPendingTrackingConfirm] = useState<ProductionBatch | null>(null);

  // QA form state
  const [taste, setTaste] = useState("Pass");
  const [texture, setTexture] = useState("Pass");
  const [packagingQA, setPackagingQA] = useState("Pass");
  const [appearance, setAppearance] = useState("Pass");
  const [qaNotes, setQaNotes] = useState("");
  const [submittingQA, setSubmittingQA] = useState(false);
  const [showQaConfirm, setShowQaConfirm] = useState(false);

  const validateNoSpecialChars = (text: string) => {
    return /^[A-Za-z0-9\s]*$/.test(text);
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------- Fetch / refresh ----------
  const fetchBatches = () => {
    setIsLoading(true);
    setTimeout(() => {
      let filtered = MOCK_BATCHES;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (b) => b.productName.toLowerCase().includes(q)
        );
      }

      const limit = 10;
      const startIndex = (currentPage - 1) * limit;
      const paged = filtered.slice(startIndex, startIndex + limit);
      setBatches(paged);
      setTotalPages(Math.ceil(filtered.length / limit));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const allBatches = MOCK_BATCHES;

      setSummary({
        active: allBatches.filter(
          (b) => b.status !== "Completed" && b.status !== "Rejected"
        ).length,
        completed: allBatches.filter((b) => b.status === "Completed").length,
        delayed: allBatches.filter((b) => {
          const sched = new Date(b.scheduleDate);
          return (
            b.status !== "Completed" &&
            b.status !== "Rejected" &&
            sched < today
          );
        }).length,
        rejected: allBatches.filter((b) => b.status === "Rejected").length,
      });

      setIsLoading(false);
    }, 600);
  };

  useEffect(() => {
    fetchBatches();
  }, [currentPage, searchQuery]);

  const isOverdue = (batch: ProductionBatch) => {
    const scheduleDate = new Date(batch.scheduleDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      batch.status !== "Completed" &&
      batch.status !== "Rejected" &&
      scheduleDate < today
    );
  };

  // ---------- Delete handler ----------
  const handleDelete = (batchId: number) => {
    setDeleteTarget(batchId);
    setOpenDropdownId(null);
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    MOCK_BATCHES = MOCK_BATCHES.filter((b) => b.batchId !== deleteTarget);
    setDeleteTarget(null);
    fetchBatches();
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  // ---------- Navigation handlers ----------
  const handleQaChecklistClick = (batch: ProductionBatch) => {
    setOpenDropdownId(null);
    setPendingQaConfirm(batch);
  };

  const handleUpdateStageClick = (batch: ProductionBatch) => {
    setOpenDropdownId(null);
    setPendingTrackingConfirm(batch);
  };

  const confirmNavigateToQA = () => {
    if (pendingQaConfirm) {
      setSelectedBatchId(pendingQaConfirm.batchId);
      setActiveMainTab("quality");
      setTaste("Pass");
      setTexture("Pass");
      setPackagingQA("Pass");
      setAppearance("Pass");
      setQaNotes("");
      setShowQaConfirm(false);
    }
    setPendingQaConfirm(null);
  };

  const confirmNavigateToTracking = () => {
    if (pendingTrackingConfirm) {
      setSelectedBatchId(pendingTrackingConfirm.batchId);
      setActiveMainTab("tracking");
    }
    setPendingTrackingConfirm(null);
  };

  // ---------- QA Submission ----------
  const selectedBatch = selectedBatchId
    ? MOCK_BATCHES.find((b) => b.batchId === selectedBatchId) ?? null
    : null;

  const handleQaSubmit = async () => {
    if (!selectedBatch) return;

    setSubmittingQA(true);
    setShowQaConfirm(false);
    try {
      const qaPayload = { taste, texture, packaging: packagingQA, appearance, notes: qaNotes };
      await api.put(`/api/scms/api/ProductionBatches/${selectedBatch.batchId}/qa`, qaPayload);

      setSelectedBatchId(null);
      setActiveMainTab("planning");
      fetchBatches();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingQA(false);
    }
  };

  // ---------- Summary cards ----------
  const summaryCards = [
    {
      label: "Active Batches",
      value: summary.active,
      icon: <Package size={20} />,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
    },
    {
      label: "Completed",
      value: summary.completed,
      icon: <CheckCircle size={20} />,
      color: "text-green-600 bg-green-50 dark:bg-green-500/10",
    },
    {
      label: "Delayed",
      value: summary.delayed,
      icon: <AlertTriangle size={20} />,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: "Rejected",
      value: summary.rejected,
      icon: <X size={20} />,
      color: "text-red-600 bg-red-50 dark:bg-red-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#101828] p-4 sm:p-6 transition-colors">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Production & Quality
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage production batches, track stages, and perform QA reviews.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 self-start sm:self-auto"
        >
          <Plus size={18} />
          Create Batch
        </button>
      </div>

      {/* Main Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: "planning", label: "Production Planning" },
          { key: "tracking", label: "Production Tracking" },
          { key: "quality", label: "Quality Control" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveMainTab(tab.key as typeof activeMainTab);
              if (tab.key === "planning") setSelectedBatchId(null);
            }}
            className={`px-5 py-3 text-sm font-medium rounded-t-xl transition-colors ${
              activeMainTab === tab.key
                ? "bg-white dark:bg-[#1D2939] text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Containers */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5"
          >
            <div className={`inline-flex p-2 rounded-lg ${card.color}`}>
              {card.icon}
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      {/* ========== PRODUCTION PLANNING TAB ========== */}
      {activeMainTab === "planning" && (
        <>
          {/* Search */}
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (!validateNoSpecialChars(val)) {
                    setSearchError("Special characters are not allowed.");
                  } else {
                    setSearchError("");
                  }
                }}
                placeholder="Search by product..."
                className={`w-full rounded-xl border ${searchError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-[#1D2939] py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {searchError && <p className="absolute -bottom-5 left-0 text-[10px] text-red-500">{searchError}</p>}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1D2939]">
                  <th className="px-5 py-4">Batch No.</th>
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
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">
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
                  batches.map((batch) => {
                    const highlightRed = batch.status === "Delayed";
                    const showWarning = isOverdue(batch) || batch.status === "Delayed";
                    return (
                      <tr
                        key={batch.batchId}
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          highlightRed ? "bg-red-50 dark:bg-red-500/5" : ""
                        }`}
                      >
                        <td className="px-5 py-5 text-sm font-medium text-gray-900 dark:text-white">
                          #{batch.batchId}
                        </td>
                        <td className="px-5 py-5 text-sm text-gray-900 dark:text-white max-w-[120px] sm:max-w-[150px] md:max-w-[200px] break-words">
                          {batch.productName}
                        </td>
                        <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                          {batch.quantity}
                        </td>
                        <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                          <span className="flex items-center gap-1">
                            {batch.scheduleDate}
                            {showWarning && (
                              <AlertTriangle size={14} className="text-red-500" />
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <span className="rounded-lg bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {batch.currentStage}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full w-max ${
                              batch.status === "Completed"
                                ? "text-green-600 bg-green-50 dark:bg-green-500/10"
                                : batch.status === "Rejected"
                                ? "text-red-600 bg-red-50 dark:bg-red-500/10"
                                : batch.status === "Delayed"
                                ? "text-amber-600 bg-amber-50 dark:bg-amber-500/10"
                                : "text-blue-600 bg-blue-50 dark:bg-blue-500/10"
                            }`}
                          >
                            {batch.status}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <div className="relative flex justify-end" ref={openDropdownId === batch.batchId ? dropdownRef : undefined}>
                            <button
                              onClick={() =>
                                setOpenDropdownId(
                                  openDropdownId === batch.batchId ? null : batch.batchId
                                )
                              }
                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {openDropdownId === batch.batchId && (
                              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] shadow-lg z-50 py-1">
                                <button
                                  onClick={() => handleQaChecklistClick(batch)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                  <ClipboardCheck size={16} /> QA Checklist
                                </button>
                                {batch.status !== "Completed" &&
                                  batch.status !== "Rejected" && (
                                    <button
                                      onClick={() => handleUpdateStageClick(batch)}
                                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                      <ChevronRight size={16} /> Update Stage
                                    </button>
                                  )}
                                <button
                                  onClick={() => handleDelete(batch.batchId)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                                >
                                  <Trash2 size={16} /> Delete Batch
                                </button>
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
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] disabled:opacity-50 flex items-center gap-1 text-gray-700 dark:text-gray-300"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] disabled:opacity-50 flex items-center gap-1 text-gray-700 dark:text-gray-300"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ========== PRODUCTION TRACKING TAB ========== */}
      {activeMainTab === "tracking" && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-6">
          {selectedBatch ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tracking Batch #{selectedBatch.batchId}
                </h2>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedBatch.productName} – {selectedBatch.quantity} units
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    OVERALL PROGRESS:
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-8">
                {STAGES.map((stage, idx) => {
                  const currentIdx = STAGES.indexOf(selectedBatch.currentStage as any);
                  const isCompleted = idx < currentIdx;
                  const isCurrent = stage === selectedBatch.currentStage;
                  return (
                    <div key={stage} className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-2 px-7 py-5 rounded-lg text-sm font-medium border ${
                          isCurrent
                            ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                            : isCompleted
                            ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                            : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {isCompleted ? <CheckCircle size={14} /> : STAGE_ICONS[stage]}
                        {stage}
                      </div>
                      {idx < STAGES.length - 1 && (
                        <ChevronRight size={17} className="text-gray-300 dark:text-gray-700" />
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowUploadModal(selectedBatch.batchId)}
                disabled={selectedBatch.status === "Completed" || selectedBatch.status === "Rejected"}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                <Upload size={16} />
                Update Stage & Upload Images
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Package size={32} className="mx-auto mb-3 opacity-50" />
              <p>Select a batch from Production Planning and use <strong>Update Stage</strong> to view tracking.</p>
            </div>
          )}
        </div>
      )}

      {/* ========== QUALITY CONTROL TAB ========== */}
      {activeMainTab === "quality" && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-6">
          {selectedBatch ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Quality Control – Batch #{selectedBatch.batchId}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Quality Checking - {selectedBatch.productName}
                </p>
              </div>

              <div className="space-y-3 max-w-xl">
                {[
                  { label: "Taste", value: taste, setter: setTaste },
                  { label: "Texture", value: texture, setter: setTexture },
                  { label: "Packaging", value: packagingQA, setter: setPackagingQA },
                  { label: "Appearance", value: appearance, setter: setAppearance },
                ].map((field) => {
                  const isPassed = field.value === "Pass";
                  return (
                    <div
                      key={field.label}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                        isPassed
                          ? "border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-500/10"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101828]"
                      }`}
                      onClick={() => field.setter(isPassed ? "Fail" : "Pass")}
                    >
                      <span className={`text-sm font-medium ${
                        isPassed
                          ? "text-green-700 dark:text-green-300"
                          : "text-gray-700 dark:text-gray-300"
                      }`}>
                        {field.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${
                          isPassed ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
                        }`}>
                          {isPassed ? "Pass" : "Fail"}
                        </span>
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                            isPassed
                              ? "bg-green-500 border-green-500"
                              : "bg-white dark:bg-[#101828] border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isPassed && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedBatchId(null);
                      setActiveMainTab("planning");
                    }}
                    className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Back to Planning
                  </button>
                  <button
                    onClick={() => setShowQaConfirm(true)}
                    disabled={submittingQA}
                    className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingQA && <Loader2 size={16} className="animate-spin" />}
                    Submit QA & Decision
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ClipboardCheck size={32} className="mx-auto mb-3 opacity-50" />
              <p>Select a batch from Production Planning and use <strong>QA Checklist</strong> to begin quality control.</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateBatchModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchBatches();
          }}
        />
      )}

      {showUploadModal && (
        <UploadImagesModal
          open={!!showUploadModal}
          batchId={showUploadModal}
          batchStatus={
            MOCK_BATCHES.find((b) => b.batchId === showUploadModal)?.status
          }
          onClose={() => setShowUploadModal(null)}
          onStageUpdated={() => {
            fetchBatches();
            setShowUploadModal(null);
          }}
        />
      )}

      {pendingQaConfirm && (
        <ConfirmModal
          message={`Are you sure you want to go to Quality Check the batch #${pendingQaConfirm.batchId} – ${pendingQaConfirm.productName}?`}
          onConfirm={confirmNavigateToQA}
          onCancel={() => setPendingQaConfirm(null)}
        />
      )}

      {pendingTrackingConfirm && (
        <ConfirmModal
          message={`Are you sure you want to track production for batch #${pendingTrackingConfirm.batchId} – ${pendingTrackingConfirm.productName}?`}
          onConfirm={confirmNavigateToTracking}
          onCancel={() => setPendingTrackingConfirm(null)}
        />
      )}

      {deleteTarget !== null && (
        <ConfirmModal
          message={`Are you sure you want to permanently delete batch #${deleteTarget}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {showQaConfirm && (
        <ConfirmModal
          message={`Are you sure you want to submit the QA results for batch #${selectedBatch?.batchId}?`}
          onConfirm={handleQaSubmit}
          onCancel={() => setShowQaConfirm(false)}
        />
      )}
    </div>
  );
}