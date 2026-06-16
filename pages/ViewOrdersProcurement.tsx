"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../lib/api";
import { MoreHorizontal, ClipboardCheck, Pencil, Truck, XCircle, Eye, History } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";

type OrderStatus = "Pending" | "Arrived" | "Completed" | "Cancelled";
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
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    Arrived: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    Completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${styles[status]}`}>
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
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 overflow-y-auto bg-black/50" onClick={onClose}>
      <div className="relative w-full max-w-lg my-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[calc(100vh-4rem)]" onClick={e => e.stopPropagation()}>
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
    
    if (!eta) {
      setEtaError("Expected Arrival (ETA) is required.");
      hasError = true;
    } else {
      setEtaError("");
    }

    if (hasError) return;
    
    setIsSaving(true);
    setUploadStatus("Creating order...");
    try {
      const response = await api.post("/api/scms/api/PurchaseOrders", {
        supplierId: Number(supplierId),
        expectedArrivalDate: new Date(eta).toISOString(),
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
          await api.post(`/api/scms/api/PurchaseOrders/${poId}/upload-receipt`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
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
    />
  );
}

function EditOrderModal({ order, onClose, onSave, itemsList, suppliersList }: { order: Order; onClose: () => void; onSave: () => void; itemsList: ItemResponse[]; suppliersList: SupplierResponse[]; }) {
  const [supplierId, setSupplierId] = useState(order.supplierId?.toString() || "");
  const [itemId, setItemId] = useState(order.itemId?.toString() || "");
  const [quantity, setQuantity] = useState(order.quantity?.toString() || "");
  const [eta, setEta] = useState(new Date(order.eta).toISOString().split('T')[0] || "");
  const [payment, setPayment] = useState<PaymentType>(order.payment || "Payable");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  async function handleSave() {
    setIsSaving(true);
    try {
      onSave();
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
      itemId={itemId}
      setItemId={setItemId}
      quantity={quantity}
      setQuantity={setQuantity}
      eta={eta}
      setEta={setEta}
      payment={payment}
      setPayment={setPayment}
      receiptFile={receiptFile}
      setReceiptFile={setReceiptFile}
      onClose={onClose}
      handleSave={handleSave}
      itemsList={itemsList}
      suppliersList={suppliersList}
      isEdit={true}
      proofImageUrl={order.proofImageUrl}
      isSaving={isSaving}
      uploadStatus={uploadStatus}
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
  isSaving,
  uploadStatus,
  supplierError,
  setSupplierError,
  itemError,
  setItemError,
  quantityError,
  setQuantityError,
  etaError,
  setEtaError
}: NewOrderModalContentProps) {
  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E", "."].includes(e.key)) {
      e.preventDefault();
    }
  };
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{isEdit ? "Edit Order" : "Create New Order"}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Purchase Raw Materials, Tools, or Supplies</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Supplier *</label>
          <select 
            disabled={isEdit} 
            className={`w-full px-3 py-2.5 text-sm rounded-lg border ${supplierError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`} 
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Item *</label>
          <select 
            disabled={isEdit} 
            className={`w-full px-3 py-2.5 text-sm rounded-lg border ${itemError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`} 
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
            {itemsList.map(i => <option key={i.itemId} value={i.itemId}>{i.itemName} ({i.category}) - {i.unitOfMeasure}</option>)}
          </select>
          {itemError && <p className="mt-1 text-xs text-red-500">{itemError}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Quantity *</label>
            <input 
              disabled={isEdit} 
              type="number" 
              className={`w-full px-3 py-2.5 text-sm rounded-lg border ${quantityError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`} 
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expected Arrival (ETA) *</label>
            <input 
              disabled={isEdit} 
              type="date" 
              className={`w-full px-3 py-2.5 text-sm rounded-lg border ${etaError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`} 
              placeholder="MM/DD/YYYY" 
              value={eta} 
              onChange={e => {
                const val = e.target.value;
                setEta(val);
                if (setEtaError) {
                  if (!val) setEtaError("Expected Arrival (ETA) is required.");
                  else setEtaError("");
                }
              }} 
            />
            {etaError && <p className="mt-1 text-xs text-red-500">{etaError}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Payment Type *</label>
          <select disabled={isEdit} className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" value={payment} onChange={e => setPayment(e.target.value as PaymentType)}>
            <option value="Payable">Payable</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
        {!isEdit && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Receipt / Proof of Transaction *</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative overflow-hidden">
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
              <div className="flex flex-col items-center pointer-events-none">
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {receiptFile ? receiptFile.name : "Upload Order Receipt or Purchase Order"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG, PDF (max 5MB)</span>
              </div>
            </div>
          </div>
        )}
        {isEdit && proofImageUrl && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Receipt / Proof of Transaction</label>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {proofImageUrl.toLowerCase().endsWith('.pdf') ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <ClipboardCheck size={18} />
                  <a href={`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001").replace(/\/$/, "")}/api/scms${proofImageUrl}`} target="_blank" rel="noreferrer" className="hover:underline">
                    View Uploaded PDF Receipt
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Current uploaded receipt:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001").replace(/\/$/, "")}/api/scms${proofImageUrl}`} 
                    alt="Receipt Proof" 
                    className="max-h-36 rounded-lg object-contain border border-gray-200 dark:border-gray-700 bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-6">
        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium animate-pulse">
          {isSaving && uploadStatus}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isSaving ? "Saving..." : (isEdit ? "Save Changes" : "Create Order")}
          </button>
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Details - {order.id}</h2>
          <div className="mt-2"><StatusBadge status={order.status} /></div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold leading-none">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
        <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Item</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.item}</p></div>
        <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Supplier</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.supplier}</p></div>
        <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Quantity Ordered</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.quantity}</p></div>
        <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Order Date</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.orderDate}</p></div>
        <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Expected Arrival</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.eta}</p></div>
        <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Payment Type</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.payment}</p></div>
      </div>
      {order.status === "Completed" && (
        <>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600 dark:bg-green-400"></span>
              <span className="text-sm font-bold text-green-700 dark:text-green-400">
                Order Completed - QA Approved
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Arrived</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.arrivalDate}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">QA Inspected</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.qaInspected}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">QA Status</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.qaStatus}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Inspected By</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.inspectedBy}</p></div>
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Quantity Verification</p>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Ordered</p><p className="text-xl font-bold text-gray-900 dark:text-white">{order.quantity}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Received</p><p className="text-xl font-bold text-gray-900 dark:text-white">{order.received}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">QA Approved</p><p className="text-xl font-bold text-green-600 dark:text-green-400">{order.qaApproved}</p></div>
            </div>
          </div>
          {order.qaNotes && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">QA Inspection Notes:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{order.qaNotes}</p>
            </div>
          )}
        </>
      )}
      <div className="flex justify-end mt-6">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Close</button>
      </div>
    </Modal>
  );
}

