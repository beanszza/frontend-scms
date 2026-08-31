"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import { Order, SupplyItem, Supplier, PaymentType } from "./types";

interface CreateOrderModalProps {
  open: boolean;
  editingOrder: Order | null;
  itemsList: SupplyItem[];
  suppliersList: Supplier[];
  onClose: () => void;
  onSave: (formData: FormData, isEdit: boolean) => Promise<void>;
}

export default function CreateOrderModal({
  open,
  editingOrder,
  itemsList,
  suppliersList,
  onClose,
  onSave,
}: CreateOrderModalProps) {
  const [supplierId, setSupplierId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [eta, setEta] = useState("");
  const [payment, setPayment] = useState<PaymentType>("Payable");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [supplierError, setSupplierError] = useState("");
  const [itemError, setItemError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [etaError, setEtaError] = useState("");
  const [receiptError, setReceiptError] = useState("");

  useEffect(() => {
    if (editingOrder) {
      setSupplierId(editingOrder.supplierId?.toString() || "");
      setItemId(editingOrder.itemId?.toString() || "");
      setQuantity(editingOrder.quantity?.toString() || "");
      setEta(editingOrder.eta || "");
      setPayment(editingOrder.payment || "Payable");
    } else {
      setSupplierId("");
      setItemId("");
      setQuantity("");
      setEta("");
      setPayment("Payable");
    }
    setReceiptFile(null);
    setSupplierError("");
    setItemError("");
    setQuantityError("");
    setEtaError("");
    setReceiptError("");
  }, [editingOrder, open]);

  const handleSubmit = async () => {
    let isValid = true;
    if (!supplierId) { setSupplierError("Supplier is required."); isValid = false; }
    if (!itemId) { setItemError("Item is required."); isValid = false; }
    if (!quantity || Number(quantity) <= 0) { setQuantityError("Valid quantity is required."); isValid = false; }
    if (!eta) { setEtaError("Expected arrival date is required."); isValid = false; }
    if (!editingOrder && !receiptFile) { setReceiptError("Receipt or PO proof is required."); isValid = false; }

    if (!isValid) return;

    try {
      setIsSaving(true);
      const fd = new FormData();
      fd.append("SupplierId", supplierId);
      fd.append("ItemId", itemId);
      fd.append("Quantity", quantity);
      fd.append("Eta", eta);
      fd.append("Payment", payment);
      if (receiptFile) fd.append("Receipt", receiptFile);

      await onSave(fd, !!editingOrder);
      onClose();
    } catch {
      alert("Failed to save order.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalWrapper open={open} title={editingOrder ? "Edit Purchase Order" : "Create New Purchase Order"} onClose={onClose} size="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Supplier <span className="text-muted-foreground">*</span></label>
          <select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setSupplierError(""); }} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring">
            <option value="" disabled hidden>Select supplier...</option>
            {suppliersList.map((s) => <option key={s.supplierId} value={s.supplierId}>{s.companyName}</option>)}
          </select>
          {supplierError && <p className="mt-1 text-xs text-red-500">{supplierError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Item <span className="text-muted-foreground">*</span></label>
          <select value={itemId} onChange={(e) => { setItemId(e.target.value); setItemError(""); }} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring">
            <option value="" disabled hidden>Select item...</option>
            {itemsList.map((i) => <option key={i.itemId} value={i.itemId}>{i.itemName}</option>)}
          </select>
          {itemError && <p className="mt-1 text-xs text-red-500">{itemError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Quantity <span className="text-muted-foreground">*</span></label>
            {/* step matches the backend's numeric(18,3): without it the browser rejects "12.5". */}
            <Input type="number" min={0.001} step={0.001} value={quantity} onChange={(e) => { setQuantity(e.target.value); setQuantityError(""); }} placeholder="e.g. 100" className="rounded-xl border border-border bg-card text-foreground text-sm" />
            {quantityError && <p className="mt-1 text-xs text-red-500">{quantityError}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Expected Arrival (ETA) <span className="text-muted-foreground">*</span></label>
            <Input type="date" value={eta} onChange={(e) => { setEta(e.target.value); setEtaError(""); }} className="rounded-xl border border-border bg-card text-foreground text-sm" />
            {etaError && <p className="mt-1 text-xs text-red-500">{etaError}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Payment Type <span className="text-muted-foreground">*</span></label>
          <select value={payment} onChange={(e) => setPayment(e.target.value as PaymentType)} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring">
            <option value="Payable">Payable</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Receipt / Proof {!editingOrder && "*"}</label>
          <div className="border border-dashed border-border rounded-xl p-4 text-center hover:bg-muted/30 transition-colors relative">
            <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => { setReceiptFile(e.target.files?.[0] || null); setReceiptError(""); }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            <div className="flex flex-col items-center pointer-events-none">
              <Upload className="w-6 h-6 text-muted-foreground mb-1" />
              <span className="text-xs font-medium text-foreground">{receiptFile ? receiptFile.name : "Upload receipt / PO document"}</span>
            </div>
          </div>
          {receiptError && <p className="mt-1 text-xs text-red-500">{receiptError}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors">
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSaving} className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors flex items-center gap-2">
            {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
            {editingOrder ? "Save Changes" : "Create Order"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
