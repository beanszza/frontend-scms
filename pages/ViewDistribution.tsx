"use client";

import { useState, useEffect } from "react";
import StockTransferTable from "@/components/StockTransferTable";
import LocationManager from "@/components/LocationManager";
import CreateTransferModal from "@/components/CreateTransferModal";
import DispatchModal from "@/components/DispatchModal";
import ConfirmModal from "@/components/ConfirmModal";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";

type TabState = "Stock Transfer" | "Locations" | "Supplier Analytics";

type TransferItem = {
  id: string;
  product: string;
  from: string;
  to: string;
  quantity: number;
  date: string;
  status: "Completed" | "In Transit" | "Pending";
};

type LocationItem = {
  id: string;
  name: string;
  type: string;
  address: string;
  status: string;
};

export default function DistributionAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabState>("Stock Transfer");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);
  const [selectedCancel, setSelectedCancel] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<any>(null);
  const [selectedEdit, setSelectedEdit] = useState<any>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLocCancelConfirm, setShowLocCancelConfirm] = useState(false);

  const [newLocName, setNewLocName] = useState("");
  const [newLocType, setNewLocType] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");
  const [nameError, setNameError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [searchError, setSearchError] = useState("");

  const validateNoSpecialChars = (text: string) => {
    return /^[A-Za-z0-9\s]*$/.test(text);
  };

  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inTransit: 0, completed: 0 });

  const [filterStatus, setFilterStatus] = useState<string>("All");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const filteredTransfers = transfers; // filtered on backend

  const fetchData = async () => {
    try {
      const statusParam = filterStatus === "All" ? "" : filterStatus;
      const [transRes, locRes, dashRes] = await Promise.all([
        api.get(`/api/scms/api/StockTransfers?page=${page}&pageSize=10&status=${statusParam}&search=${searchQuery}`),
        api.get("/api/scms/api/Locations?pageSize=100"),
        api.get("/api/scms/api/StockTransfers/dashboard")
      ]);

      if (transRes.data.success) {
        const transfersList = transRes.data.data.items || transRes.data.data || [];
        setTotalPages(transRes.data.data.totalPages || 1);
        setTotalCount(transRes.data.data.totalCount || transfersList.length);
        setTransfers(transfersList.map((t: any, index: number) => ({
          id: t.transferId.toString(),
          displayId: ((page - 1) * 10 + index + 1).toString(),
          productId: t.productId,
          product: t.productName,
          from: t.sourceLocationName,
          destLocationId: t.destLocationId,
          to: t.destLocationName,
          quantity: t.transferQuantity,
          date: new Date(t.transferDate).toLocaleDateString(),
          rawDate: t.transferDate,
          status: t.status,
        })));
      }

      if (locRes.data.success) {
        const locList = locRes.data.data.items || locRes.data.data || [];
        setLocations(locList.map((l: any) => ({
          id: l.locationId.toString(),
          name: l.locationName,
          type: l.locationType,
          address: "Integrated from POS",
          status: l.status,
        })));
      }

      if (dashRes.data.success) {
        const { pendingCount, inTransitCount, completedCount } = dashRes.data.data;
        setStats({
          total: pendingCount + inTransitCount + completedCount,
          pending: pendingCount,
          inTransit: inTransitCount,
          completed: completedCount,
        });
      }
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filterStatus, searchQuery]);

  const handleDispatchConfirm = async (id: string) => {
    const transferId = parseInt(id, 10);
    try {
      await api.put(`/api/scms/api/StockTransfers/${transferId}/status`, { status: "In Transit" });
      setSelectedDispatch(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCompleteTransfer = async (id: string) => {
    const transferId = parseInt(id, 10);
    try {
      await api.put(`/api/scms/api/StockTransfers/${transferId}/status`, { status: "Completed" });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocType || !newLocAddress) return;
    if (nameError || addressError) return;
    try {
      // NOTE: Location creation is not implemented in LocationsController yet based on backend instructions,
      // but if an endpoint exists it would be api.post("/api/Locations", {...})
      // For now, clear the form.
      setNewLocName("");
      setNewLocType("");
      setNewLocAddress("");
      setShowLocationModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancelTransfer = async () => {
    if (!selectedCancel) return;
    try {
      const id = parseInt(selectedCancel.id, 10);
      const res = await api.put(`/api/scms/api/StockTransfers/${id}/status`, {
        status: "Cancelled"
      });
      if (res.data.success) {
        setSelectedCancel(null);
        fetchData();
      } else {
        alert(res.data.message || "Failed to cancel transfer.");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 max-w-full text-black dark:text-white bg-transparent">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">Distribution & Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Stock transfers, location management, and supplier performance</p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-strokedark gap-6 text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
        {(["Stock Transfer", "Locations", "Supplier Analytics"] as TabState[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 font-semibold border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-400"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* FIXED: Reconfigured header wrapper container layout using responsive flex behaviors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white">{activeTab}</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {activeTab === "Stock Transfer" ? "Transfer finished goods between locations" : "Manage warehouses, branches, and bazaar locations"}
          </p>
        </div>
        
        {/* FIXED: Forced full-width matching inline alignments for action options when running small resolutions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeTab === "Stock Transfer" && (
            <>
              <button onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_SCMS_URL || 'http://localhost:5033'}/api/scms/api/StockTransfers/export-history`} className="flex-1 sm:flex-none h-10 px-3 sm:px-4 text-xs font-bold border border-gray-300 dark:border-slate-700 rounded-lg bg-white text-slate-900 dark:text-slate-900 hover:bg-gray-100 transition-colors whitespace-nowrap shadow-sm text-center">
                Transfer History
              </button>
              <button onClick={() => setShowCreateModal(true)} className="flex-1 sm:flex-none h-10 px-3 sm:px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-md text-center">
                + New Transfer
              </button>
            </>
          )}
          {activeTab === "Locations" && (
            <button onClick={() => setShowLocationModal(true)} className="w-full sm:w-auto h-10 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-md text-center">
              + Add Location
            </button>
          )}
        </div>
      </div>

      {activeTab === "Stock Transfer" && (
        <>
          {/* FIXED: Restructured grids to render cleanly as stacked layouts for mobile viewports */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Transfers", value: stats.total, color: "text-slate-900" },
              { label: "Pending", value: stats.pending, color: "text-amber-600" },
              { label: "In Transit", value: stats.inTransit, color: "text-blue-600" },
              { label: "Completed", value: stats.completed, color: "text-emerald-600" },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 mb-1.5">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6 mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              {['All', 'Pending', 'In Transit', 'Completed', 'Cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => { setFilterStatus(status); setPage(1); }}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${filterStatus === status ? 'bg-[#1c5dfd] text-white' : 'bg-[#f1f5f9] dark:bg-[#24303f] text-[#1e293b] dark:text-slate-300 hover:bg-[#e2e8f0] dark:hover:bg-slate-700'}`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                placeholder="Search by Transfer ID, Product, or Location..."
                value={searchQuery}
                onChange={e => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (!validateNoSpecialChars(val)) {
                    setSearchError("Special characters are not allowed.");
                  } else {
                    setSearchError("");
                    setPage(1);
                  }
                }}
                className={`w-full pl-9 pr-4 py-1.5 h-full min-h-[34px] text-sm bg-white dark:bg-[#24303f] border ${searchError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {searchError && <p className="absolute -bottom-5 left-0 text-[10px] text-red-500">{searchError}</p>}
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-strokedark shadow-sm">
            <StockTransferTable 
              transfers={filteredTransfers} 
              onDispatchClick={setSelectedDispatch} 
              onCompleteClick={handleCompleteTransfer} 
              onCancelClick={setSelectedCancel}
              onViewClick={setSelectedView}
              onEditClick={setSelectedEdit}
            />
          </div>
          
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            totalCount={totalCount} 
            onPageChange={setPage} 
          />
        </>
      )}

      {activeTab === "Locations" && (
        <LocationManager locations={locations} />
      )}

      {showCreateModal && (
        <CreateTransferModal 
          locations={locations} 
          mode="create"
          onClose={() => setShowCreateModal(false)} 
          onSave={() => { setShowCreateModal(false); fetchData(); }} 
        />
      )}

      {selectedView && (
        <CreateTransferModal 
          locations={locations} 
          mode="view"
          initialData={selectedView}
          onClose={() => setSelectedView(null)} 
          onSave={() => setSelectedView(null)} 
        />
      )}

      {selectedEdit && (
        <CreateTransferModal 
          locations={locations} 
          mode="edit"
          initialData={selectedEdit}
          onClose={() => setSelectedEdit(null)} 
          onSave={() => { setSelectedEdit(null); fetchData(); }} 
        />
      )}

      {selectedDispatch && (
        <DispatchModal 
          transfer={selectedDispatch} 
          onClose={() => setSelectedDispatch(null)} 
          onConfirm={handleDispatchConfirm} 
        />
      )}

      {showLocationModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowLocCancelConfirm(true)}>
          <div className="relative w-full max-w-xl bg-white dark:bg-[#1a2232] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col p-6 text-black dark:text-white" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-slate-700 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Location</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Register a new warehouse node or branch outlet</p>
              </div>
              <button onClick={() => setShowLocationModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold">✕</button>
            </div>
            
            <form onSubmit={handleAddLocationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g., Branch 3 - Cebu" 
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${nameError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600'} bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={newLocName}
                  onChange={e => {
                    const val = e.target.value;
                    setNewLocName(val);
                    if (!validateNoSpecialChars(val)) {
                      setNameError("Special characters are not allowed.");
                    } else {
                      setNameError("");
                    }
                  }}
                  required 
                />
                {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Type *</label>
                  <select 
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newLocType}
                    onChange={e => setNewLocType(e.target.value)}
                    required
                  >
                    <option value="" className="dark:bg-[#24303f]">Select type...</option>
                    <option value="Warehouse" className="dark:bg-[#24303f]">Warehouse</option>
                    <option value="Branch" className="dark:bg-[#24303f]">Branch</option>
                    <option value="Bazaar" className="dark:bg-[#24303f]">Bazaar Booth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status *</label>
                  <input type="text" value="Active" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-100 dark:bg-[#24303f] text-slate-500 dark:text-slate-400 focus:outline-none font-medium" readOnly />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Address *</label>
                <textarea 
                  placeholder="Complete address details..." 
                  rows={3}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${addressError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600'} bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                  value={newLocAddress}
                  onChange={e => {
                    const val = e.target.value;
                    setNewLocAddress(val);
                    if (!validateNoSpecialChars(val)) {
                      setAddressError("Special characters are not allowed.");
                    } else {
                      setAddressError("");
                    }
                  }}
                  required 
                />
                {addressError && <p className="mt-1 text-xs text-red-500">{addressError}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowLocCancelConfirm(true)} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={!!nameError || !!addressError} className="h-9 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50">Add Location</button>
              </div>
            </form>
          </div>

          {showLocCancelConfirm && (
            <ConfirmModal
              message="Are you sure you want to cancel? Any unsaved data will be lost."
              onConfirm={() => { setShowLocCancelConfirm(false); setShowLocationModal(false); }}
              onCancel={() => setShowLocCancelConfirm(false)}
            />
          )}
        </div>
      )}

      {selectedCancel && (
        <ConfirmModal
          message="Are you sure you want to cancel this transfer?"
          onConfirm={handleCancelTransfer}
          onCancel={() => setSelectedCancel(null)}
        />
      )}

    </div>
  );
}