function QAModal({ order, onClose, onComplete }: { order: Order; onClose: () => void; onComplete: (o: Order) => void }) {
  const [actualGood, setActualGood] = useState("");
  const [damaged, setDamaged] = useState("0");
  const [qaStatus, setQaStatus] = useState("");
  const [condition, setCondition] = useState("");
  const [inspector, setInspector] = useState("");
  const [discrepancyNotes, setDiscrepancyNotes] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");

  const shortage = actualGood && damaged ? order.quantity - Number(actualGood) - Number(damaged) : null;

  async function handleComplete() {
    if (!actualGood || !qaStatus || !condition || !inspector) return;
    
    try {
      const response = await api.post(`/api/scms/api/PurchaseOrders/${order.poId}/qa`, {
        actualGoodQuantity: Number(actualGood),
        qaStatus: qaStatus,
        conditionAssessment: condition,
        inspectorName: inspector,
        discrepancyNotes: discrepancyNotes,
        generalNotes: generalNotes
      });
      if (response.data.success) {
        onComplete(response.data.data);
      }
      onClose();
    } catch (error) {
      console.error("Error completing QA", error);
      alert("Failed to complete QA");
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quality Assurance Inspection</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Order {order.id} - {order.item}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold leading-none">✕</button>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-5">
        <p className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-1">
          QA Inspection Required
        </p>
        <p className="text-xs text-yellow-700 dark:text-yellow-500">Verify that the received materials match the order specifications and are in good condition.</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div><p className="text-xs text-gray-500 dark:text-gray-400">Item</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.item}</p></div>
        <div><p className="text-xs text-gray-500 dark:text-gray-400">Supplier</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.supplier}</p></div>
        <div><p className="text-xs text-gray-500 dark:text-gray-400">Ordered Quantity</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.quantity}</p></div>
        <div><p className="text-xs text-gray-500 dark:text-gray-400">Initially Received</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.quantity}</p></div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-5">
        <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-0.5">
          Quantity Verification
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-500">During inspection, verify the actual usable quantity. Exclude damaged, items.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Actual Good Quantity * <span className="text-red-500">(Required)</span></label>
            <input type="number" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="100" value={actualGood} onChange={e => setActualGood(e.target.value)} />
            <p className="text-xs text-gray-400 mt-0.5">Items in good condition</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Damaged/Missing</label>
            <input type="number" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={damaged} onChange={e => setDamaged(e.target.value)} />
            <p className="text-xs text-gray-400 mt-0.5">Items not usable</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Shortage/Excess</label>
            <input className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400" readOnly value={shortage !== null ? (shortage > 0 ? `-${shortage}` : shortage < 0 ? `+${Math.abs(shortage)}` : "0") : "Auto-calculated"} />
            <p className="text-xs text-gray-400 mt-0.5">Difference from order</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">QA Status * <span className="text-red-500">(Required)</span></label>
          <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={qaStatus} onChange={e => setQaStatus(e.target.value)}>
            <option value="">Select QA status...</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Partial">Partial</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Condition Assessment * <span className="text-red-500">(Required)</span></label>
          <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={condition} onChange={e => setCondition(e.target.value)}>
            <option value="">Select condition...</option>
            <option value="Passed - Good">Passed - Good</option>
            <option value="Passed - Acceptable">Passed - Acceptable</option>
            <option value="Failed - Poor Quality">Failed - Poor Quality</option>
            <option value="Failed - Damaged">Failed - Damaged</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">QA Inspector Name * <span className="text-red-500">(Required)</span></label>
          <input type="text" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter name of the person conducting inspection" value={inspector} onChange={e => setInspector(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Quantity Discrepancy Notes (if applicable)</label>
          <textarea className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} placeholder="Explain any shortage, damaged items. E.g., '5 units damaged during transport, packaging was wet'" value={discrepancyNotes} onChange={e => setDiscrepancyNotes(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">General QA Notes & Observations *</label>
          <textarea className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} placeholder="Describe overall condition: materials quality, packaging integrity, expiration dates, storage condition on arrival, visual inspection results, smell/appearance check, etc." value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} />
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <p className="text-xs font-bold text-orange-800 dark:text-orange-400 mb-2">
            Important Guidelines:
          </p>
          <ul className="text-xs text-orange-700 dark:text-orange-500 space-y-1 list-disc list-inside">
            <li>Only orders that pass QA with &quot;Good&quot; or acceptable &quot;Partial&quot; condition can be marked as Completed</li>
            <li>If actual quantity is less than ordered, note the shortage and reason in discrepancy notes</li>
            <li>Failed inspections will require follow-up with the supplier for replacement/refund</li>
            <li>Document all findings thoroughly for traceability and future supplier evaluation</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
        <button
          onClick={handleComplete}
          className="min-w-[220px] px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
        >
          Complete QA & Mark as Completed
        </button>
      </div>
    </Modal>
  );
}

