"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useState, useEffect } from "react";
import StockTransferTable from "@/components/StockTransferTable";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
import LocationManager from "@/components/LocationManager";
import CreateTransferModal from "@/components/CreateTransferModal";
import DispatchModal from "@/components/DispatchModal";
import ConfirmModal from "@/components/ConfirmModal";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";

type TabState = "Stock Transfer" | "Locations";

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
  const auth = useAuth();
  const user = auth?.user;
  const isAuthorizedForReports = user?.username === "scmsuser" || user?.username === "ERP-ADMIN" || user?.email === "scmsuser@r3b2p.com" || user?.email === "admin@r3b2p.com" || user?.roles?.includes("Admin");

  const [activeTab, setActiveTab] = useState<TabState>("Stock Transfer");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);
  const [selectedCancel, setSelectedCancel] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<any>(null);
  const [selectedEdit, setSelectedEdit] = useState<any>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedEditLoc, setSelectedEditLoc] = useState<any>(null);
  const [selectedViewLoc, setSelectedViewLoc] = useState<any>(null);

  const [newLocName, setNewLocName] = useState("");
  const [newLocType, setNewLocType] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");
  const [newLocIsActive, setNewLocIsActive] = useState<boolean>(true);
  const [nameError, setNameError] = useState("");
  const [typeError, setTypeError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [searchError, setSearchError] = useState("");

  const [locStatusFilter, setLocStatusFilter] = useState<string>("All Status");
  const [locTypeFilter, setLocTypeFilter] = useState<string>("All");
  const [locSearchQuery, setLocSearchQuery] = useState("");

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
          address: l.address,
          status: l.status || (l.isActive ? "Active" : "Inactive"),
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
  }, [page, filterStatus, searchQuery, locStatusFilter]);

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
    let hasError = false;
    if (!newLocName.trim()) { setNameError("Location Name is required."); hasError = true; }
    if (!newLocType) { setTypeError("Type is required."); hasError = true; }
    if (!newLocAddress.trim()) { setAddressError("Address is required."); hasError = true; }
    if (hasError || nameError || addressError || typeError) return;
    try {
      await api.post("/api/scms/api/Locations", {
        locationName: newLocName,
        locationType: newLocType,
        address: newLocAddress,
        isActive: newLocIsActive,
        status: newLocIsActive ? "Active" : "Inactive"
      });
      setNewLocName("");
      setNewLocType("");
      setNewLocAddress("");
      setNewLocIsActive(true);
      setShowLocationModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditLoc) return;
    let hasError = false;
    if (!selectedEditLoc.name?.trim()) { setNameError("Location Name is required."); hasError = true; }
    if (!selectedEditLoc.type) { setTypeError("Type is required."); hasError = true; }
    if (!selectedEditLoc.address?.trim()) { setAddressError("Address is required."); hasError = true; }
    if (hasError || nameError || addressError || typeError) return;
    try {
      await api.put(`/api/scms/api/Locations/${selectedEditLoc.id}`, {
        locationName: selectedEditLoc.name,
        locationType: selectedEditLoc.type,
        address: selectedEditLoc.address,
        isActive: selectedEditLoc.status === "Active",
        status: selectedEditLoc.status
      });
      setSelectedEditLoc(null);
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
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl animate-page-in">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Distribution</h1>
        <p className="text-sm text-muted-foreground mt-1">Stock transfers and branch location management</p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabState)}>
        <TabsList>
          <TabsTrigger value="Stock Transfer">Stock Transfer</TabsTrigger>
          <TabsTrigger value="Locations">Locations</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* FIXED: Reconfigured header wrapper container layout using responsive flex behaviors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{activeTab}</h2>
          <p className="text-xs text-muted-foreground">
            {activeTab === "Stock Transfer" ? "Transfer finished goods between locations" : "Manage warehouses, branches, and bazaar locations"}
          </p>
        </div>
        
        {/* FIXED: Forced full-width matching inline alignments for action options when running small resolutions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isAuthorizedForReports && (
            <Link href="/reports?tab=distribution" className="flex items-center justify-center gap-2 rounded-lg bg-card border border-border px-4 h-10 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm whitespace-nowrap">
              <FileText size={16} /> Reports
            </Link>
          )}
          {activeTab === "Stock Transfer" && (
            <>
              {isAuthorizedForReports && (
                <Button onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_SCMS_URL || 'http://localhost:5033'}/api/scms/api/StockTransfers/export-history`} className="flex-1 sm:flex-none h-10 px-3 sm:px-4 text-xs font-bold border border-border rounded-lg bg-card text-foreground hover:bg-muted transition-colors whitespace-nowrap shadow-sm text-center">
                  Transfer History
                </Button>
              )}
              <Button onClick={() => setShowCreateModal(true)} className="flex-1 sm:flex-none h-10 px-3 sm:px-4 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors whitespace-nowrap shadow-md text-center">
                + New Transfer
              </Button>
            </>
          )}
          {activeTab === "Locations" && (
            <Button onClick={() => setShowLocationModal(true)} className="w-full sm:w-auto h-10 px-4 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors whitespace-nowrap shadow-md text-center">
              + Add Location
            </Button>
          )}
        </div>
      </div>

      {activeTab === "Stock Transfer" && (
        <>
          {/* FIXED: Restructured grids to render cleanly as stacked layouts for mobile viewports */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: "Total Transfers", value: stats.total, color: "text-foreground" },
              { label: "Pending", value: stats.pending, color: "text-foreground" },
              { label: "In Transit", value: stats.inTransit, color: "text-foreground" },
              { label: "Completed", value: stats.completed, color: "text-foreground" },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-6 border border-border rounded-md overflow-hidden bg-card">
            <div className="flex items-center justify-between gap-sm px-md py-sm border-b border-border bg-muted/20">
              <div className="flex items-center gap-sm flex-1">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
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
                  className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-8 p-0 text-body-sm flex-1"
                />
              </div>
              <div className="flex items-center gap-sm shrink-0">
                <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setPage(1); }}>
                  <SelectTrigger className="w-[150px] h-8 text-body-sm bg-transparent border-input">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {['All', 'Pending', 'In Transit', 'Completed', 'Cancelled'].map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {searchError && <div className="px-md pb-sm"><p className="text-xs text-destructive">{searchError}</p></div>}
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-border shadow-sm">
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
        <>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: "Total Locations", value: locations.length, color: "text-foreground" },
              { label: "Warehouses", value: locations.filter(l => l.type === "Warehouse").length, color: "text-foreground" },
              { label: "Branches", value: locations.filter(l => l.type === "Branch").length, color: "text-foreground" },
              { label: "Bazaar Booths", value: locations.filter(l => l.type === "Bazaar").length, color: "text-foreground" },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-6 border border-border rounded-md overflow-hidden bg-card">
            <div className="flex items-center justify-between gap-sm px-md py-sm border-b border-border bg-muted/20">
              <div className="flex items-center gap-sm flex-1">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  type="text"
                  placeholder="Search by Location ID, Name, or Address..."
                  value={locSearchQuery}
                  onChange={e => setLocSearchQuery(e.target.value)}
                  className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-8 p-0 text-body-sm flex-1"
                />
              </div>
              <div className="flex items-center gap-sm shrink-0">
                <Select value={locTypeFilter} onValueChange={(val) => setLocTypeFilter(val)}>
                  <SelectTrigger className="w-[130px] h-8 text-body-sm bg-transparent border-input">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    {['All', 'Warehouse', 'Branch', 'Bazaar'].map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={locStatusFilter} onValueChange={(val) => setLocStatusFilter(val)}>
                  <SelectTrigger className="w-[130px] h-8 text-body-sm bg-transparent border-input">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Status">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <LocationManager 
            locations={locations.filter(l => 
              (locStatusFilter === "All Status" || l.status === locStatusFilter) &&
              (locTypeFilter === "All" || l.type === locTypeFilter) &&
              (l.id.toLowerCase().includes(locSearchQuery.toLowerCase()) || 
               l.name.toLowerCase().includes(locSearchQuery.toLowerCase()) || 
               l.address.toLowerCase().includes(locSearchQuery.toLowerCase()))
            )} 
            onView={setSelectedViewLoc}
            onEdit={(l) => {
              setSelectedEditLoc(l);
              setNameError("");
              setTypeError("");
              setAddressError("");
            }}
          />
        </>
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowLocationModal(false)}>
          <div className="relative w-[90vw] max-w-[90vw] sm:max-w-[80vw] md:max-w-[700px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto p-md sm:p-lg rounded-lg sm:rounded-xl bg-card shadow-2xl border border-border flex flex-col text-foreground" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-start justify-between border-b border-border pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Add New Location</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Register a new warehouse node or branch outlet</p>
              </div>
              <Button onClick={() => setShowLocationModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold">✕</Button>
            </div>
            
            <form onSubmit={handleAddLocationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Location Name <span className="text-muted-foreground">*</span></label>
                <Input 
                  type="text" 
                  placeholder="e.g., Branch 3 - Cebu" 
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${nameError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border'} bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring`}
                  value={newLocName}
                  onChange={e => {
                    const val = e.target.value;
                    setNewLocName(val);
                    if (!val.trim()) {
                      setNameError("Location Name is required.");
                    } else if (!validateNoSpecialChars(val)) {
                      setNameError("Special characters are not allowed.");
                    } else {
                      setNameError("");
                    }
                  }}
                />
                {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Type <span className="text-muted-foreground">*</span></label>
                <select 
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${typeError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border'} bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring`}
                  value={newLocType}
                  onChange={e => {
                    setNewLocType(e.target.value);
                    if (e.target.value) setTypeError("");
                    else setTypeError("Type is required.");
                  }}
                >
                  <option value="">Select type...</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Branch">Branch</option>
                  <option value="Bazaar">Bazaar Booth</option>
                </select>
                {typeError && <p className="mt-1 text-xs text-red-500">{typeError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Address <span className="text-muted-foreground">*</span></label>
                <textarea 
                  placeholder="Complete address details..." 
                  rows={3}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${addressError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border'} bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none`}
                  value={newLocAddress}
                  onChange={e => {
                    const val = e.target.value;
                    setNewLocAddress(val);
                    if (!val.trim()) {
                      setAddressError("Address is required.");
                    } else if (!validateNoSpecialChars(val)) {
                      setAddressError("Special characters are not allowed.");
                    } else {
                      setAddressError("");
                    }
                  }}
                />
                {addressError && <p className="mt-1 text-xs text-red-500">{addressError}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" onClick={() => setShowLocationModal(false)} className="px-4 py-2 text-xs font-semibold text-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancel</Button>
                <Button type="submit" disabled={!!nameError || !!addressError} className="h-9 px-5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm disabled:opacity-50">Add Location</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEditLoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedEditLoc(null)}>
          <div className="relative w-[90vw] max-w-[90vw] sm:max-w-[80vw] md:max-w-[700px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto p-md sm:p-lg rounded-lg sm:rounded-xl bg-card shadow-2xl border border-border flex flex-col text-foreground" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-border pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Edit Location</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Update warehouse or branch details</p>
              </div>
              <Button onClick={() => setSelectedEditLoc(null)} className="text-muted-foreground hover:text-foreground text-xl font-bold">✕</Button>
            </div>
            <form onSubmit={handleEditLocationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Location Name <span className="text-muted-foreground">*</span></label>
                <Input type="text" className={`w-full px-3 py-2 text-sm rounded-lg border ${nameError ? 'border-red-500' : 'border-border'} bg-card`}
                  value={selectedEditLoc.name}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedEditLoc({...selectedEditLoc, name: val});
                    if (!val.trim()) setNameError("Location Name is required.");
                    else if (!validateNoSpecialChars(val)) setNameError("Special characters not allowed.");
                    else setNameError("");
                  }} />
                {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Type <span className="text-muted-foreground">*</span></label>
                  <select className={`w-full px-3 py-2 text-sm rounded-lg border ${typeError ? 'border-red-500' : 'border-border'} bg-card`}
                    value={selectedEditLoc.type} onChange={e => {
                      setSelectedEditLoc({...selectedEditLoc, type: e.target.value});
                      if (e.target.value) setTypeError("");
                      else setTypeError("Type is required.");
                    }}>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Branch">Branch</option>
                    <option value="Bazaar">Bazaar Booth</option>
                  </select>
                  {typeError && <p className="mt-1 text-xs text-red-500">{typeError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Status <span className="text-muted-foreground">*</span></label>
                  <select className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card"
                    value={selectedEditLoc.status} onChange={e => setSelectedEditLoc({...selectedEditLoc, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Address <span className="text-muted-foreground">*</span></label>
                <textarea rows={3} className={`w-full px-3 py-2 text-sm rounded-lg border ${addressError ? 'border-red-500' : 'border-border'} bg-card resize-none`}
                  value={selectedEditLoc.address}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedEditLoc({...selectedEditLoc, address: val});
                    if (!val.trim()) setAddressError("Address is required.");
                    else if (!validateNoSpecialChars(val)) setAddressError("Special characters not allowed.");
                    else setAddressError("");
                  }} />
                {addressError && <p className="mt-1 text-xs text-red-500">{addressError}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" onClick={() => setSelectedEditLoc(null)} className="px-4 py-2 text-xs font-semibold text-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancel</Button>
                <Button type="submit" disabled={!!nameError || !!addressError} className="h-9 px-5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedViewLoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedViewLoc(null)}>
          <div className="relative w-[90vw] max-w-[90vw] sm:max-w-[80vw] md:max-w-[700px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto p-md sm:p-lg rounded-lg sm:rounded-xl bg-card shadow-2xl border border-border flex flex-col text-foreground" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-border pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">View Location</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Location details</p>
              </div>
              <Button onClick={() => setSelectedViewLoc(null)} className="text-muted-foreground hover:text-foreground text-xl font-bold">✕</Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Location Name</p>
                <p className="font-medium">{selectedViewLoc.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedViewLoc.type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedViewLoc.status}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Address</p>
                <p className="font-medium">{selectedViewLoc.address}</p>
              </div>
              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => setSelectedViewLoc(null)} className="h-9 px-5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg">Close</Button>
              </div>
            </div>
          </div>
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