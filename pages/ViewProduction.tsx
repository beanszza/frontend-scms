"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  Eye,
  Upload,
  Check,
  X,
  ChevronLeft,
  ClipboardCheck,
  MoreHorizontal,
  Trash2, // added for delete
  ChevronRight,
} from "lucide-react";
import api from "../lib/api";
import CreateBatchModal from "../components/CreateBatchModal";
import UploadImagesModal from "../components/UploadImagesModal";
import QAChecklistModal from "../components/QAChecklistModal";
import ConfirmModal from "../components/ConfirmModal"; // adjust path

// ---------- Types ----------
type ProductionBatch = {
  batchId: number;
  productName: string;
  batchType: "Retail" | "Institutional";
  quantity: number;
  scheduleDate: string;
  assignedCook: string;
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
    productName: "Longganisa",
    batchType: "Retail",
    quantity: 100,
    scheduleDate: "2026-06-09",
    assignedCook: "Juan Dela Cruz",
    status: "In progress",
    currentStage: "QA Review",
  },
  {
    batchId: 1002,
    productName: "Tocino",
    batchType: "Retail",
    quantity: 200,
    scheduleDate: "2026-06-07",
    assignedCook: "Maria Santos",
    status: "Delayed",
    currentStage: "Cooking",
  },
  {
    batchId: 1043,
    productName: "Longganisa",
    batchType: "Retail",
    quantity: 500,
    scheduleDate: "2026-06-12",
    assignedCook: "Pedro Reyes",
    status: "In progress",
    currentStage: "Peeling",
  },
  {
    batchId: 1201,
    productName: "Longganisa",
    batchType: "Retail",
    quantity: 100,
    scheduleDate: "2026-06-09",
    assignedCook: "Juan Dela Cruz",
    status: "In progress",
    currentStage: "QA Review",
  },
  {
    batchId: 1202,
    productName: "Tocino",
    batchType: "Retail",
    quantity: 200,
    scheduleDate: "2026-06-07",
    assignedCook: "Maria Santos",
    status: "Delayed",
    currentStage: "Cooking",
  },
  {
    batchId: 1003,
    productName: "Longganisa",
    batchType: "Retail",
    quantity: 500,
    scheduleDate: "2026-06-12",
    assignedCook: "Pedro Reyes",
    status: "In progress",
    currentStage: "Peeling",
  },
  {
    batchId: 1011,
    productName: "Longganisa",
    batchType: "Retail",
    quantity: 100,
    scheduleDate: "2026-06-09",
    assignedCook: "Juan Dela Cruz",
    status: "In progress",
    currentStage: "QA Review",
  },
  {
    batchId: 1032,
    productName: "Tocino",
    batchType: "Retail",
    quantity: 200,
    scheduleDate: "2026-06-07",
    assignedCook: "Maria Santos",
    status: "Delayed",
    currentStage: "Cooking",
  },
  {
    batchId: 1005,
    productName: "Tocino",
    batchType: "Retail",
    quantity: 150,
    scheduleDate: "2026-06-05",
    assignedCook: "Juan Dela Cruz",
    status: "In Progress",
    currentStage: "Packaging",
  },
  {
    batchId: 1006,
    productName: "Empanada",
    batchType: "Retail",
    quantity: 80,
    scheduleDate: "2026-06-10",
    assignedCook: "Rosa Diaz",
    status: "Planned",
    currentStage: "Mixing",
  },
  {
    batchId: 1007,
    productName: "Longganisa",
    batchType: "Retail",
    quantity: 300,
    scheduleDate: "2026-06-11",
    assignedCook: "Carlos Reyes",
    status: "Reviewing",
    currentStage: "QA Review",
  },
  {
    batchId: 1008,
    productName: "Tocino",
    batchType: "Retail",
    quantity: 250,
    scheduleDate: "2026-06-01",
    assignedCook: "Maria Santos",
    status: "Delayed",
    currentStage: "Rejected",
  },
  {
    batchId: 1009,
    productName: "Siomai",
    batchType: "Retail",
    quantity: 600,
    scheduleDate: "2026-06-14",
    assignedCook: "Pedro Reyes",
    status: "Planned",
    currentStage: "Cooking",
  },
  {
    batchId: 1010,
    productName: "Empanada",
    batchType: "Retail",
    quantity: 90,
    scheduleDate: "2026-06-15",
    assignedCook: "Ana Gonzales",
    status: "In progress",
    currentStage: "Peeling",
  },
  {
    batchId: 1012, // fixed duplicate
    productName: "Longganisa",
    batchType: "Retail",
    quantity: 120,
    scheduleDate: "2026-06-13",
    assignedCook: "Rosa Diaz",
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

export default function ProductionPage() {
  useDarkMode();

  // Data & Pagination
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Retail">("Retail");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Summary counts
  const [summary, setSummary] = useState<SummaryCounts>({
    active: 0,
    completed: 0,
    delayed: 0,
    rejected: 0,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<number | null>(null);
  const [showQaModal, setShowQaModal] = useState<number | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
      let filtered = MOCK_BATCHES.filter((b) => b.batchType === activeTab);
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.productName.toLowerCase().includes(q) ||
            b.assignedCook.toLowerCase().includes(q)
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
  }, [activeTab, currentPage, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Helper: is batch overdue?
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
    setOpenDropdownId(null); // close dropdown
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    // Mock deletion: filter out the batch from MOCK_BATCHES
    MOCK_BATCHES = MOCK_BATCHES.filter((b) => b.batchId !== deleteTarget);
    setDeleteTarget(null);
    // Refetch data
    fetchBatches();
    // Optionally adjust current page if it becomes empty
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  // Summary cards
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

      {/* Tabs */}
      <div className="mb-5 flex items-center gap-2">
        {(["Retail"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
              activeTab === tab
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-[#1D2939] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product or cook..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1D2939]">
              <th className="px-5 py-4">Batch ID</th>
              <th className="px-5 py-4">Product</th>
              <th className="px-5 py-4">Quantity</th>
              <th className="px-5 py-4">Schedule Date</th>
              <th className="px-5 py-4">Assigned Cook</th>
              <th className="px-5 py-4">Current Stage</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  Loading batches...
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  No production batches found.
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
                    <td className="px-5 py-5 text-sm text-gray-900 dark:text-white">
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
                    <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                      {batch.assignedCook}
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
                      {/* Dropdown Actions */}
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
                              onClick={() => {
                                setShowQaModal(batch.batchId);
                                setOpenDropdownId(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <ClipboardCheck size={16} /> QA Checklist
                            </button>
                            {batch.status === "QA Review" && (
                              <button
                                onClick={() => {
                                  setShowQaModal(batch.batchId);
                                  setOpenDropdownId(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <Check size={16} /> Approve / Reject
                              </button>
                            )}
                            {batch.status !== "Completed" &&
                              batch.status !== "Rejected" && (
                                <button
                                  onClick={() => {
                                    setShowUploadModal(batch.batchId);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                  <ChevronRight size={16} /> Update Stage
                                </button>
                              )}
                            {/* Delete Button */}
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
        <div className="flex items-center justify-between mt-5">
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
            batches.find((b) => b.batchId === showUploadModal)?.status
          }
          onClose={() => setShowUploadModal(null)}
          onStageUpdated={() => {
            fetchBatches();
          }}
        />
      )}

      {showQaModal && (
        <QAChecklistModal
          open={!!showQaModal}
          batchId={showQaModal}
          onClose={() => setShowQaModal(null)}
          onSubmit={() => {
            setShowQaModal(null);
            fetchBatches();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget !== null && (
        <ConfirmModal
          message={`Are you sure you want to permanently delete batch #${deleteTarget}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}