export default function ViewOrdersProcurement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemsList, setItemsList] = useState<ItemResponse[]>([]);
  const [suppliersList, setSuppliersList] = useState<SupplierResponse[]>([]);
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [qaOrder, setQaOrder] = useState<Order | null>(null);
  const [activeDropdownPoId, setActiveDropdownPoId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "arrived" | "cancel"; orderId: string; poId: number; message: string } | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchItemsAndSuppliers();
  }, []);

  async function fetchItemsAndSuppliers() {
    try {
      const [itemsRes, suppliersRes] = await Promise.all([
        api.get("/api/scms/api/Items"),
        api.get("/api/scms/api/Suppliers")
      ]);
      if (itemsRes.data.success) setItemsList(itemsRes.data.data);
      if (suppliersRes.data.success) setSuppliersList(suppliersRes.data.data);
    } catch (err) {
      console.error("Error fetching items or suppliers", err);
    }
  }

  async function fetchOrders() {
    try {
      const response = await api.get("/api/scms/api/PurchaseOrders");
      if (response.data.success) {
        const fetchedOrders: Order[] = response.data.data.map((o: PurchaseOrderResponse) => ({
          id: `ORD-${o.poId.toString().padStart(3, '0')}`,
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

  const filtered = orders.filter(o =>
    (filter === "All" || o.status === filter) &&
    (o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.item.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "Pending").length,
    arrived: orders.filter(o => o.status === "Arrived").length,
    completed: orders.filter(o => o.status === "Completed").length,
  };

  function handleSaveNew() {
    fetchOrders(); // Refresh all to get correctly mapped data
  }

  async function handleMarkArrived(id: string, poId: number) {
    try {
      const res = await api.put(`/api/scms/api/PurchaseOrders/${poId}/status`, { status: "Arrived" });
      if (res.data.success) {
        fetchOrders();
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
      }
    } catch (err) {
      console.error("Error cancelling order", err);
    }
  }

  function handleQAComplete() {
    fetchOrders();
  }

  return (
    <div className="p-4 space-y-4 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders & Procurement</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage purchase orders for Raw Materials and Tools</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            className="h-11 px-5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap flex items-center gap-2"
          >
            <History size={16} />
            Transaction History
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="h-11 px-5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap"
          >
            New Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Orders", value: stats.total, color: "text-gray-900 dark:text-white" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600 dark:text-yellow-400" },
          { label: "Arrived (QA Pending)", value: stats.arrived, color: "text-blue-600 dark:text-blue-400" },
          { label: "Completed", value: stats.completed, color: "text-green-600 dark:text-green-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(["All", "Pending", "Arrived", "Completed", "Cancelled"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-0">
            <input className="w-full px-4 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search by Order No., Item, or Supplier..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ORDER NO.</th>
                <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ITEM</th>
                <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">SUPPLIER</th>
                <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">QUANTITY</th>
                <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ORDER DATE</th>
                <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ETA</th>
                <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">STATUS</th>
                <th className="px-2 py-2 text-center font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, idx) => (
                <tr key={order.id} className={`${idx < filtered.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}>
                  <td className="px-2 py-2.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">{order.id}</td>
                  <td className="px-2 py-2.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{order.item}</td>
                  <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{order.supplier}</td>
                  <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{order.quantity}</td>
                  <td className="px-2 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{order.orderDate}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    <span className={order.status === "Completed" || order.status === "Arrived" ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-600 dark:text-gray-400"}>
                      {(order.status === "Completed" || order.status === "Arrived") && "✓ "}{order.eta}
                    </span>
                  </td>
                  <td className="px-2 py-2.5"><StatusBadge status={order.status} /></td>
                   <td className="px-2 py-2.5 text-center relative">
                    <div className="relative inline-block text-center">
                      <button
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
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      
                      {activeDropdownPoId === order.poId && dropdownPosition && createPortal(
                        <>
                          <div 
                            className="fixed inset-0 z-[9998] cursor-default" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownPoId(null);
                            }}
                          />
                          <div 
                            style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
                            className="absolute w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-[9999] py-1.5 focus:outline-none text-left"
                          >
                            {order.status === "Arrived" && (
                              <button
                                onClick={() => {
                                  setQaOrder(order);
                                  setActiveDropdownPoId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <ClipboardCheck size={14} className="text-purple-600 dark:text-purple-400" />
                                QA Inspection
                              </button>
                            )}
                            {order.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditOrder(order);
                                    setActiveDropdownPoId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Pencil size={14} className="text-blue-600 dark:text-blue-400" />
                                  Edit Order
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmAction({
                                      type: "arrived",
                                      orderId: order.id,
                                      poId: order.poId,
                                      message: `Are you sure you want to mark order ${order.id} as Arrived?`
                                    });
                                    setActiveDropdownPoId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Truck size={14} className="text-green-600 dark:text-green-400" />
                                  Mark Arrived
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmAction({
                                      type: "cancel",
                                      orderId: order.id,
                                      poId: order.poId,
                                      message: `Are you sure you want to cancel order ${order.id}?`
                                    });
                                    setActiveDropdownPoId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                >
                                  <XCircle size={14} />
                                  Cancel Order
                                </button>
                              </>
                            )}
                            {(order.status === "Completed" || order.status === "Cancelled") && (
                              <button
                                onClick={() => {
                                  setViewOrder(order);
                                  setActiveDropdownPoId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Eye size={14} className="text-blue-600 dark:text-blue-400" />
                                View Details
                              </button>
                            )}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && <NewOrderModal onClose={() => setShowNew(false)} onSave={handleSaveNew} itemsList={itemsList} suppliersList={suppliersList} />}
      {editOrder && <EditOrderModal order={editOrder} onClose={() => setEditOrder(null)} onSave={() => fetchOrders()} itemsList={itemsList} suppliersList={suppliersList} />}
      {viewOrder && <OrderDetailsModal order={viewOrder} onClose={() => setViewOrder(null)} />}
      {qaOrder && <QAModal order={qaOrder} onClose={() => setQaOrder(null)} onComplete={handleQAComplete} />}
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