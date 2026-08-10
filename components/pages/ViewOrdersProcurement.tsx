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

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { History, Search, Filter, Plus, Calendar, Edit3, Eye, CheckCircle, PackageOpen, FileText, ChevronDown, Check, X, ShieldCheck, MoreHorizontal, ClipboardCheck, Pencil, Truck, XCircle, BarChart3, ArrowLeft, Upload, Loader2 } from "lucide-react";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";
import ConfirmModal from "@/components/ConfirmModal";
import { getImageUrl } from "@/lib/getImageUrl";
import { useAuth } from "@/context/AuthContext";

type OrderStatus = "Pending" | "Arrived" | "Completed" | "Cancelled" | "Rejected";
type PaymentType = "Payable" | "Paid";

type Order = {
  id: string;
  poId: number;
  item: string;
  itemId: number;
  category: string;
  supplier: string;
  supplierId: number;
  quantity: number;
  orderDate: string;
  eta: string;
  status: OrderStatus;
  payment: PaymentType;
  arrivalDate?: string;
  qaInspected?: string;
  qaStatus?: string;
  inspectedBy?: string;
  received?: number;
  qaApproved?: number;
  qaNotes?: string;
  unit: string;
  proofImageUrl?: string;
};

// Story II: "Create Procurement Report UI" row shape.
// TODO: once James's "Create Procurement Report API" ticket is done, this
// should come directly from ProcurementReportDto (backend-calculated
// Fulfillment Rate and Lead Time) instead of being derived client-side below.
type ProcurementReportRow = {
  poId: number;
  purchaseOrderId: string;
  supplier: string;
  issueDate: string;
  orderedQuantity: number;
  fulfillmentRate: number | null;
  leadTimeDays: number | null;
  inspectionStatus: string;
};

const formatDateToMDY = (dateInput: string | Date) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = d.getFullYear();
  return `${m}/${day}/${y}`;
};

const formatDateToYMD = (dateInput: string | Date) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = d.getFullYear();
  return `${y}-${m}-${day}`;
};

function validateEtaDate(value: string): string {
  if (!value) {
    return "Expected Arrival (ETA) is required.";
  }

  // Format validation
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(value)) {
    return "Invalid date format.";
  }

  const parts = value.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (month < 1 || month > 12) {
    return "Invalid month (must be 01-12).";
  }

  const daysInMonth = [
    31,
    (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31
  ];

  if (day < 1 || day > daysInMonth[month - 1]) {
    return `Invalid day for month ${month}.`;
  }

  if (year < 1000 || year > 9999) {
    return "Invalid year.";
  }

  // Check past date
  const inputDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate < today) {
    return "ETA cannot be in the past.";
  }

  return "";
}

// Also define API response types to map to Order
interface PurchaseOrderResponse {
  poId: number;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  expectedArrivalDate: string;
  status: string;
  paymentType: string;
  proofImageUrl: string;
  totalAmount: number;
  arrivalDate?: string;
  qaInspectedDate?: string;
  qaStatus?: string;
  inspectedBy?: string;
  qaNotes?: string;
  qaApprovedQuantity?: number;
  items: Array<{
    poItemId: number;
    itemId: number;
    itemName: string;
    poItemQuantity: number;
    receivedQuantity: number;
  }>;
}

interface ItemResponse {
  itemId: number;
  itemName: string;
  category: string;
  unitOfMeasure: string;
}

interface SupplierResponse {
  supplierId: number;
  companyName: string;
}

