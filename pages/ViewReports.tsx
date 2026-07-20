"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Download, Filter, Search, Calendar, Printer, Upload, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ViewReports({ initialTab }: { initialTab: string }) {
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [specificDate, setSpecificDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      let url = `http://localhost:5006/api/Reports/${initialTab}?`;
      
      if (specificDate) {
        url += `startDate=${specificDate}&endDate=${specificDate}&`;
      } else {
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
  }, [initialTab]);

  const handleExportCSV = () => {
    // Simple client-side CSV export simulation
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Exported Report Data\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${initialTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderInventoryReport = () => (
    <div className="space-y-8">
      {/* Section A */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
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
              {data?.historicalAudit?.map((row: any, i: number) => (
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
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Section B: AI Module 2 — Inventory Demand Forecast Card</h3>
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
              {data?.demandForecast?.map((row: any, i: number) => (
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

  const renderProcurementReport = () => (
    <div className="space-y-8">
      {/* Section A */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Section A: Historical Procurement Audit Table</h3>
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
              {data?.historicalAudit?.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.poId}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.issueDate}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.supplierName}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalItemsCount}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalOrderedQty}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.deliveryLeadTime}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.fulfillmentRate}</td>
                  <td className="px-6 py-4 font-semibold">{row.inspectionStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section B */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Section B: AI Module 1 — Smart Procurement Advice Card</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">6-Month Order Trend</th>
                <th className="px-6 py-4">Predicted Next Month Qty</th>
                <th className="px-6 py-4">AI Confidence</th>
                <th className="px-6 py-4">Recommendation Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data?.procurementAdvice?.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.itemName}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.orderTrend}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.predictedNextMonthQty}</td>
                  <td className="px-6 py-4 font-semibold">{row.aiConfidence}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.recommendationBasis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProductionReport = () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Main Table: Kitchen Yield Efficiency Report</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4">Recipe Name</th>
              <th className="px-6 py-4">Total Batches Cooked</th>
              <th className="px-6 py-4">Total Output Qty</th>
              <th className="px-6 py-4">Yield Success Rate</th>
              <th className="px-6 py-4">Total Rejected Qty</th>
              <th className="px-6 py-4">Ingredient Waste Qty</th>
              <th className="px-6 py-4">Common Failure Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data?.yieldEfficiency?.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.recipeName}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalBatchesCooked}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalOutputQty}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.yieldSuccessRate}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalRejectedQty}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.ingredientWasteQty}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.commonFailureReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSupplierReport = () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Main Table: Vendor Scorecard Audit</h3>
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
            {data?.vendorScorecard?.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.supplierName}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.totalOrdersPlaced}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.onTimeDeliveries}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.lateDeliveries}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.orderAccuracyRate}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.averageLeadTime}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.rejectionRate}</td>
                <td className="px-6 py-4 font-semibold">{row.overallVendorGrade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDistributionReport = () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
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
            {data?.logisticsVelocity?.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.transferId}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.sourceLocation}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.destinationBranch}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.dispatchDate}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.receiveDate}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.transitDuration}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.assignedDriver}</td>
                <td className="px-6 py-4 font-semibold">{row.transferStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-gray-900 p-4 sm:p-6 transition-colors">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button 
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white capitalize">
            {initialTab} Report
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Detailed analytics and historical data</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setSpecificDate(""); }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setSpecificDate(""); }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Specific Date</label>
            <input 
              type="date" 
              value={specificDate}
              onChange={(e) => { setSpecificDate(e.target.value); setStartDate(""); setEndDate(""); }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
            />
          </div>

          <button onClick={fetchData} className="h-[38px] px-5 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm">
            Apply Filters
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2 xl:mt-0">
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 h-[38px] text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Upload size={16} /> Export to CSV
          </button>
        </div>
      </div>

      <div className="mt-8">
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
    </div>
  );
}
