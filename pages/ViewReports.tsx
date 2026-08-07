import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
  const { user, isLoading } = useAuth() || {};

  useEffect(() => {
    if (!isLoading) {
      const isAuthorized = user?.username === "scmsuser" || user?.username === "ERP-ADMIN" || user?.email === "scmsuser@r3b2p.com" || user?.email === "admin@r3b2p.com" || user?.roles?.includes("Admin");
      if (!isAuthorized) {
        router.push("/");
      }
    }
  }, [user, isLoading, router]);

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
    if (!data) return;
    const csvRows: string[] = [];

    if (initialTab === "inventory") {
      const rows = data.inventoryLevels || data.items || [];
      csvRows.push(["Item ID", "Item Name", "Category", "Current Stock", "Min Reorder Point", "Status"].join(","));
      rows.forEach((r: any) => {
        csvRows.push([
          `"${r.itemId || r.id || ''}"`,
          `"${r.itemName || r.name || ''}"`,
          `"${r.category || ''}"`,
          `"${r.currentStock || r.stockQuantity || 0}"`,
          `"${r.minReorderPoint || r.reorderLevel || 0}"`,
          `"${r.status || 'Active'}"`
        ].join(","));
      });
    } else if (initialTab === "procurement") {
      const rows = data.orders || data.purchaseOrders || [];
      csvRows.push(["PO ID", "Supplier", "Issue Date", "ETA", "Status", "Total Amount"].join(","));
      rows.forEach((r: any) => {
        csvRows.push([
          `"${r.poId || r.id || ''}"`,
          `"${r.supplierName || r.companyName || ''}"`,
          `"${r.orderDate || ''}"`,
          `"${r.expectedArrivalDate || r.eta || ''}"`,
          `"${r.status || ''}"`,
          `"${r.totalAmount || 0}"`
        ].join(","));
      });
    } else if (initialTab === "production") {
      const rows = data.batches || data.productionBatches || [];
      csvRows.push(["Batch ID", "Product", "Multiplier", "Estimated Qty", "Actual Qty", "Production Date", "Stage", "Status"].join(","));
      rows.forEach((r: any) => {
        csvRows.push([
          `"${r.batchId || r.id || ''}"`,
          `"${r.productName || ''}"`,
          `"${r.batchMultiplier || 1}"`,
          `"${r.estimatedQuantity || 0}"`,
          `"${r.actualQuantity || 0}"`,
          `"${r.productionDate || ''}"`,
          `"${r.stage || ''}"`,
          `"${r.status || ''}"`
        ].join(","));
      });
    } else if (initialTab === "supplier") {
      const rows = data.vendorScorecard || data.suppliers || [];
      csvRows.push(["Supplier ID", "Supplier Name", "Total Orders", "On-Time Rate", "Fulfillment Rate", "Quality Pass Rate"].join(","));
      rows.forEach((r: any) => {
        csvRows.push([
          `"${r.supplierId || r.id || ''}"`,
          `"${r.supplierName || r.companyName || ''}"`,
          `"${r.totalOrders || 0}"`,
          `"${r.onTimeRate || '100%'}"`,
          `"${r.fulfillmentRate || '100%'}"`,
          `"${r.qualityPassRate || '100%'}"`
        ].join(","));
      });
    } else if (initialTab === "distribution") {
      const rows = data.stockTransfers || data.transfers || [];
      csvRows.push(["Transfer ID", "Product", "Quantity", "Source", "Destination", "Status", "Transfer Date"].join(","));
      rows.forEach((r: any) => {
        csvRows.push([
          `"${r.transferId || r.id || ''}"`,
          `"${r.productName || r.itemName || ''}"`,
          `"${r.transferQuantity || r.quantity || 0}"`,
          `"${r.sourceLocationName || 'Warehouse A'}"`,
          `"${r.destLocationName || 'Store Branch'}"`,
          `"${r.status || ''}"`,
          `"${r.transferDate || ''}"`
        ].join(","));
      });
    } else {
      csvRows.push(["Report", initialTab]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${initialTab}_report_${new Date().toISOString().split("T")[0]}.csv`);
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