interface NewOrderModalContentProps {
  supplierId: string;
  setSupplierId: (value: string) => void;
  itemId: string;
  setItemId: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  eta: string;
  setEta: (value: string) => void;
  payment: PaymentType;
  setPayment: (value: PaymentType) => void;
  receiptFile: File | null;
  setReceiptFile: (file: File | null) => void;
  onClose: () => void;
  handleSave: () => void;
  itemsList: ItemResponse[];
  suppliersList: SupplierResponse[];
  isEdit?: boolean;
  proofImageUrl?: string;
  setProofImageUrl?: (value: string) => void;
  isSaving?: boolean;
  uploadStatus?: string;
  supplierError?: string;
  setSupplierError?: (value: string) => void;
  itemError?: string;
  setItemError?: (value: string) => void;
  quantityError?: string;
  setQuantityError?: (value: string) => void;
  etaError?: string;
  setEtaError?: (value: string) => void;
  receiptError?: string;
  setReceiptError?: (value: string) => void;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    Pending: "bg-yellow-100 text-yellow-700",
    Arrived: "bg-blue-100 text-foreground",
    Completed: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
    Rejected: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${styles[status]}`}>
      {status}
    </span>
  );
}

function InspectionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Passed: "bg-green-100 text-green-700",
    Failed: "bg-red-100 text-red-700",
    Pending: "bg-muted text-foreground",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
}


function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/50" onClick={onClose}>
      <div className="relative w-[90vw] max-w-[90vw] sm:max-w-[80vw] md:max-w-[700px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto p-md sm:p-lg rounded-lg sm:rounded-xl bg-card shadow-2xl border border-border flex flex-col my-8" onClick={e => e.stopPropagation()}>
        <div className="overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function NewOrderModal({ onClose, onSave, itemsList, suppliersList }: { onClose: () => void; onSave: (o: Order) => void; itemsList: ItemResponse[]; suppliersList: SupplierResponse[]; }) {
  const [supplierId, setSupplierId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [eta, setEta] = useState("");
  const [payment, setPayment] = useState<PaymentType>("Payable");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [supplierError, setSupplierError] = useState("");
  const [itemError, setItemError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [etaError, setEtaError] = useState("");
  const [receiptError, setReceiptError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  async function handleSave() {
    let hasError = false;
    if (!supplierId) {
      setSupplierError("Supplier is required.");
      hasError = true;
    } else {
      setSupplierError("");
    }

    if (!itemId) {
      setItemError("Item is required.");
      hasError = true;
    } else {
      setItemError("");
    }

    if (!quantity || quantity.trim() === "") {
      setQuantityError("Quantity cannot be blank.");
      hasError = true;
    } else {
      const quantityNum = Number(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        setQuantityError("Quantity must be greater than 0.");
        hasError = true;
      } else {
        setQuantityError("");
      }
    }

    const etaErr = validateEtaDate(eta);
    if (etaErr) {
      setEtaError(etaErr);
      hasError = true;
    } else {
      setEtaError("");
    }

    if (!receiptFile) {
      setReceiptError("Receipt / Proof of Transaction is required.");
      hasError = true;
    } else {
      setReceiptError("");
    }

    if (hasError) return;

    setIsSaving(true);
    setUploadStatus("Creating order...");
    try {
      const parts = eta.split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month - 1, day, 23, 59, 59);

      const response = await api.post("/api/scms/api/PurchaseOrders", {
        supplierId: Number(supplierId),
        expectedArrivalDate: dateObj.toISOString(),
        paymentType: payment,
        totalAmount: 0,
        items: [{
          itemId: Number(itemId),
          poItemQuantity: Number(quantity)
        }]
      });

      if (response.data.success) {
        const poId = response.data.data.poId;
        if (receiptFile) {
          setUploadStatus("Uploading receipt...");
          const formData = new FormData();
          formData.append("file", receiptFile);
          await api.post(`/api/scms/api/PurchaseOrders/${poId}/upload-receipt`, formData);
          setUploadStatus("Upload complete!");
        }
        onSave(response.data.data);
      }
      onClose();
    } catch (error) {
      console.error("Error creating order", error);
      alert("Failed to create order");
    } finally {
      setIsSaving(false);
      setUploadStatus("");
    }
  }

  return (
    <NewOrderModalContent
      supplierId={supplierId}
      setSupplierId={setSupplierId}
      supplierError={supplierError}
      setSupplierError={setSupplierError}
      itemId={itemId}
      setItemId={setItemId}
      itemError={itemError}
      setItemError={setItemError}
      quantity={quantity}
      setQuantity={setQuantity}
      quantityError={quantityError}
      setQuantityError={setQuantityError}
      eta={eta}
      setEta={setEta}
      etaError={etaError}
      setEtaError={setEtaError}
      payment={payment}
      setPayment={setPayment}
      receiptFile={receiptFile}
      setReceiptFile={setReceiptFile}
      onClose={onClose}
      handleSave={handleSave}
      itemsList={itemsList}
      suppliersList={suppliersList}
      isSaving={isSaving}
      uploadStatus={uploadStatus}
      receiptError={receiptError}
      setReceiptError={setReceiptError}
    />
  );
}

function EditOrderModal({ order, onClose, onSave, itemsList, suppliersList }: { order: Order; onClose: () => void; onSave: () => void; itemsList: ItemResponse[]; suppliersList: SupplierResponse[]; }) {
  const [supplierId, setSupplierId] = useState(order.supplierId?.toString() || "");
  const [itemId, setItemId] = useState(order.itemId?.toString() || "");
  const [quantity, setQuantity] = useState(order.quantity?.toString() || "");
  const [eta, setEta] = useState(formatDateToYMD(order.eta) || "");
  const [payment, setPayment] = useState<PaymentType>(order.payment || "Payable");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [currentProofUrl, setCurrentProofUrl] = useState(order.proofImageUrl || "");

  const [supplierError, setSupplierError] = useState("");
  const [itemError, setItemError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [etaError, setEtaError] = useState("");
  const [receiptError, setReceiptError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  async function handleSave() {
    let hasError = false;
    if (!supplierId) {
      setSupplierError("Supplier is required.");
      hasError = true;
    } else {
      setSupplierError("");
    }

    if (!itemId) {
      setItemError("Item is required.");
      hasError = true;
    } else {
      setItemError("");
    }

    if (!quantity || quantity.trim() === "") {
      setQuantityError("Quantity cannot be blank.");
      hasError = true;
    } else {
      const quantityNum = Number(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        setQuantityError("Quantity must be greater than 0.");
        hasError = true;
      } else {
        setQuantityError("");
      }
    }

    const etaErr = validateEtaDate(eta);
    if (etaErr) {
      setEtaError(etaErr);
      hasError = true;
    } else {
      setEtaError("");
    }

    if (!currentProofUrl && !receiptFile) {
      setReceiptError("Receipt / Proof of Transaction is required.");
      hasError = true;
    } else {
      setReceiptError("");
    }

    if (hasError) return;

    setIsSaving(true);
    setUploadStatus("Saving changes...");
    try {
      const parts = eta.split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month - 1, day, 23, 59, 59);

      // Save order updates
      const response = await api.put(`/api/scms/api/PurchaseOrders/${order.poId}`, {
        supplierId: Number(supplierId),
        expectedArrivalDate: dateObj.toISOString(),
        paymentType: payment,
        totalAmount: 0,
        items: [{
          itemId: Number(itemId),
          poItemQuantity: Number(quantity)
        }]
      });

      if (response.data.success) {
        // Handle receipt removal
        if (!currentProofUrl && !receiptFile && order.proofImageUrl) {
          setUploadStatus("Removing receipt...");
          await api.delete(`/api/scms/api/PurchaseOrders/${order.poId}/receipt`);
        }

        // Handle receipt upload/re-upload
        if (receiptFile) {
          setUploadStatus("Uploading new receipt...");
          const formData = new FormData();
          formData.append("file", receiptFile);
          await api.post(`/api/scms/api/PurchaseOrders/${order.poId}/upload-receipt`, formData);
        }
        onSave();
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update order");
    } finally {
      setIsSaving(false);
      setUploadStatus("");
    }
  }

  return (
    <NewOrderModalContent
      supplierId={supplierId}
      setSupplierId={setSupplierId}
      supplierError={supplierError}
      setSupplierError={setSupplierError}
      itemId={itemId}
      setItemId={setItemId}
      itemError={itemError}
      setItemError={setItemError}
      quantity={quantity}
      setQuantity={setQuantity}
      quantityError={quantityError}
      setQuantityError={setQuantityError}
      eta={eta}
      setEta={setEta}
      etaError={etaError}
      setEtaError={setEtaError}
      payment={payment}
      setPayment={setPayment}
      receiptFile={receiptFile}
      setReceiptFile={setReceiptFile}
      onClose={onClose}
      handleSave={handleSave}
      itemsList={itemsList}
      suppliersList={suppliersList}
      isEdit={true}
      proofImageUrl={currentProofUrl}
      setProofImageUrl={setCurrentProofUrl}
      isSaving={isSaving}
      uploadStatus={uploadStatus}
      receiptError={receiptError}
      setReceiptError={setReceiptError}
    />
  );
}

function NewOrderModalContent({
  supplierId,
  setSupplierId,
  itemId,
  setItemId,
  quantity,
  setQuantity,
  eta,
  setEta,
  payment,
  setPayment,
  receiptFile,
  setReceiptFile,
  onClose,
  handleSave,
  itemsList,
  suppliersList,
  isEdit,
  proofImageUrl,
  setProofImageUrl,
  isSaving,
  uploadStatus,
  supplierError,
  setSupplierError,
  itemError,
  setItemError,
  quantityError,
  setQuantityError,
  etaError,
  setEtaError,
  receiptError,
  setReceiptError
}: NewOrderModalContentProps) {
  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E", "."].includes(e.key)) {
      e.preventDefault();
    }
  };
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold text-foreground mb-1">{isEdit ? "Edit Order" : "Create New Order"}</h2>
      <p className="text-sm text-muted-foreground mb-6">Purchase Raw Materials, Tools, or Supplies</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Supplier <span className="text-muted-foreground">*</span></label>
          <select
            disabled={isSaving}
            className={`w-full px-3 py-2.5 text-sm rounded-lg border ${supplierError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border'} bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50`}
            value={supplierId}
            onChange={e => {
              const val = e.target.value;
              setSupplierId(val);
              if (setSupplierError) {
                if (!val) setSupplierError("Supplier is required.");
                else setSupplierError("");
              }
            }}
          >
            <option value="" disabled hidden>Select supplier...</option>
            {suppliersList.map(s => <option key={s.supplierId} value={s.supplierId}>{s.companyName}</option>)}
          </select>
          {supplierError && <p className="mt-1 text-xs text-red-500">{supplierError}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Item <span className="text-muted-foreground">*</span></label>
          <select
            disabled={isSaving}
            className={`w-full px-3 py-2.5 text-sm rounded-lg border ${itemError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border'} bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50`}
            value={itemId}
            onChange={e => {
              const val = e.target.value;
              setItemId(val);
              if (setItemError) {
                if (!val) setItemError("Item is required.");
                else setItemError("");
              }
            }}
          >
            <option value="" disabled hidden>Select item...</option>
            {itemsList.map(i => <option key={i.itemId} value={i.itemId}>{i.itemName}</option>)}
          </select>
          {itemError && <p className="mt-1 text-xs text-red-500">{itemError}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Quantity <span className="text-muted-foreground">*</span></label>
            <Input
              disabled={isSaving}
              type="number"
              className={`w-full px-3 py-2.5 text-sm rounded-lg border ${quantityError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border'} bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50`}
              placeholder="e.g., 100"
              value={quantity}
              onKeyDown={handleNumberKeyDown}
              onChange={e => {
                let rawVal = e.target.value;
                if (rawVal.startsWith("-") || (rawVal !== "" && Number(rawVal) < 0)) {
                  rawVal = "0";
                }
                let cleanVal = rawVal.replace(/\D/g, "");
                if (cleanVal.startsWith("0") && cleanVal.length > 1) {
                  cleanVal = cleanVal.replace(/^0+/, "");
                  if (cleanVal === "") cleanVal = "0";
                }
                setQuantity(cleanVal);
                if (setQuantityError) {
                  if (!cleanVal || cleanVal.trim() === "") {
                    setQuantityError("Quantity cannot be blank.");
                  } else if (Number(cleanVal) <= 0) {
                    setQuantityError("Quantity must be greater than 0.");
                  } else {
                    setQuantityError("");
                  }
                }
              }}
            />
            {quantityError && <p className="mt-1 text-xs text-red-500">{quantityError}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Expected Arrival (ETA) <span className="text-muted-foreground">*</span></label>
            <Input
              disabled={isSaving}
              type="date"
              className={`w-full px-3 py-2.5 text-sm rounded-lg border ${etaError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border'} bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50`}
              value={eta}
              onChange={e => {
                const val = e.target.value;
                setEta(val);
                if (setEtaError) {
                  setEtaError(validateEtaDate(val));
                }
              }}
              onBlur={e => {
                if (setEtaError) {
                  const err = validateEtaDate(e.target.value);
                  setEtaError(err);
                }
              }}
            />
            {etaError && <p className="mt-1 text-xs text-red-500">{etaError}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Payment Type <span className="text-muted-foreground">*</span></label>
          <select disabled={isSaving} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50" value={payment} onChange={e => setPayment(e.target.value as PaymentType)}>
            <option value="Payable">Payable</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
        {(!isEdit || !proofImageUrl) && (
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">
              Receipt / Proof of Transaction {!isEdit && " *"}
            </label>
            <div className={`border-2 border-dashed ${receiptError ? 'border-red-500 bg-red-50/10' : 'border-border'} rounded-xl p-6 text-center hover:bg-muted transition-colors relative overflow-hidden`}>
              <Input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  setReceiptFile(file);
                  if (file) {
                    if (setReceiptError) setReceiptError("");
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      if (setProofImageUrl && evt.target?.result) {
                        setProofImageUrl(evt.target.result as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <div className="flex flex-col items-center pointer-events-none">
                <Upload className={`w-8 h-8 ${receiptError ? 'text-red-400' : 'text-muted-foreground'} mb-2`} />
                <span className={`text-sm font-medium ${receiptError ? 'text-red-500' : 'text-foreground'}`}>
                  {receiptFile ? receiptFile.name : "Upload Order Receipt or Purchase Order"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF (max 5MB)</span>
              </div>
            </div>
            {receiptError && <p className="mt-1.5 text-xs text-red-500">{receiptError}</p>}
          </div>
        )}
        {proofImageUrl && (
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Receipt / Proof of Transaction</label>
            <div className="p-3 bg-muted rounded-xl border border-border">
              {proofImageUrl.toLowerCase().endsWith('.pdf') ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <ClipboardCheck size={18} />
                    <a href={getImageUrl(proofImageUrl)} target="_blank" rel="noreferrer" className="hover:underline">
                      View Uploaded PDF Receipt
                    </a>
                  </div>
                  {isEdit && (
                    <Button
                      type="button"
                      onClick={() => setProofImageUrl && setProofImageUrl("")}
                      className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-muted border border-border rounded-lg transition-colors"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-muted-foreground">Current uploaded receipt:</p>
                    {isEdit && (
                      <Button
                        type="button"
                        onClick={() => setProofImageUrl && setProofImageUrl("")}
                        className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-muted border border-border rounded-lg transition-colors"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(proofImageUrl)}
                    alt="Receipt Proof"
                    className="max-h-36 rounded-lg object-contain border border-border bg-card"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-6">
        <div className="text-xs text-foreground font-medium animate-pulse">
          {isSaving && uploadStatus}
        </div>
        <div className="flex gap-3">
          <Button onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm font-semibold text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && (
              <Loader2 className="animate-spin h-4 w-4 text-white" />
            )}
            {isSaving ? "Saving..." : (isEdit ? "Save Changes" : "Create Order")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function OrderDetailsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Order Details - {order.id}</h2>
          <div className="mt-2"><StatusBadge status={order.status} /></div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl font-bold leading-none">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
        <div><p className="text-xs text-muted-foreground mb-0.5">Item</p><p className="text-sm font-semibold text-foreground">{order.item}</p></div>
        <div><p className="text-xs text-muted-foreground mb-0.5">Supplier</p><p className="text-sm font-semibold text-foreground">{order.supplier}</p></div>
        <div><p className="text-xs text-muted-foreground mb-0.5">Quantity Ordered</p><p className="text-sm font-semibold text-foreground">{order.quantity}</p></div>
        <div><p className="text-xs text-muted-foreground mb-0.5">Order Date</p><p className="text-sm font-semibold text-foreground">{order.orderDate}</p></div>
        <div><p className="text-xs text-muted-foreground mb-0.5">Expected Arrival</p><p className="text-sm font-semibold text-foreground">{order.eta}</p></div>
        <div><p className="text-xs text-muted-foreground mb-0.5">Payment Type</p><p className="text-sm font-semibold text-foreground">{order.payment}</p></div>
      </div>
      {order.status === "Completed" && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>
              <span className="text-sm font-bold text-green-700">
                Order Completed - QA Approved
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div><p className="text-xs text-muted-foreground">Arrived</p><p className="text-sm font-semibold text-foreground">{order.arrivalDate}</p></div>
              <div><p className="text-xs text-muted-foreground">QA Inspected</p><p className="text-sm font-semibold text-foreground">{order.qaInspected}</p></div>
              <div><p className="text-xs text-muted-foreground">QA Status</p><p className="text-sm font-semibold text-foreground">{order.qaStatus}</p></div>
              <div><p className="text-xs text-muted-foreground">Inspected By</p><p className="text-sm font-semibold text-foreground">{order.inspectedBy}</p></div>
            </div>
          </div>
          <div className="border border-border rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-foreground mb-3">Quantity Verification</p>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-muted-foreground">Ordered</p><p className="text-xl font-bold text-foreground">{order.quantity}</p></div>
              <div><p className="text-xs text-muted-foreground">Received</p><p className="text-xl font-bold text-foreground">{order.received}</p></div>
              <div><p className="text-xs text-muted-foreground">QA Approved</p><p className="text-xl font-bold text-green-600">{order.qaApproved}</p></div>
            </div>
          </div>
          {order.qaNotes && (
            <div className="bg-muted rounded-xl p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-1">QA Inspection Notes:</p>
              <p className="text-sm text-muted-foreground">{order.qaNotes}</p>
            </div>
          )}
          {order.proofImageUrl && (
            <div className="border border-border rounded-xl p-4 mb-4">
              <p className="text-sm font-bold text-foreground mb-3">Inspection Photo / Proof</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001").replace(/\/$/, "")}/api/scms${order.proofImageUrl}`}
                alt="QA Proof"
                className="max-h-48 rounded-lg object-contain border border-border bg-card"
              />
            </div>
          )}
        </>
      )}
      <div className="flex justify-end mt-6">
        <Button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">Close</Button>
      </div>
    </Modal>
  );
}
function QAInspectionPage({
  order,
  onClose,
  onComplete
}: {
  order: Order;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [checklist, setChecklist] = useState({
    quantityMatch: false,
    goodCondition: false,
    specsMatch: false,
    docsCorrect: false
  });
  const [comment, setComment] = useState("");
  const [inspectedBy, setInspectedBy] = useState("");
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [commentError, setCommentError] = useState("");
  const [inspectedByError, setInspectedByError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isAllChecked = checklist.quantityMatch && checklist.goodCondition && checklist.specsMatch && checklist.docsCorrect;
  const result = isAllChecked ? "good" : "bad";

  async function handleQAComplete() {
    let hasError = false;
    
    // Notes are optional, just clear any previous error if it somehow existed
    setCommentError("");

    if (!inspectedBy.trim()) {
      setInspectedByError("Inspected by is required.");
      hasError = true;
    } else if (/[!@#$%^&*(),.?":{}|<>\[\]\\/`~=+_]/.test(inspectedBy)) {
      setInspectedByError("no using special character");
      hasError = true;
    } else {
      setInspectedByError("");
    }

    if (!pictureFile) {
      setPhotoError("Inspection photo / proof is required.");
      hasError = true;
    } else {
      setPhotoError("");
    }

    if (hasError) return;
    
    setShowConfirm(true);
  }

  async function performQAInspectionSubmit() {
    setIsSaving(true);
    try {
      const targetStatus = result === "good" ? "Completed" : "Rejected";

      // 1. Update status to Completed or Rejected and send QA details
      const res = await api.put(`/api/scms/api/PurchaseOrders/${order.poId}/status`, {
        status: targetStatus,
        qaNotes: comment,
        qaStatus: result === "good" ? "Passed" : "Failed",
        inspectedBy: inspectedBy
      });

      if (res.data.success) {
        // 2. If a photo/picture file is selected, upload it as proof (works for both pass and fail)
        if (pictureFile) {
          const formData = new FormData();
          formData.append("file", pictureFile);
          await api.post(`/api/scms/api/PurchaseOrders/${order.poId}/upload-receipt`, formData);
        }
        onComplete();
      }
    } catch (error) {
      console.error("Error completing QA inspection", error);
      alert("Failed to complete QA inspection. Please try again.");
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 bg-card rounded-2xl shadow-sm border border-border">
      {/* Header with back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <Button
            onClick={onClose}
            className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            ← Back to Orders
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Quality Assurance Inspection</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Order {order.id} &bull; Supplier: {order.supplier}</p>
        </div>
        <div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
            QA Status: Pending Inspection
          </span>
        </div>
      </div>

      {/* Dual column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - Order Summary & Checklist (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Order Details Card */}
          <div className="p-4 bg-muted/50 border border-border rounded-xl">
            <h3 className="text-sm font-bold text-foreground mb-3">Order Details Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Item</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{order.item}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Supplier</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{order.supplier}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ordered Quantity</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{order.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ETA</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{order.eta}</p>
              </div>
            </div>
          </div>

          {/* QA Checklist Card */}
          <div className="p-5 border border-border rounded-xl bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Inspection Checklist</h3>
              <Button
                type="button"
                onClick={() => {
                  const allChecked = !isAllChecked;
                  setChecklist({
                    quantityMatch: allChecked,
                    goodCondition: allChecked,
                    specsMatch: allChecked,
                    docsCorrect: allChecked
                  });
                  setCommentError("");
                  setPhotoError("");
                }}
                className="text-xs font-bold text-foreground hover:underline"
              >
                {isAllChecked ? "Uncheck All" : "Check All"}
              </Button>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: "quantityMatch",
                  label: "Quantity Verification",
                  desc: "Delivered quantity matches the ordered quantity."
                },
                {
                  key: "goodCondition",
                  label: "Condition & Quality",
                  desc: "Materials arrived in good condition with no visible damage or defects."
                },
                {
                  key: "specsMatch",
                  label: "Specification Match",
                  desc: "Item name and specifications match the purchase order."
                },
                {
                  key: "docsCorrect",
                  label: "Documentation Check",
                  desc: "Delivery receipts and invoices are present and correct."
                }
              ].map(item => {
                const isChecked = checklist[item.key as keyof typeof checklist];
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      setChecklist(prev => ({ ...prev, [item.key]: !isChecked }));
                      setCommentError("");
                      setPhotoError("");
                    }}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isChecked
                        ? "border-green-500 bg-green-50/5"
                        : "border-border bg-card hover:border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border-2 mt-0.5 transition-colors ${
                        isChecked
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border bg-transparent"
                      }`}
                    >
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold transition-colors ${isChecked ? "text-green-800" : "text-foreground"}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column - Decision and rejection inputs (5 cols) */}
        <div className="lg:col-span-5">
          <div className="p-5 border border-border rounded-xl bg-card space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4 flex-1">
              <h3 className="text-sm font-bold text-foreground">Inspection Result</h3>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                {result === "good" ? (
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-bold">
                    ✓ Passed
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">
                    ⚠ Failed (Rejected)
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">
                    Inspected By <span className="text-muted-foreground">*</span></label>
                  <Input
                    type="text"
                    className={`w-full px-3 py-2.5 text-sm rounded-lg border ${
                      inspectedByError ? "border-red-500 focus:ring-red-500" : "border-border"
                    } bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring`}
                    placeholder="Enter name of inspector"
                    value={inspectedBy}
                    onChange={e => {
                      const val = e.target.value;
                      setInspectedBy(val);
                      if (!val.trim()) {
                        setInspectedByError("Inspected by is required.");
                      } else if (/[!@#$%^&*(),.?":{}|<>\[\]\\/`~=+_]/.test(val)) {
                        setInspectedByError("no using special character");
                      } else {
                        setInspectedByError("");
                      }
                    }}
                  />
                  {inspectedByError && <p className="mt-1 text-xs text-red-500 font-medium">⚠ {inspectedByError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">
                    Inspection Notes / Comments
                  </label>
                  <textarea
                    className={`w-full px-3 py-2.5 text-sm rounded-lg border ${
                      commentError ? "border-red-500 focus:ring-red-500" : "border-border"
                    } bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none`}
                    rows={4}
                    placeholder="Optional notes about the inspection"
                    value={comment}
                    onChange={e => {
                      setComment(e.target.value);
                      if (e.target.value.trim()) setCommentError("");
                    }}
                  />
                  {commentError && <p className="mt-1 text-xs text-red-500 font-medium">⚠ {commentError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1.5">
                    Inspection Photo / Proof <span className="text-muted-foreground">*</span></label>
                  <div
                    className={`border-2 border-dashed ${
                      photoError ? "border-red-500 bg-red-50/5" : "border-border"
                    } rounded-xl p-6 text-center hover:bg-muted transition-colors relative overflow-hidden`}
                  >
                    <Input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setPictureFile(file);
                        if (file) setPhotoError("");
                      }}
                    />
                    <div className="flex flex-col items-center pointer-events-none">
                      <Upload className={`w-8 h-8  mb-2`} />
                      <span className={`text-sm font-semibold ${photoError ? "text-red-550" : "text-muted-foreground"}`}>
                        {pictureFile ? pictureFile.name : "Upload photo of items / delivery"}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">JPG, PNG (max 5MB)</span>
                    </div>
                  </div>
                  {photoError && <p className="mt-1 text-xs text-red-500 font-medium">⚠ {photoError}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-border mt-6">
              <Button
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 px-5 py-2.5 text-sm font-semibold text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleQAComplete}
                disabled={isSaving}
                className="flex-2 min-w-[160px] px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSaving && (
                  <Loader2 className="animate-spin h-4 w-4 text-white" />
                )}
                {isSaving ? "Saving..." : "Submit QA Inspection"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <Modal onClose={() => setShowConfirm(false)}>
          <div className="text-center p-4">
            {result === "good" ? (
              <>
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-foreground">
                  <CheckCircle size={30} />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">Confirm QA Approval</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Are you sure you want to approve order <b>{order.id}</b> as Passed? This will mark the order as Completed.
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={performQAInspectionSubmit}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {isSaving && (
                      <Loader2 className="animate-spin h-3.5 w-3.5 text-white" />
                    )}
                    Yes, Approve Order
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
                  <XCircle size={30} />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">Confirm Order Rejection</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Are you sure you want to reject order <b>{order.id}</b>? This status update will notify the procurement team.
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={performQAInspectionSubmit}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {isSaving && (
                      <Loader2 className="animate-spin h-3.5 w-3.5 text-white" />
                    )}
                    Yes, Reject Order
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// Story II: "Create Procurement Report UI"
// Full-page view (mirrors QAInspectionPage's pattern) with a Back button that
// returns to the normal Orders & Procurement content.
// TODO: currently derives Fulfillment Rate / Lead Time / Inspection Status
// client-side from PurchaseOrders data. Swap to a dedicated Procurement
// Report endpoint (ProcurementReportDto) once James's backend ticket is done,
// and wire in the Global Filter Bar (Story VI) once that's built.
function ProcurementReportsPage({ onClose }: { onClose: () => void }) {
  const [reportRows, setReportRows] = useState<ProcurementReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/scms/api/PurchaseOrders?pageSize=10000`);
      if (response.data.success) {
        const list: PurchaseOrderResponse[] = response.data.data.items || response.data.data || [];

        const rows: ProcurementReportRow[] = list.map((o) => {
          const orderedQty = o.items.reduce((sum, it) => sum + (it.poItemQuantity || 0), 0);
          const receivedQty = o.items.reduce((sum, it) => sum + (it.receivedQuantity || 0), 0);

          const fulfillmentRate = orderedQty > 0 && (o.status === "Completed" || o.status === "Arrived" || o.status === "Rejected")
            ? Math.round((receivedQty / orderedQty) * 1000) / 10
            : null;

          let leadTimeDays: number | null = null;
          if (o.arrivalDate) {
            const orderDate = new Date(o.orderDate);
            const arrivalDate = new Date(o.arrivalDate);
            if (!isNaN(orderDate.getTime()) && !isNaN(arrivalDate.getTime())) {
              leadTimeDays = Math.round((arrivalDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
            }
          }

          const inspectionStatus = o.qaStatus || "Pending";

          return {
            poId: o.poId,
            purchaseOrderId: `PO-${o.poId}`,
            supplier: o.supplierName,
            issueDate: formatDateToMDY(o.orderDate),
            orderedQuantity: orderedQty,
            fulfillmentRate,
            leadTimeDays,
            inspectionStatus,
          };
        });

        setReportRows(rows);
      }
    } catch (error) {
      console.error("Error fetching procurement report data", error);
      setReportRows([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-full">
      <div>
        <Button
          onClick={onClose}
          className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft size={16} /> Back to Orders & Procurement
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Procurement Report</h1>
        <p className="text-xs text-muted-foreground mt-1">Monitor supplier order fulfillment</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PURCHASE ORDER ID</th>
                <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SUPPLIER</th>
                <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ISSUE DATE</th>
                <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ORDERED QUANTITY</th>
                <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">FULFILLMENT RATE</th>
                <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">LEAD TIME</th>
                <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">INSPECTION STATUS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">Loading report data...</td>
                </tr>
              ) : reportRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
                    No Data Found
                  </td>
                </tr>
              ) : (
                reportRows.map((row) => (
                  <tr key={row.poId} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">{row.purchaseOrderId}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{row.supplier}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{row.issueDate}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{row.orderedQuantity}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {row.fulfillmentRate !== null ? `${row.fulfillmentRate}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {row.leadTimeDays !== null ? `${row.leadTimeDays} day${row.leadTimeDays === 1 ? "" : "s"}` : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <InspectionStatusBadge status={row.inspectionStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ViewOrdersProcurement() {
  const auth = useAuth();
  const user = auth?.user;
  const isAuthorizedForReports = user?.username === "scmsuser" || user?.username === "ERP-ADMIN" || user?.email === "scmsuser@r3b2p.com" || user?.email === "admin@r3b2p.com" || user?.roles?.includes("Admin");

  const [orders, setOrders] = useState<Order[]>([]);
  const [itemsList, setItemsList] = useState<ItemResponse[]>([]);
  const [suppliersList, setSuppliersList] = useState<SupplierResponse[]>([]);
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [qaOrder, setQaOrder] = useState<Order | null>(null);
  const [showReports, setShowReports] = useState(false);
  const [activeDropdownPoId, setActiveDropdownPoId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "arrived" | "cancel"; orderId: string; poId: number; message: string } | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [globalStats, setGlobalStats] = useState({ total: 0, pending: 0, arrived: 0, completed: 0 });

  useEffect(() => {
    fetchOrders();
    fetchItemsAndSuppliers();
  }, [page, filter, search]);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  async function fetchGlobalStats() {
    try {
      const response = await api.get(`/api/scms/api/PurchaseOrders?pageSize=10000`);
      if (response.data.success) {
        const allList = response.data.data.items || response.data.data || [];
        setGlobalStats({
          total: allList.length,
          pending: allList.filter((o: any) => o.status === "Pending").length,
          arrived: allList.filter((o: any) => o.status === "Arrived").length,
          completed: allList.filter((o: any) => o.status === "Completed").length,
        });
      }
    } catch (err) {
      console.error("Error fetching global stats", err);
    }
  }

  async function fetchItemsAndSuppliers() {
    try {
      const [itemsRes, suppliersRes] = await Promise.all([
        api.get("/api/scms/api/Items"),
        api.get("/api/scms/api/Suppliers")
      ]);
      if (itemsRes.data.success) {
        const items = itemsRes.data.data.items || itemsRes.data.data || [];
        setItemsList(items.filter((i: any) => 
          !i.categoryName?.toLowerCase().includes("finished good") && 
          !i.category?.toLowerCase().includes("finished good")
        ));
      }
      if (suppliersRes.data.success) setSuppliersList(suppliersRes.data.data.items || suppliersRes.data.data || []);
    } catch (err) {
      console.error("Error fetching items or suppliers", err);
    }
  }

  async function fetchOrders() {
    try {
      const statusFilter = filter === "All" ? "" : filter;
      const response = await api.get(`/api/scms/api/PurchaseOrders?page=${page}&pageSize=10&status=${statusFilter}&search=${search}`);
      if (response.data.success) {
        const ordersList = response.data.data.items || response.data.data || [];
        setTotalPages(response.data.data.totalPages || 1);
        setTotalCount(response.data.data.totalCount || ordersList.length);
        const fetchedOrders: Order[] = ordersList.map((o: PurchaseOrderResponse, idx: number) => ({
          id: ((page - 1) * 10 + idx + 1).toString(),
          poId: o.poId,
          item: o.items.length > 0 ? o.items[0].itemName : "Unknown",
          itemId: o.items.length > 0 ? o.items[0].itemId : 0,
          category: "Raw Materials", // Simplified
          supplier: o.supplierName,
          supplierId: o.supplierId,
          quantity: o.items.length > 0 ? o.items[0].poItemQuantity : 0,
          orderDate: new Date(o.orderDate).toLocaleDateString("en-US"),
          eta: new Date(o.expectedArrivalDate).toLocaleDateString("en-US"),
          status: o.status as OrderStatus,
          payment: o.paymentType as PaymentType,
          arrivalDate: o.arrivalDate ? new Date(o.arrivalDate).toLocaleDateString("en-US") : undefined,
          qaInspected: o.qaInspectedDate ? new Date(o.qaInspectedDate).toLocaleDateString("en-US") : undefined,
          qaStatus: o.qaStatus,
          inspectedBy: o.inspectedBy,
          received: o.items.length > 0 ? o.items[0].receivedQuantity : 0,
          qaApproved: o.qaApprovedQuantity,
          qaNotes: o.qaNotes,
          unit: "unit",
          proofImageUrl: o.proofImageUrl,
        }));
        setOrders(fetchedOrders);
      }
    } catch (err) {
      console.error("Error fetching orders", err);
    }
  }

  // Data is filtered on backend
  const filtered = orders;

  const stats = globalStats;

  function handleSaveNew() {
    fetchOrders(); // Refresh all to get correctly mapped data
    fetchGlobalStats();
  }

  async function handleMarkArrived(id: string, poId: number) {
    try {
      const res = await api.put(`/api/scms/api/PurchaseOrders/${poId}/status`, { status: "Arrived" });
      if (res.data.success) {
        fetchOrders();
        fetchGlobalStats();
      }
    } catch (err) {
      console.error("Error marking arrived", err);
    }
  }

  async function handleCancel(id: string, poId: number) {
    try {
      const res = await api.put(`/api/scms/api/PurchaseOrders/${poId}/status`, { status: "Cancelled" });
      if (res.data.success) {
        fetchOrders();
        fetchGlobalStats();
      }
    } catch (err) {
      console.error("Error cancelling order", err);
    }
  }

  function handleQAComplete() {
    fetchOrders();
    fetchGlobalStats();
    setQaOrder(null);
  }

  if (qaOrder) {
    return (
      <QAInspectionPage
        order={qaOrder}
        onClose={() => setQaOrder(null)}
        onComplete={handleQAComplete}
      />
    );
  }

  if (showReports) {
    return <ProcurementReportsPage onClose={() => setShowReports(false)} />;
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl animate-page-in">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">Orders & Procurement</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage purchase orders for Raw Materials and Tools</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {isAuthorizedForReports && (
            <Link
              href="/reports?tab=procurement"
              className="h-11 px-5 text-sm font-semibold text-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <FileText size={16} />
              Reports
            </Link>
          )}
          <Button
            onClick={() => setShowNew(true)}
            className="h-11 px-5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors whitespace-nowrap"
          >
            New Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Orders", value: stats.total, color: "text-foreground" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600" },
          { label: "Arrived (QA Pending)", value: stats.arrived, color: "text-foreground" },
          { label: "Completed", value: stats.completed, color: "text-green-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="flex items-center justify-between gap-sm px-md py-sm border-b border-border bg-muted/20">
          <div className="flex items-center gap-sm flex-1">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input 
              type="text"
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-8 p-0 text-body-sm flex-1" 
              placeholder="Search by Order No., Item, or Supplier..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
            />
          </div>
          <div className="flex items-center gap-sm shrink-0">
            <Select value={filter} onValueChange={(val) => { setFilter(val as any); setPage(1); }}>
              <SelectTrigger className="w-[150px] h-8 text-body-sm bg-transparent border-input">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {(["All", "Pending", "Arrived", "Completed", "Cancelled", "Rejected"] as const).map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-2 py-2 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ORDER NO.</th>
                <th className="px-2 py-2 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ITEM</th>
                <th className="px-2 py-2 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">SUPPLIER</th>
                <th className="px-2 py-2 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">QUANTITY</th>
                <th className="px-2 py-2 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ORDER DATE</th>
                <th className="px-2 py-2 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ETA</th>
                <th className="px-2 py-2 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
                <th className="px-2 py-2 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
                    No Results Found
                  </td>
                </tr>
              ) : (
                filtered.map((order, idx) => (
                <tr key={order.id} className={`${idx < filtered.length - 1 ? "border-b border-border" : ""} hover:bg-muted/50 transition-colors`}>
                  <td className="px-2 py-2.5 font-bold text-foreground whitespace-nowrap">{order.id}</td>
                  <td className="px-2 py-2.5 font-medium text-foreground whitespace-nowrap">{order.item}</td>
                  <td className="px-2 py-2.5 text-muted-foreground whitespace-nowrap">{order.supplier}</td>
                  <td className="px-2 py-2.5 text-muted-foreground whitespace-nowrap">{order.quantity}</td>
                  <td className="px-2 py-2.5 text-muted-foreground whitespace-nowrap">{order.orderDate}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    <span className={order.status === "Completed" || order.status === "Arrived" ? "text-green-600 font-medium" : "text-muted-foreground"}>
                      {(order.status === "Completed" || order.status === "Arrived") && "✓ "}{order.eta}
                    </span>
                  </td>
                  <td className="px-2 py-2.5"><StatusBadge status={order.status} /></td>
                  <td className="px-2 py-2.5 text-center relative">
                    <div className="relative inline-block text-center">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeDropdownPoId === order.poId) {
                            setActiveDropdownPoId(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const leftPos = rect.right - 176 + window.scrollX;
                            setDropdownPosition({
                              top: rect.bottom + window.scrollY,
                              left: Math.max(8, leftPos)
                            });
                            setActiveDropdownPoId(order.poId);
                          }
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
                      >
                        <MoreHorizontal size={18} />
                      </Button>

                      {activeDropdownPoId === order.poId && dropdownPosition && createPortal(
                        <>
                          <div
                            className="fixed inset-0 z-[199] cursor-default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownPoId(null);
                            }}
                          />
                          <div
                            style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
                            className="absolute w-44 rounded-xl border border-border bg-card shadow-xl z-[200] py-1.5 focus:outline-none text-left"
                          >
                            {order.status === "Arrived" && (
                              <Button
                                onClick={() => {
                                  setQaOrder(order);
                                  setActiveDropdownPoId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                              >
                                <ClipboardCheck size={14} className="text-muted-foreground" />
                                QA Inspection
                              </Button>
                            )}
                            {order.status === "Pending" && (
                              <>
                                <Button
                                  onClick={() => {
                                    setEditOrder(order);
                                    setActiveDropdownPoId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                                >
                                  <Pencil size={14} className="text-foreground" />
                                  Edit Order
                                </Button>
                                <Button
                                  onClick={() => {
                                    setConfirmAction({
                                      type: "arrived",
                                      orderId: order.id,
                                      poId: order.poId,
                                      message: `Are you sure you want to mark order ${order.id} as Arrived?`
                                    });
                                    setActiveDropdownPoId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                                >
                                  <Truck size={14} className="text-muted-foreground" />
                                  Mark Arrived
                                </Button>
                                <Button
                                  onClick={() => {
                                    setConfirmAction({
                                      type: "cancel",
                                      orderId: order.id,
                                      poId: order.poId,
                                      message: `Are you sure you want to cancel order ${order.id}?`
                                    });
                                    setActiveDropdownPoId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-muted transition-colors"
                                >
                                  <XCircle size={14} />
                                  Cancel Order
                                </Button>
                              </>
                            )}
                            {(order.status === "Completed" || order.status === "Cancelled" || order.status === "Rejected") && (
                              <Button
                                onClick={() => {
                                  setViewOrder(order);
                                  setActiveDropdownPoId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                              >
                                <Eye size={14} className="text-foreground" />
                                View Details
                              </Button>
                            )}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
        />
      </div>

      {showNew && <NewOrderModal onClose={() => setShowNew(false)} onSave={handleSaveNew} itemsList={itemsList} suppliersList={suppliersList} />}
      {editOrder && (
        <EditOrderModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSave={() => {
            setEditOrder(null);
            fetchOrders();
            fetchGlobalStats();
          }}
          itemsList={itemsList}
          suppliersList={suppliersList}
        />
      )}
      {viewOrder && <OrderDetailsModal order={viewOrder} onClose={() => setViewOrder(null)} />}
      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          onConfirm={() => {
            if (confirmAction.type === "arrived") {
              handleMarkArrived(confirmAction.orderId, confirmAction.poId);
            } else {
              handleCancel(confirmAction.orderId, confirmAction.poId);
            }
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}