"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Modular Sub-Components from @/pages
import ReportFilterBar from "@/pages/ReportFilterBar";
import InventoryReportView from "@/pages/InventoryReportView";
import ProcurementReportView from "@/pages/ProcurementReportView";
import ProductionReportView from "@/pages/ProductionReportView";
import SupplierReportView from "@/pages/SupplierReportView";
import SupplierOrdersModal from "@/pages/SupplierOrdersModal";
import DistributionReportView from "@/pages/DistributionReportView";

export default function ViewReports({ initialTab }: { initialTab: string }) {
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Consistent Filter States
  const [filterMode, setFilterMode] = useState<"all" | "specific" | "range">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [specificDate, setSpecificDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState("all");

  // Pagination State (10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal State for Supplier Order Transactions
  const [selectedSupplierModal, setSelectedSupplierModal] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      let url = `http://localhost:5006/api/Reports/${initialTab}?`;

      if (filterMode === "specific" && specificDate) {
        url += `startDate=${specificDate}&endDate=${specificDate}&`;
      } else if (filterMode === "range") {
        if (startDate) url += `startDate=${startDate}&`;
        if (endDate) url += `endDate=${endDate}&`;
      }

      const response = await fetch(url);
      const json = await response.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || "Failed to fetch data from server");
      }
    } catch (err) {
      setError("Network error occurred while fetching reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [initialTab, filterMode]);

  // Reset pagination page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode, specificDate, startDate, endDate, selectedSupplierFilter, initialTab]);

  const handleResetFilters = () => {
    setFilterMode("all");
    setStartDate("");
    setEndDate("");
    setSpecificDate("");
    setSearchQuery("");
    setSelectedSupplierFilter("all");
    setCurrentPage(1);
    fetchData();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Report,${initialTab}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${initialTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allSuppliers = data?.vendorScorecard || [];

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-gray-50 dark:bg-gray-900 p-2 sm:p-4 transition-colors font-sans text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-full space-y-5">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white capitalize tracking-tight">
              {initialTab} Performance Report
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Detailed operational analytics and historical audit data
            </p>
          </div>
        </div>

        {/* Filter Bar Component */}
        <ReportFilterBar
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          specificDate={specificDate}
          setSpecificDate={setSpecificDate}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          initialTab={initialTab}
          allSuppliers={allSuppliers}
          selectedSupplierFilter={selectedSupplierFilter}
          setSelectedSupplierFilter={setSelectedSupplierFilter}
          onApplyFilters={fetchData}
          onResetFilters={handleResetFilters}
          onExportCSV={handleExportCSV}
        />

        {/* Main Content Report View */}
        <div className="w-full">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="ml-3 text-gray-500 dark:text-gray-400 font-medium">Loading report data...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          ) : (
            <>
              {initialTab === "inventory" && (
                <InventoryReportView
                  data={data}
                  searchQuery={searchQuery}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                />
              )}
              {initialTab === "procurement" && (
                <ProcurementReportView
                  data={data}
                  searchQuery={searchQuery}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                />
              )}
              {initialTab === "production" && (
                <ProductionReportView
                  data={data}
                  searchQuery={searchQuery}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                />
              )}
              {initialTab === "supplier" && (
                <SupplierReportView
                  data={data}
                  searchQuery={searchQuery}
                  selectedSupplierFilter={selectedSupplierFilter}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  onOpenOrdersModal={(supplier) => setSelectedSupplierModal(supplier)}
                />
              )}
              {initialTab === "distribution" && (
                <DistributionReportView
                  data={data}
                  searchQuery={searchQuery}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Supplier Order Transactions Modal */}
      <SupplierOrdersModal
        selectedSupplierModal={selectedSupplierModal}
        onClose={() => setSelectedSupplierModal(null)}
      />
    </div>
  );
}
