"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";
import ConfirmModal from "@/components/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { Order, SupplyItem, Supplier } from "@/components/orders-procurement/types";
import ProcurementSummaryCards from "@/components/orders-procurement/ProcurementSummaryCards";
import ProcurementTable from "@/components/orders-procurement/ProcurementTable";
import CreateOrderModal from "@/components/orders-procurement/CreateOrderModal";
import OrderDetailsModal from "@/components/orders-procurement/OrderDetailsModal";
import ProcurementQAInspectionModal from "@/components/orders-procurement/ProcurementQAInspectionModal";

export default function OrdersProcurementPage() {
  const auth = useAuth();
  const user = auth?.user;
  const isAuth =
    user?.username === "scmsuser" || user?.username === "ERP-ADMIN" ||
    user?.email === "scmsuser@r3b2p.com" || user?.email === "admin@r3b2p.com" || user?.roles?.includes("Admin");

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [itemsList, setItemsList] = useState<SupplyItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);

  const [showNew, setShowNew] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [qaOrder, setQaOrder] = useState<Order | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "arrived" | "cancel"; orderId: string; poId: number; message: string } | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/api/scms/api/PurchaseOrders?page=${page}&pageSize=10&search=${search}&status=${filter}`);
      if (res.data?.success) {
        const raw = res.data.data.items || res.data.data || [];
        setOrders(
          raw.map((o: any) => ({
            id: `PO-${String(o.poId || o.purchaseOrderId).padStart(4, "0")}`,
            poId: o.poId || o.purchaseOrderId,
            item: o.itemName || o.item || "",
            itemId: o.itemId,
            category: o.category || "",
            supplier: o.supplierName || o.supplier || "",
            supplierId: o.supplierId,
            quantity: o.quantityOrdered || o.quantity || 0,
            orderDate: o.orderDate ? new Date(o.orderDate).toLocaleDateString() : "",
            eta: o.expectedArrival ? new Date(o.expectedArrival).toLocaleDateString() : "",
            status: o.status || "Pending",
            payment: o.payment || "Payable",
            arrivalDate: o.arrivalDate ? new Date(o.arrivalDate).toLocaleDateString() : undefined,
            qaInspected: o.qaInspected,
            qaStatus: o.qaStatus,
            inspectedBy: o.inspectedBy,
            received: o.receivedQuantity,
            qaApproved: o.qaApprovedQuantity,
            qaNotes: o.qaNotes,
            unit: o.uomName || "pcs",
            proofImageUrl: o.receiptUrl || o.proofImageUrl,
          }))
        );
        setTotalPages(res.data.data.totalPages || 1);
        setTotalCount(res.data.data.totalCount || raw.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchItemsAndSuppliers = async () => {
    try {
      const [itRes, supRes] = await Promise.allSettled([
        api.get(`/api/scms/api/Items?page=1&pageSize=1000`),
        api.get(`/api/scms/api/Suppliers?page=1&pageSize=1000`),
      ]);
      if (itRes.status === "fulfilled" && itRes.value.data?.success) setItemsList(itRes.value.data.data.items || itRes.value.data.data || []);
      if (supRes.status === "fulfilled" && supRes.value.data?.success) setSuppliersList(supRes.value.data.data.items || supRes.value.data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchItemsAndSuppliers(); }, []);
  useEffect(() => { fetchOrders(); }, [page, search, filter]);

  const handleSaveOrder = async (fd: FormData, isEdit: boolean) => {
    if (isEdit && editOrder) await api.put(`/api/scms/api/PurchaseOrders/${editOrder.poId}`, fd);
    else await api.post("/api/scms/api/PurchaseOrders", fd);
    fetchOrders();
  };

  const handleMarkArrived = async (poId: number) => {
    try {
      await api.put(`/api/scms/api/PurchaseOrders/${poId}/status`, { status: "Arrived" });
      fetchOrders();
    } catch { alert("Failed to mark order as arrived."); }
  };

  const handleCancelOrder = async (poId: number) => {
    try {
      await api.put(`/api/scms/api/PurchaseOrders/${poId}/status`, { status: "Cancelled" });
      fetchOrders();
    } catch { alert("Failed to cancel order."); }
  };

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl animate-page-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Orders & Procurement</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage purchase orders, suppliers, and incoming shipments</p>
        </div>
        <div className="flex items-center gap-3">
          {isAuth && (
            <Link href="/reports?tab=procurement" className="flex items-center gap-2 rounded-xl bg-card border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              <FileText size={16} /> Reports
            </Link>
          )}
          <Button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 transition-colors shadow-sm">
            <Plus size={16} /> New Order
          </Button>
        </div>
      </div>

      <ProcurementSummaryCards orders={orders} />

      <div className="mb-6 border border-border rounded-md overflow-hidden bg-card">
        <div className="flex items-center justify-between gap-sm px-md py-sm bg-muted/20">
          <div className="flex items-center gap-sm flex-1">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Search by Order No., Item, or Supplier..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-8 p-0 text-body-sm flex-1 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-sm shrink-0">
            <Select value={filter} onValueChange={(val) => { setFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-8 text-body-sm bg-transparent border-input">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {["All", "Pending", "Arrived", "Completed", "Cancelled", "Rejected"].map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ProcurementTable
        orders={orders}
        onQAInspection={(o) => setQaOrder(o)}
        onEdit={(o) => setEditOrder(o)}
        onMarkArrived={(o) => setConfirmAction({ type: "arrived", orderId: o.id, poId: o.poId, message: `Mark order ${o.id} as Arrived?` })}
        onCancel={(o) => setConfirmAction({ type: "cancel", orderId: o.id, poId: o.poId, message: `Cancel order ${o.id}?` })}
        onViewDetails={(o) => setViewOrder(o)}
      />

      <Pagination currentPage={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />

      <CreateOrderModal open={showNew || !!editOrder} editingOrder={editOrder} itemsList={itemsList} suppliersList={suppliersList} onClose={() => { setShowNew(false); setEditOrder(null); }} onSave={handleSaveOrder} />
      <OrderDetailsModal order={viewOrder} onClose={() => setViewOrder(null)} />
      <ProcurementQAInspectionModal order={qaOrder} onClose={() => setQaOrder(null)} onComplete={fetchOrders} />

      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          onConfirm={() => {
            if (confirmAction.type === "arrived") handleMarkArrived(confirmAction.poId);
            else handleCancelOrder(confirmAction.poId);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}