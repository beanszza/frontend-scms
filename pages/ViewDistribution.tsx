"use client";

import { useState } from "react";
import StockTransferTable from "@/components/StockTransferTable";
import LocationManager from "@/components/LocationManager";
import CreateTransferModal from "@/components/CreateTransferModal";
import DispatchModal from "@/components/DispatchModal";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<TransferItem | null>(null);

  const [newLocName, setNewLocName] = useState("");
  const [newLocType, setNewLocType] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");

  const [transfers, setTransfers] = useState<TransferItem[]>([
    { id: "TRF-001", product: "Ube Halaya (500g Jar)", from: "Main Warehouse", to: "Branch 1 - Quezon City", quantity: 50, date: "4/14/2026", status: "Completed" },
    { id: "TRF-002", product: "Ube Jam (250g Jar)", from: "Main Warehouse", to: "Bazaar Booth - SM North", quantity: 30, date: "4/15/2026", status: "In Transit" },
    { id: "TRF-003", product: "Coconut Ube Halaya (500g Jar)", from: "Main Warehouse", to: "Branch 2 - Makati", quantity: 25, date: "4/16/2026", status: "Pending" },
  ]);

  const [locations, setLocations] = useState<LocationItem[]>([
    { id: "LOC-001", name: "Main Warehouse", type: "Warehouse", address: "123 Industrial Ave, Metro Manila", status: "Active" },
    { id: "LOC-002", name: "Branch 1 - Quezon City", type: "Branch", address: "456 QC Road, Quezon City", status: "Active" },
    { id: "LOC-003", name: "Branch 2 - Makati", type: "Branch", address: "789 Makati Blvd, Makati City", status: "Active" },
    { id: "LOC-004", name: "Bazaar Booth - SM North", type: "Bazaar", address: "SM North EDSA, Quezon City", status: "Active" },
  ]);

  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === "Pending").length,
    inTransit: transfers.filter(t => t.status === "In Transit").length,
    completed: transfers.filter(t => t.status === "Completed").length,
  };

  const handleDispatchConfirm = (id: string) => {
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: "In Transit" as const } : t));
    setSelectedDispatch(null);
  };

  const handleCompleteTransfer = (id: string) => {
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: "Completed" as const } : t));
  };

  const handleAddLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocType || !newLocAddress) return;

    const newLoc: LocationItem = {
      id: `LOC-${String(Date.now()).slice(-3)}`,
      name: newLocName,
      type: newLocType,
      address: newLocAddress,
      status: "Active"
    };

    setLocations(prev => [...prev, newLoc]);
    setNewLocName("");
    setNewLocType("");
    setNewLocAddress("");
    setShowLocationModal(false);
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
              <button className="flex-1 sm:flex-none h-10 px-3 sm:px-4 text-xs font-bold border border-gray-300 dark:border-slate-700 rounded-lg bg-white text-slate-900 dark:text-slate-900 hover:bg-gray-100 transition-colors whitespace-nowrap shadow-sm text-center">
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

          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-strokedark shadow-sm">
            <StockTransferTable 
              transfers={transfers} 
              onDispatchClick={setSelectedDispatch} 
              onCompleteClick={handleCompleteTransfer} 
            />
          </div>
        </>
      )}

      {activeTab === "Locations" && (
        <LocationManager locations={locations} />
      )}

      {showCreateModal && (
        <CreateTransferModal 
          locations={locations} 
          onClose={() => setShowCreateModal(false)} 
          onSave={(t) => setTransfers(prev => [...prev, t as TransferItem])} 
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowLocationModal(false)}>
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
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newLocName}
                  onChange={e => setNewLocName(e.target.value)}
                  required 
                />
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
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={newLocAddress}
                  onChange={e => setNewLocAddress(e.target.value)}
                  required 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowLocationModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="h-9 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">Add Location</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}