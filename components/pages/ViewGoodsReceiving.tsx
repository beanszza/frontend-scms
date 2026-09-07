"use client";

import React, { useState, useEffect } from "react";
import { PackageCheck, Plus, Search, FileText, ClipboardList, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface GRN {
  goodsReceiptId: number;
  receiptNumber: string;
  purchaseOrderId: number;
  poNumber: string;
  supplierName: string;
  receivedDate: string;
  status: string;
  receivedBy: string;
  notes?: string;
  items?: GRNItem[];
}

interface GRNItem {
  goodsReceiptItemId: number;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  uomName: string;
  lotCode?: string;
  expiryDate?: string;
}

interface QCInspection {
  qualityInspectionId: number;
  inspectionNumber: string;
  receiptNumber: string;
  supplierName: string;
  inspectedDate: string;
  status: string;
  acceptedQty: number;
  rejectedQty: number;
  inspectedBy?: string;
}

interface NCR {
  nonConformanceId: number;
  ncrNumber: string;
  receiptNumber: string;
  supplierName: string;
  defectType: string;
  affectedLots: string;
  status: string;
  raisedDate: string;
}

interface RTV {
  returnToVendorId: number;
  rtvNumber: string;
  supplierName: string;
  returnDate: string;
  reason: string;
  status: string;
  totalValue: number;
}

interface PurchaseOrder {
  poId: number;
  poNumber: string;
  supplierName: string;
  status: string;
}

function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function ViewGoodsReceiving() {
  const [tab, setTab] = useState("grn");
  const [grns, setGrns] = useState<GRN[]>([]);
  const [qcs, setQcs] = useState<QCInspection[]>([]);
  const [ncrs, setNcrs] = useState<NCR[]>([]);
  const [rtvs, setRtvs] = useState<RTV[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<GRN | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // New GRN form state
  const [newGrn, setNewGrn] = useState({ poId: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [grnRes, qcRes, ncrRes, rtvRes, poRes] = await Promise.allSettled([
        api.get("/api/scms/api/GoodsReceipts?page=1&pageSize=100"),
        api.get("/api/scms/api/QualityInspections?page=1&pageSize=100"),
        api.get("/api/scms/api/NonConformanceReports?page=1&pageSize=100"),
        api.get("/api/scms/api/ReturnToVendors?page=1&pageSize=100"),
        api.get("/api/scms/api/PurchaseOrders?page=1&pageSize=100&status=Received"),
      ]);
      if (grnRes.status === "fulfilled" && grnRes.value.data?.success) {
        const raw = grnRes.value.data.data?.items || grnRes.value.data.data || [];
        setGrns(raw.map((r: any) => ({
          goodsReceiptId: r.goodsReceiptId,
          receiptNumber: r.receiptNumber || `GRN-${String(r.goodsReceiptId).padStart(4,"0")}`,
          purchaseOrderId: r.purchaseOrderId,
          poNumber: r.poNumber || `PO-${String(r.purchaseOrderId).padStart(4,"0")}`,
          supplierName: r.supplierName || "—",
          receivedDate: r.receivedDate ? new Date(r.receivedDate).toLocaleDateString() : "—",
          status: r.status || "Draft",
          receivedBy: r.receivedBy || "—",
          notes: r.notes,
        })));
      }
      if (qcRes.status === "fulfilled" && qcRes.value.data?.success) {
        const raw = qcRes.value.data.data?.items || qcRes.value.data.data || [];
        setQcs(raw.map((r: any) => ({
          qualityInspectionId: r.qualityInspectionId,
          inspectionNumber: r.inspectionNumber || `QC-${String(r.qualityInspectionId).padStart(4,"0")}`,
          receiptNumber: r.receiptNumber || "—",
          supplierName: r.supplierName || "—",
          inspectedDate: r.inspectedDate ? new Date(r.inspectedDate).toLocaleDateString() : "—",
          status: r.status || "Pending",
          acceptedQty: r.acceptedQty || 0,
          rejectedQty: r.rejectedQty || 0,
          inspectedBy: r.inspectedBy,
        })));
      }
      if (ncrRes.status === "fulfilled" && ncrRes.value.data?.success) {
        const raw = ncrRes.value.data.data?.items || ncrRes.value.data.data || [];
        setNcrs(raw.map((r: any) => ({
          nonConformanceId: r.nonConformanceId,
          ncrNumber: r.ncrNumber || `NCR-${String(r.nonConformanceId).padStart(4,"0")}`,
          receiptNumber: r.receiptNumber || "—",
          supplierName: r.supplierName || "—",
          defectType: r.defectType || "—",
          affectedLots: r.affectedLots || "—",
          status: r.status || "Open",
          raisedDate: r.raisedDate ? new Date(r.raisedDate).toLocaleDateString() : "—",
        })));
      }
      if (rtvRes.status === "fulfilled" && rtvRes.value.data?.success) {
        const raw = rtvRes.value.data.data?.items || rtvRes.value.data.data || [];
        setRtvs(raw.map((r: any) => ({
          returnToVendorId: r.returnToVendorId,
          rtvNumber: r.rtvNumber || `RTV-${String(r.returnToVendorId).padStart(4,"0")}`,
          supplierName: r.supplierName || "—",
          returnDate: r.returnDate ? new Date(r.returnDate).toLocaleDateString() : "—",
          reason: r.reason || "—",
          status: r.status || "Pending",
          totalValue: r.totalValue || 0,
        })));
      }
      if (poRes.status === "fulfilled" && poRes.value.data?.success) {
        const raw = poRes.value.data.data?.items || poRes.value.data.data || [];
        setPendingPOs(raw.map((o: any) => ({
          poId: o.poId || o.purchaseOrderId,
          poNumber: o.poNumber || `PO-${String(o.poId || o.purchaseOrderId).padStart(4,"0")}`,
          supplierName: o.supplierName || "—",
          status: o.status,
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreateGrn = async () => {
    if (!newGrn.poId) return;
    setSaving(true);
    try {
      await api.post("/api/scms/api/GoodsReceipts", {
        purchaseOrderId: parseInt(newGrn.poId),
        notes: newGrn.notes,
      });
      setShowGrnModal(false);
      setNewGrn({ poId: "", notes: "" });
      fetchAll();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const q = search.toLowerCase().trim();

  const filteredGrns = grns.filter(g =>
    !q ||
    g.receiptNumber.toLowerCase().includes(q) ||
    g.supplierName.toLowerCase().includes(q) ||
    g.poNumber.toLowerCase().includes(q) ||
    (g.receivedBy && g.receivedBy.toLowerCase().includes(q))
  );

  const filteredQcs = qcs.filter(qc =>
    !q ||
    qc.inspectionNumber.toLowerCase().includes(q) ||
    qc.receiptNumber.toLowerCase().includes(q) ||
    qc.supplierName.toLowerCase().includes(q) ||
    qc.status.toLowerCase().includes(q)
  );

  const filteredNcrs = ncrs.filter(ncr =>
    !q ||
    ncr.ncrNumber.toLowerCase().includes(q) ||
    ncr.receiptNumber.toLowerCase().includes(q) ||
    ncr.supplierName.toLowerCase().includes(q) ||
    ncr.defectType.toLowerCase().includes(q) ||
    (ncr.affectedLots && ncr.affectedLots.toLowerCase().includes(q))
  );

  const filteredRtvs = rtvs.filter(rtv =>
    !q ||
    rtv.rtvNumber.toLowerCase().includes(q) ||
    rtv.supplierName.toLowerCase().includes(q) ||
    (rtv.reason && rtv.reason.toLowerCase().includes(q))
  );

  const summaryCards = [
    { label: "Total GRNs",       value: grns.length,           icon: PackageCheck },
    { label: "QC Inspections",    value: qcs.length,            icon: ClipboardList },
    { label: "Non-Conformances",  value: ncrs.length,           icon: AlertTriangle },
    { label: "Returns to Vendor", value: rtvs.length,           icon: RotateCcw },
  ];

  return (
    <div className="w-full min-h-full py-8 px-6 md:px-8 space-y-6 animate-page-in">
      <PageHeader
        title="Goods Receiving"
        description="Manage GRNs, QC inspections, non-conformance reports, and vendor returns"
        actions={
          <Button size="sm" onClick={() => setShowGrnModal(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> New GRN
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="h-9">
            <TabsTrigger value="grn" className="text-xs">GRN</TabsTrigger>
            <TabsTrigger value="qc" className="text-xs">QC Inspections</TabsTrigger>
            <TabsTrigger value="ncr" className="text-xs">NCR</TabsTrigger>
            <TabsTrigger value="rtv" className="text-xs">Return to Vendor</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm w-60"
              placeholder="Search by ID, supplier, PO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── GRN Tab ── */}
        <TabsContent value="grn" className="mt-4">
          <Card className="border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-xs font-semibold text-muted-foreground">GRN #</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">PO #</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Supplier</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Received Date</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Received By</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <SkeletonRows cols={6} />
                ) : filteredGrns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState
                        icon={PackageCheck}
                        title="No goods receipts found"
                        description="Create a GRN from an arrived purchase order to record received stock."
                      />
                    </TableCell>
                  </TableRow>
                ) : filteredGrns.map((grn) => (
                  <TableRow
                    key={grn.goodsReceiptId}
                    className="border-border cursor-pointer hover:bg-muted/40 text-sm"
                    onClick={() => { setSelectedGrn(grn); setShowDetailModal(true); }}
                  >
                    <TableCell className="font-mono text-xs font-semibold">{grn.receiptNumber}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{grn.poNumber}</TableCell>
                    <TableCell className="font-medium">{grn.supplierName}</TableCell>
                    <TableCell className="text-muted-foreground">{grn.receivedDate}</TableCell>
                    <TableCell className="text-muted-foreground">{grn.receivedBy}</TableCell>
                    <TableCell><StatusBadge status={grn.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── QC Tab ── */}
        <TabsContent value="qc" className="mt-4">
          <Card className="border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-xs font-semibold text-muted-foreground">Inspection #</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">GRN #</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Supplier</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Inspected</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Accepted</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Rejected</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <SkeletonRows cols={7} />
                ) : filteredQcs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        icon={ClipboardList}
                        title="No QC inspections found"
                        description="QC inspections are automatically created when a GRN is processed."
                      />
                    </TableCell>
                  </TableRow>
                ) : filteredQcs.map((qc) => (
                  <TableRow key={qc.qualityInspectionId} className="border-border text-sm">
                    <TableCell className="font-mono text-xs font-semibold">{qc.inspectionNumber}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{qc.receiptNumber}</TableCell>
                    <TableCell className="font-medium">{qc.supplierName}</TableCell>
                    <TableCell className="text-muted-foreground">{qc.inspectedDate}</TableCell>
                    <TableCell>{qc.acceptedQty.toLocaleString()}</TableCell>
                    <TableCell>{qc.rejectedQty.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={qc.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── NCR Tab ── */}
        <TabsContent value="ncr" className="mt-4">
          <Card className="border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-xs font-semibold text-muted-foreground">NCR #</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">GRN #</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Supplier</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Defect Type</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Affected Lots</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Raised</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <SkeletonRows cols={7} />
                ) : filteredNcrs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        icon={AlertTriangle}
                        title="No non-conformances found"
                        description="NCRs are raised when QC inspections detect defective or non-compliant goods."
                      />
                    </TableCell>
                  </TableRow>
                ) : filteredNcrs.map((ncr) => (
                  <TableRow key={ncr.nonConformanceId} className="border-border text-sm">
                    <TableCell className="font-mono text-xs font-semibold">{ncr.ncrNumber}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{ncr.receiptNumber}</TableCell>
                    <TableCell className="font-medium">{ncr.supplierName}</TableCell>
                    <TableCell className="text-muted-foreground">{ncr.defectType}</TableCell>
                    <TableCell className="text-muted-foreground">{ncr.affectedLots}</TableCell>
                    <TableCell className="text-muted-foreground">{ncr.raisedDate}</TableCell>
                    <TableCell><StatusBadge status={ncr.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── RTV Tab ── */}
        <TabsContent value="rtv" className="mt-4">
          <Card className="border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-xs font-semibold text-muted-foreground">RTV #</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Supplier</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Return Date</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Reason</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Total Value</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <SkeletonRows cols={6} />
                ) : filteredRtvs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState
                        icon={RotateCcw}
                        title="No vendor returns found"
                        description="Return to Vendor documents are created from NCRs when goods need to be sent back."
                      />
                    </TableCell>
                  </TableRow>
                ) : filteredRtvs.map((rtv) => (
                  <TableRow key={rtv.returnToVendorId} className="border-border text-sm">
                    <TableCell className="font-mono text-xs font-semibold">{rtv.rtvNumber}</TableCell>
                    <TableCell className="font-medium">{rtv.supplierName}</TableCell>
                    <TableCell className="text-muted-foreground">{rtv.returnDate}</TableCell>
                    <TableCell className="text-muted-foreground">{rtv.reason}</TableCell>
                    <TableCell>₱{rtv.totalValue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell><StatusBadge status={rtv.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Create GRN Modal ── */}
      <Dialog open={showGrnModal} onOpenChange={setShowGrnModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Create Goods Receipt (GRN)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Purchase Order</Label>
              <Select value={newGrn.poId} onValueChange={(v) => setNewGrn((p) => ({ ...p, poId: v }))}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a received PO..." />
                </SelectTrigger>
                <SelectContent>
                  {pendingPOs.length === 0
                    ? <SelectItem value="none" disabled>No received POs available</SelectItem>
                    : pendingPOs.map((po) => (
                        <SelectItem key={po.poId} value={String(po.poId)}>
                          {po.poNumber} — {po.supplierName}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes (optional)</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Add receiving notes..."
                value={newGrn.notes}
                onChange={(e) => setNewGrn((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowGrnModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateGrn} disabled={saving || !newGrn.poId}>
              {saving ? "Creating..." : "Create GRN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── GRN Detail Modal ── */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {selectedGrn?.receiptNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedGrn && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">PO Number</p>
                  <p className="font-mono font-semibold">{selectedGrn.poNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedGrn.supplierName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Received Date</p>
                  <p>{selectedGrn.receivedDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={selectedGrn.status} />
                </div>
              </div>
              {selectedGrn.notes && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p>{selectedGrn.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDetailModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
