"use client";

import React, { useState } from "react";
import { Search, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductionRequest } from "./types";
import { productionStorage } from "./productionStorage";
import ProductionKpiCards from "./ProductionKpiCards";
import ProductionSummaryModal from "./ProductionSummaryModal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";

interface ProductionRequestTabProps {
  isAdmin: boolean;
  isHeadCook: boolean;
  onNavigateToTracking: (batchId: number) => void;
}

export default function ProductionRequestTab({
  isAdmin,
  isHeadCook,
  onNavigateToTracking,
}: ProductionRequestTabProps) {
  const [requests, setRequests] = useState<ProductionRequest[]>(() =>
    productionStorage.getRequests()
  );
  const products = productionStorage.getProducts();

  // Active status tab: Admin sees Pending Approval (Request) and Approved tabs
  const [activeTab, setActiveTab] = useState<string>(isAdmin ? "Pending Approval" : "All");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Request Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState<number>(
    products[0]?.productId || 1
  );
  const [selectedVariant, setSelectedVariant] = useState<string>(
    products[0]?.variations[0]?.size || "250g (Tub)"
  );
  const [targetQuantity, setTargetQuantity] = useState<number | "">(100);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [purpose, setPurpose] = useState("");

  // Admin Review Modal state (3 dots action)
  const [reviewingBatch, setReviewingBatch] = useState<ProductionRequest | null>(null);
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Summary Report Modal state
  const [viewingSummaryBatch, setViewingSummaryBatch] = useState<ProductionRequest | null>(null);

  const refreshRequests = () => {
    setRequests(productionStorage.getRequests());
  };

  // Tabs list based on role
  const allTabs = [
    { key: "All", label: "All Requests" },
    { key: "Draft", label: "Draft" },
    { key: "Pending Approval", label: "Pending Approval" },
    { key: "In Progress", label: "In Progress" },
    { key: "Approved", label: "Approved" },
    { key: "Rejected", label: "Rejected" },
    { key: "Cancelled", label: "Cancelled" },
    { key: "Completed", label: "Completed" },
  ];

  const adminTabs = [
    { key: "Pending Approval", label: "Requests (Pending)" },
    { key: "Approved", label: "Approved Requests" },
  ];

  const currentTabs = isAdmin ? adminTabs : allTabs;

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.variant.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (isAdmin) {
      if (activeTab === "Pending Approval") return r.status === "Pending Approval";
      if (activeTab === "Approved") return r.status === "Approved" || r.status === "In Progress" || r.status === "Completed";
      return true;
    }

    if (activeTab === "All") return true;
    return r.status === activeTab;
  });

  // KPI counts
  const totalRequests = requests.length;
  const pendingApprovalCount = requests.filter((r) => r.status === "Pending Approval").length;
  const activeBatchesCount = requests.filter((r) => r.status === "In Progress").length;

  // Selected product variations for modal
  const currentProduct = products.find((p) => p.productId === selectedProdId) || products[0];

  const handleOpenCreateModal = () => {
    if (products.length === 0) {
      toast.error("Please configure at least one finished product in Configuration first.");
      return;
    }
    const p = products[0];
    setSelectedProdId(p.productId);
    setSelectedVariant(
      p.variations[0] ? `${p.variations[0].size} (${p.variations[0].packagingType})` : "Standard"
    );
    setTargetQuantity(100);
    setTargetDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
    setPurpose("");
    setIsCreateOpen(true);
  };

  const handleSaveRequest = (status: "Draft" | "Pending Approval") => {
    if (!currentProduct) {
      toast.error("Product configuration required");
      return;
    }
    if (!targetQuantity || Number(targetQuantity) <= 0) {
      toast.error("Please specify a valid target quantity");
      return;
    }
    if (!targetDate) {
      toast.error("Please specify target date to start production");
      return;
    }

    const newReq = productionStorage.createRequest({
      productId: currentProduct.productId,
      productName: currentProduct.name,
      variant: selectedVariant,
      targetYield: Number(targetQuantity),
      purpose: purpose.trim() || "Standard Batch Replenishment",
      scheduleDate: targetDate,
      status,
      assignedCook: isHeadCook ? "Head Cook" : "Elena",
    });

    toast.success(
      status === "Draft"
        ? `Request saved as Draft (${newReq.batchNumber})`
        : `Request submitted for Admin Approval (${newReq.batchNumber})`
    );
    setIsCreateOpen(false);
    refreshRequests();
  };

  const handleApprove = (batchId: number) => {
    productionStorage.approveRequest(batchId, "Administrator");
    toast.success("Batch production request approved!");
    setReviewingBatch(null);
    refreshRequests();
  };

  const handleConfirmReject = () => {
    if (!reviewingBatch) return;
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    productionStorage.rejectRequest(reviewingBatch.batchId, rejectReason.trim());
    toast.error(`Batch ${reviewingBatch.batchNumber} has been rejected.`);
    setReviewingBatch(null);
    setIsRejectMode(false);
    setRejectReason("");
    refreshRequests();
  };

  const handleStartPreProduction = (batchId: number) => {
    productionStorage.startPreProduction(batchId);
    toast.success("Pre-production initiated! Proceeding to Production Tracking...");
    refreshRequests();
    onNavigateToTracking(batchId);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & New Request Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Production Requests</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Submit, review, and approve planned batches for production.
          </p>
        </div>

        {!isAdmin && (
          <Button
            onClick={handleOpenCreateModal}
            className="h-9 px-4 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 shrink-0 transition-colors shadow-xs"
          >
            New Production Request
          </Button>
        )}
      </div>

      {/* KPI Cards (Exact Inventory Design) */}
      <ProductionKpiCards
        totalRequests={totalRequests}
        pendingApprovalCount={pendingApprovalCount}
        activeBatchesCount={activeBatchesCount}
      />

      {/* Sub-tabs & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {currentTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search batch or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs border border-border bg-card"
            />
          </div>
        </div>

        {/* Requests Table (Purpose removed, Variant added, Target Date added, StatusBadge, no logo buttons) */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs">
              No production requests found in this view.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Batch Number</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Variant</th>
                    <th className="py-3 px-4">Target Output</th>
                    <th className="py-3 px-4">Target Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map((req) => (
                    <tr key={req.batchId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {req.batchNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {req.productName}
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">
                        {req.variant}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        {req.targetYield} {req.yieldUnit}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(req.scheduleDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Admin: 3-dots action for review / accept / reject */}
                          {isAdmin && req.status === "Pending Approval" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReviewingBatch(req);
                                setIsRejectMode(false);
                                setRejectReason("");
                              }}
                              className="h-7 px-2.5 text-xs font-semibold border-border hover:bg-muted"
                              title="Review Request"
                            >
                              <MoreHorizontal size={14} />
                            </Button>
                          )}

                          {/* Requester: Start Pre-Prod (solid black button, no logo, like Order Now) */}
                          {!isAdmin && req.status === "Approved" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartPreProduction(req.batchId)}
                              className="h-7 px-3 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md shadow-xs cursor-pointer"
                            >
                              Start Pre-Prod
                            </Button>
                          )}

                          {/* In Progress: Track */}
                          {req.status === "In Progress" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onNavigateToTracking(req.batchId)}
                              className="h-7 px-3 text-xs font-semibold border-border hover:bg-muted transition-colors rounded-md"
                            >
                              Track Batch
                            </Button>
                          )}

                          {/* Completed: View Report */}
                          {req.status === "Completed" && req.summaryReport && (
                            <Button
                              size="sm"
                              onClick={() => setViewingSummaryBatch(req)}
                              className="h-7 px-3 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md shadow-xs cursor-pointer"
                            >
                              View Report
                            </Button>
                          )}

                          {/* Rejected status info */}
                          {req.status === "Rejected" && req.rejectionReason && (
                            <span
                              className="text-[10px] text-muted-foreground italic truncate max-w-[140px]"
                              title={req.rejectionReason}
                            >
                              {req.rejectionReason}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Production Request Modal (Radix Dialog - Guaranteed Visible) ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border p-6 shadow-2xl">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-base font-bold text-foreground">
              New Production Batch Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Request authorization from Admin to produce finished goods
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Select Finished Product <span className="text-foreground">*</span>
              </label>
              <Select
                value={selectedProdId.toString()}
                onValueChange={(val) => {
                  const pid = parseInt(val, 10);
                  setSelectedProdId(pid);
                  const p = products.find((prod) => prod.productId === pid);
                  if (p && p.variations[0]) {
                    setSelectedVariant(
                      `${p.variations[0].size} (${p.variations[0].packagingType})`
                    );
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose Product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.productId} value={p.productId.toString()} className="text-xs">
                      {p.name} &mdash; {p.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Select Product Variant <span className="text-foreground">*</span>
              </label>
              <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose Variant" />
                </SelectTrigger>
                <SelectContent>
                  {currentProduct?.variations.map((v) => (
                    <SelectItem
                      key={v.id}
                      value={`${v.size} (${v.packagingType})`}
                      className="text-xs"
                    >
                      {v.size} ({v.packagingType}) &mdash; {v.sku}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Target Output Quantity (PCS) <span className="text-foreground">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={targetQuantity}
                  onChange={(e) =>
                    setTargetQuantity(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                  }
                  className="h-9 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Target Date to Start Production <span className="text-foreground">*</span>
                </label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-9 text-xs cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Production Purpose / Notes
              </label>
              <Textarea
                placeholder="e.g. Replenishment for weekly buffer, bulk store demand..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="text-xs resize-none"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10 text-xs">
              <span className="text-muted-foreground">Batch Number:</span>
              <span className="font-mono font-bold text-foreground">
                System Generated (Unique sequence)
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs font-semibold border-border hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSaveRequest("Draft")}
                className="text-xs font-semibold border-border hover:bg-muted"
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSaveRequest("Pending Approval")}
                className="text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
              >
                Submit for Approval
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Admin Review Modal (Radix Dialog - Guaranteed Visible) ── */}
      <Dialog open={!!reviewingBatch} onOpenChange={(open) => { if (!open) setReviewingBatch(null); }}>
        <DialogContent className="sm:max-w-md bg-card border-border p-6 shadow-2xl">
          {reviewingBatch && (
            <>
              <DialogHeader className="border-b border-border pb-3">
                <DialogTitle className="text-base font-bold text-foreground">
                  Review Production Request
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-muted-foreground">
                  {reviewingBatch.batchNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Request Details Review */}
                <div className="space-y-2 text-xs border border-border rounded-lg p-3 bg-muted/10">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Product:</span>
                    <span className="font-bold text-foreground">{reviewingBatch.productName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Variant:</span>
                    <span className="font-semibold text-foreground">{reviewingBatch.variant}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Target Output:</span>
                    <span className="font-bold text-foreground">{reviewingBatch.targetYield} PCS</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Target Start Date:</span>
                    <span className="font-semibold text-foreground">
                      {new Date(reviewingBatch.scheduleDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Purpose:</span>
                    <span className="text-foreground max-w-[200px] text-right truncate">
                      {reviewingBatch.purpose || "Standard production"}
                    </span>
                  </div>
                </div>

                {/* Rejection input when in reject mode */}
                {isRejectMode ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground block">
                      Reason for Rejection
                    </label>
                    <Textarea
                      placeholder="Enter reason for rejecting this batch request..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="text-xs resize-none"
                      rows={3}
                      required
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRejectMode(false)}
                        className="text-xs font-semibold"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirmReject}
                        className="text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReviewingBatch(null)}
                      className="text-xs font-semibold border-border hover:bg-muted"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsRejectMode(true)}
                      className="text-xs font-semibold border-border hover:bg-muted"
                    >
                      Reject
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleApprove(reviewingBatch.batchId)}
                      className="text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── View Summary Report Modal ── */}
      {viewingSummaryBatch && viewingSummaryBatch.summaryReport && (
        <ProductionSummaryModal
          open={!!viewingSummaryBatch}
          onClose={() => setViewingSummaryBatch(null)}
          report={viewingSummaryBatch.summaryReport}
        />
      )}
    </div>
  );
}
