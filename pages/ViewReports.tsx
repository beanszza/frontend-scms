"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Download, Filter, Search, Calendar, Upload, Loader2, RotateCcw, X, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

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

  const handleResetFilters = () => {
    setFilterMode("all");
    setStartDate("");
    setEndDate("");
    setSpecificDate("");
    setSearchQuery("");
    setSelectedSupplierFilter("all");
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

  // Helper search filter
  const filterList = (list: any[], keyField: string = "itemName") => {
    if (!list) return [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) => {
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(q)
      );
    });
  };

  const renderInventoryReport = () => {
    const historical = filterList(data?.historicalAudit || [], "period");
    const forecast = filterList(data?.demandForecast || [], "itemName");

    return (
      <div className="space-y-8">
        {/* Section A */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Section A: Historical Inventory Audit Table</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Total Active Items</th>
                  <th className="px-6 py-4">Starting Stock Qty</th>
                  <th className="px-6 py-4">Ending Stock Qty</th>
                  <th className="px-6 py-4">Stock In Qty</th>
                  <th className="px-6 py-4">Stock Out Qty</th>
                  <th className="px-6 py-4">Wastage Qty</th>
                  <th className="px-6 py-4">Inventory Velocity %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {historical.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.period}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalActiveItems}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.startingStockQty}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.endingStockQty}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.stockInQty}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.stockOutQty}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.wastageQty}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.inventoryVelocity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section B */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Section B: Inventory Demand Forecast Card</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4">Avg Daily Usage</th>
                  <th className="px-6 py-4">Days Left</th>
                  <th className="px-6 py-4">Runout Date</th>
                  <th className="px-6 py-4">Urgency Badge</th>
                  <th className="px-6 py-4">Recommended Reorder Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {forecast.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.itemName}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.currentStock}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.avgDailyUsage}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.daysLeft}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.runoutDate}</td>
                    <td className="px-6 py-4 font-semibold">{row.urgencyBadge}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.recommendedReorderQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderProcurementReport = () => {
    const historical = filterList(data?.historicalAudit || [], "poId");
    const summary = data?.orderFulfillmentSummary || {
      totalOrders: 0,
      pendingOrders: 0,
      arrivedOrders: 0,
      completedOrders: 0,
      rejectedOrders: 0,
      cancelledOrders: 0
    };

    return (
      <div className="space-y-8">
        {/* Section A: Order Fulfillment Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Total Orders</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.totalOrders}</span>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Pending</span>
            <span className="text-2xl font-bold text-amber-500 mt-1">{summary.pendingOrders}</span>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Arrived (QA)</span>
            <span className="text-2xl font-bold text-blue-500 mt-1">{summary.arrivedOrders}</span>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Completed</span>
            <span className="text-2xl font-bold text-emerald-500 mt-1">{summary.completedOrders}</span>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Rejected</span>
            <span className="text-2xl font-bold text-rose-500 mt-1">{summary.rejectedOrders}</span>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Cancelled</span>
            <span className="text-2xl font-bold text-gray-400 mt-1">{summary.cancelledOrders}</span>
          </div>
        </div>

        {/* Section B: Historical Procurement Audit Table */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Section B: Historical Procurement Audit Table</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4">PO ID</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Supplier Name</th>
                  <th className="px-6 py-4">Total Items Count</th>
                  <th className="px-6 py-4">Total Ordered Qty</th>
                  <th className="px-6 py-4">Delivery Lead Time</th>
                  <th className="px-6 py-4">Fulfillment Rate</th>
                  <th className="px-6 py-4">Inspection Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {historical.length > 0 ? (
                  historical.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-mono font-semibold text-blue-600 dark:text-blue-400">{row.poId}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.issueDate}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.supplierName}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalItemsCount}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalOrderedQty}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.deliveryLeadTime}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.fulfillmentRate}</td>
                      <td className="px-6 py-4 font-semibold">{row.inspectionStatus}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No procurement audits found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderProductionReport = () => {
    const yieldEfficiency = filterList(data?.yieldEfficiency || [], "recipeName");
    const summary = data?.summary || {
      totalBatches: 0,
      scheduledBatches: 0,
      inProgressBatches: 0,
      passedQaBatches: 0,
      rejectedBatches: 0,
      mostProducedItem: "N/A",
      seldomProducedItem: "N/A"
    };

    return (
      <div className="space-y-8">
        {/* Section A: Production Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Total Batches</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.totalBatches}</span>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Passed QA</span>
            <span className="text-2xl font-bold text-emerald-500 mt-1">{summary.passedQaBatches}</span>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Rejected</span>
            <span className="text-2xl font-bold text-rose-500 mt-1">{summary.rejectedBatches}</span>
          </div>
        </div>

        {/* Section B: Kitchen Yield Efficiency Table */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Main Table: Kitchen Yield Efficiency & Batch Quality Audit</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4">Recipe Name</th>
                  <th className="px-6 py-4">Total Batches Cooked</th>
                  <th className="px-6 py-4">Total Output Qty</th>
                  <th className="px-6 py-4">Yield Success Rate %</th>
                  <th className="px-6 py-4">Total Rejected Qty</th>
                  <th className="px-6 py-4">Ingredient Waste Qty</th>
                  <th className="px-6 py-4">Common Failure Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {yieldEfficiency.length > 0 ? (
                  yieldEfficiency.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{row.recipeName}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalBatchesCooked}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalOutputQty}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">{row.yieldSuccessRate}</td>
                      <td className="px-6 py-4 text-rose-600 dark:text-rose-400 font-medium">{row.totalRejectedQty}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.ingredientWasteQty}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.commonFailureReason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No production audits found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderSupplierReport = () => {
    let scorecard = filterList(data?.vendorScorecard || [], "supplierName");

    if (selectedSupplierFilter !== "all") {
      scorecard = scorecard.filter((s: any) => s.supplierName === selectedSupplierFilter);
    }

    const allSuppliers = data?.vendorScorecard || [];

    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vendor Scorecard & Delivery Performance Audit</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Click any supplier name to view all purchase order transactions (including pending orders).
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            {scorecard.length} Vendors
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">Supplier Name</th>
                <th className="px-6 py-4">Total Orders Placed</th>
                <th className="px-6 py-4">On-Time Deliveries</th>
                <th className="px-6 py-4">Late Deliveries</th>
                <th className="px-6 py-4">Order Accuracy Rate</th>
                <th className="px-6 py-4">Average Lead Time</th>
                <th className="px-6 py-4">Rejection Rate</th>
                <th className="px-6 py-4">Overall Vendor Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {scorecard.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-semibold">
                    <button
                      onClick={() => setSelectedSupplierModal(row)}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1.5 text-left"
                    >
                      <span>{row.supplierName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono">
                        View Orders
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalOrdersPlaced}</td>
                  <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-medium">{row.onTimeDeliveries}</td>
                  <td className="px-6 py-4 text-rose-600 dark:text-rose-400 font-medium">{row.lateDeliveries}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.orderAccuracyRate}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.averageLeadTime}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.rejectionRate}</td>
                  <td className="px-6 py-4 font-bold">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${row.overallVendorGrade?.includes("Grade A")
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : row.overallVendorGrade?.includes("Grade B")
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      }`}>
                      {row.overallVendorGrade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDistributionReport = () => {
    const velocity = filterList(data?.logisticsVelocity || [], "transferId");

    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Main Table: Logistics & Branch Transfer Velocity Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">Transfer ID</th>
                <th className="px-6 py-4">Source Location</th>
                <th className="px-6 py-4">Destination Branch</th>
                <th className="px-6 py-4">Dispatch Date</th>
                <th className="px-6 py-4">Receive Date</th>
                <th className="px-6 py-4">Transit Duration</th>
                <th className="px-6 py-4">Assigned Driver</th>
                <th className="px-6 py-4">Transfer Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {velocity.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-mono font-semibold text-blue-600 dark:text-blue-400">{row.transferId}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.sourceLocation}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.destinationBranch}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.dispatchDate}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.receiveDate}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.transitDuration}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.assignedDriver}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">{row.transferStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const allSuppliers = data?.vendorScorecard || [];

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-gray-900 p-4 sm:p-6 transition-colors">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white capitalize">
            {initialTab} Performance Report
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detailed operational analytics and historical audit data
          </p>
        </div>
      </div>

      {/* Consistent Filter Bar UI */}
      <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">

          {/* Filter Mode Selector & Supplier Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Filter size={14} className="text-blue-600" /> Filter By:
            </span>
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${filterMode === "all"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
              >
                All History
              </button>
              <button
                onClick={() => setFilterMode("specific")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${filterMode === "specific"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
              >
                Specific Date
              </button>
              <button
                onClick={() => setFilterMode("range")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${filterMode === "range"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
              >
                Date Range
              </button>
            </div>

            {/* Supplier Specific Company Dropdown (Visible on Supplier Tab) */}
            {initialTab === "supplier" && allSuppliers.length > 0 && (
              <select
                value={selectedSupplierFilter}
                onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Suppliers ({allSuppliers.length})</option>
                {allSuppliers.map((s: any, idx: number) => (
                  <option key={idx} value={s.supplierName}>
                    {s.supplierName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Search Box & CSV Export Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search report table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 h-[38px] text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Upload size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Conditional Date Pickers */}
        {filterMode === "specific" && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-600" /> Select Specific Date:
            </label>
            <input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={fetchData}
              className="h-[34px] px-4 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Apply Date
            </button>
          </div>
        )}

        {filterMode === "range" && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Calendar size={14} className="text-blue-600" /> Start Date:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={fetchData}
              className="h-[34px] px-4 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Apply Range
            </button>
            {(startDate || endDate || specificDate || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-rose-600 hover:underline font-semibold"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Report Tables */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span className="ml-3 text-gray-500 font-medium">Loading report data...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 font-medium">
            {error}
          </div>
        ) : (
          <>
            {initialTab === 'inventory' && renderInventoryReport()}
            {initialTab === 'procurement' && renderProcurementReport()}
            {initialTab === 'production' && renderProductionReport()}
            {initialTab === 'supplier' && renderSupplierReport()}
            {initialTab === 'distribution' && renderDistributionReport()}
          </>
        )}
      </div>

      {/* Supplier Order Transactions Modal */}
      {selectedSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart size={20} className="text-blue-600" />
                  Order Transactions: {selectedSupplierModal.supplierName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Complete history of purchase order transactions including pending and completed orders
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplierModal(null)}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedSupplierModal.totalOrdersPlaced}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">On-Time Deliveries</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedSupplierModal.onTimeDeliveries}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Late Deliveries</p>
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{selectedSupplierModal.lateDeliveries}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Vendor Grade</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedSupplierModal.overallVendorGrade}</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">PO Code</th>
                      <th className="px-4 py-3">Order Date</th>
                      <th className="px-4 py-3">Expected Arrival</th>
                      <th className="px-4 py-3">Items Count</th>
                      <th className="px-4 py-3">Order Status</th>
                      <th className="px-4 py-3">QA Status</th>
                      <th className="px-4 py-3">Inspection Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {!selectedSupplierModal.orders || selectedSupplierModal.orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No purchase order transactions found for this supplier.</td>
                      </tr>
                    ) : (
                      selectedSupplierModal.orders.map((po: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">{po.poCode}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{po.orderDate}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{po.expectedArrivalDate}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{po.totalItemsCount} items</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${po.status?.toLowerCase().includes("completed") || po.status?.toLowerCase().includes("received")
                                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                : po.status?.toLowerCase().includes("pending")
                                  ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600"
                              }`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${po.qaStatus?.toLowerCase().includes("pass")
                                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                : po.qaStatus?.toLowerCase().includes("reject")
                                  ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                                  : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                              }`}>
                              {po.qaStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{po.inspectedDate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={() => setSelectedSupplierModal(null)}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
