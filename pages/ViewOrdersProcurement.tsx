"use client";

import { useState } from "react";

type OrderStatus = "Pending" | "Arrived" | "Completed" | "Cancelled";
type PaymentType = "Payable" | "Paid";

type Order = {
  id: string;
  item: string;
  category: "Raw Materials" | "Tools";
  supplier: string;
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
};

interface NewOrderModalContentProps {
  supplier: string;
  setSupplier: (value: string) => void;
  itemName: string;
  setItemName: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  eta: string;
  setEta: (value: string) => void;
  payment: PaymentType;
  setPayment: (value: PaymentType) => void;
  onClose: () => void;
  handleSave: () => void;
}

const SUPPLIERS = ["Baguio Ube Traders", "Laguna Sugar Mills", "Quezon Dairy Supply", "Manila Fresh Produce"];
const ITEMS = [
  { name: "Ube (Purple Yam)", category: "Raw Materials", unit: "kg" },
  { name: "White Sugar", category: "Raw Materials", unit: "kg" },
  { name: "Condensed Milk", category: "Raw Materials", unit: "liters" },
  { name: "Brown Sugar", category: "Raw Materials", unit: "kg" },
  { name: "Butter (Unsalted)", category: "Raw Materials", unit: "kg" },
  { name: "Wooden Spatula", category: "Tools", unit: "pcs" },
];

const INITIAL_ORDERS: Order[] = [
  { id: "ORD-001", item: "Ube (Purple Yam)", category: "Raw Materials", supplier: "Baguio Ube Traders", quantity: 100, orderDate: "4/10/2026", eta: "4/14/2026", status: "Arrived", payment: "Payable", unit: "kg", arrivalDate: "4/13/2026", qaInspected: "4/13/2026", qaStatus: "Passed - Good", inspectedBy: "Maria Garcia", received: 100, qaApproved: 100, qaNotes: "All items in excellent condition. Packaging intact. No damages found. Quality meets specifications." },
  { id: "ORD-002", item: "White Sugar", category: "Raw Materials", supplier: "Laguna Sugar Mills", quantity: 50, orderDate: "4/12/2026", eta: "4/18/2026", status: "Pending", payment: "Payable", unit: "kg" },
  { id: "ORD-003", item: "Condensed Milk", category: "Raw Materials", supplier: "Quezon Dairy Supply", quantity: 30, orderDate: "4/13/2026", eta: "4/16/2026", status: "Pending", payment: "Payable", unit: "liters" },
  { id: "ORD-004", item: "Wooden Spatula", category: "Tools", supplier: "Manila Fresh Produce", quantity: 20, orderDate: "4/8/2026", eta: "4/13/2026", status: "Completed", payment: "Paid", unit: "pcs", arrivalDate: "4/13/2026", qaInspected: "4/13/2026", qaStatus: "Passed - Good", inspectedBy: "Maria Garcia", received: 20, qaApproved: 20, qaNotes: "All items in excellent condition. Packaging intact. No damages found. Quality meets specifications." },
  { id: "ORD-005", item: "Butter (Unsalted)", category: "Raw Materials", supplier: "Quezon Dairy Supply", quantity: 15, orderDate: "4/5/2026", eta: "4/10/2026", status: "Completed", payment: "Paid", unit: "kg", arrivalDate: "4/10/2026", qaInspected: "4/10/2026", qaStatus: "Passed - Good", inspectedBy: "Maria Garcia", received: 15, qaApproved: 15, qaNotes: "Good quality." },
  { id: "ORD-006", item: "Brown Sugar", category: "Raw Materials", supplier: "Laguna Sugar Mills", quantity: 50, orderDate: "4/1/2026", eta: "4/7/2026", status: "Completed", payment: "Paid", unit: "kg", arrivalDate: "4/7/2026", qaInspected: "4/7/2026", qaStatus: "Passed - Good", inspectedBy: "Maria Garcia", received: 50, qaApproved: 50, qaNotes: "Good quality." },
];

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

function CategoryBadge({ cat }: { cat: string }) {
  return (
    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 whitespace-nowrap">
      {cat}
    </span>
  );
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
      {/* Zoomed out slightly to max-w-lg (480px -> 512px) to prevent cutoffs */}
      <div className="relative w-full max-w-lg my-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[calc(100vh-4rem)]" onClick={e => e.stopPropagation()}>
        <div className="overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

function NewOrderModal({ onClose, onSave }: { onClose: () => void; onSave: (o: Order) => void }) {
  const [supplier, setSupplier] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [eta, setEta] = useState("");
  const [payment, setPayment] = useState<PaymentType>("Payable");

  const selectedItem = ITEMS.find(i => i.name === itemName);

  function handleSave() {
    if (!supplier || !itemName || !quantity || !eta) return;
    const newOrder: Order = {
      id: `ORD-${String(Date.now()).slice(-3)}`,
      item: itemName,
      category: selectedItem?.category as "Raw Materials" | "Tools" ?? "Raw Materials",
      supplier,
      quantity: Number(quantity),
      orderDate: new Date().toLocaleDateString("en-US"),
      eta,
      status: "Pending",
      payment,
      unit: selectedItem?.unit ?? "pcs",
    };
    onSave(newOrder);
    onClose();
  }

  return (
    <NewOrderModalContent
      supplier={supplier}
      setSupplier={setSupplier}
      itemName={itemName}
      setItemName={setItemName}
      quantity={quantity}
      setQuantity={setQuantity}
      eta={eta}
      setEta={setEta}
      payment={payment}
      setPayment={setPayment}
      onClose={onClose}
      handleSave={handleSave}
    />
  );
}

function NewOrderModalContent({
  supplier,
  setSupplier,
  itemName,
  setItemName,
  quantity,
  setQuantity,
  eta,
  setEta,
  payment,
  setPayment,
  onClose,
  handleSave,
}: NewOrderModalContentProps) {
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">New Order</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a new purchase order</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Supplier *</label>
          <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={supplier} onChange={e => setSupplier(e.target.value)}>
            <option value="">Select supplier...</option>
            {SUPPLIERS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Item *</label>
          <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={itemName} onChange={e => setItemName(e.target.value)}>
            <option value="">Select item...</option>
            {ITEMS.map(i => <option key={i.name}>{i.name} ({i.category}) - {i.unit}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Quantity *</label>
            <input type="number" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 100" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expected Arrival (ETA) *</label>
            <input type="text" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="MM/DD/YYYY" value={eta} onChange={e => setEta(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Payment Type *</label>
          <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={payment} onChange={e => setPayment(e.target.value as PaymentType)}>
            <option value="Payable">Payable</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Receipt / Proof of Transaction *</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Upload File
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Order Receipt or Purchase Order</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (max 5MB)</p>
            <p className="text-xs text-blue-500 mt-2">Official Receipt, Invoice, or Purchase Order Screenshot</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
        <button onClick={handleSave} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Create Order</button>
      </div>
    </Modal>
  );
}

function EditOrderModal({ order, onClose, onSave }: { order: Order; onClose: () => void; onSave: (o: Order) => void }) {
  const [supplier, setSupplier] = useState(order.supplier);
  const [itemName, setItemName] = useState(order.item);
  const [quantity, setQuantity] = useState(String(order.quantity));
  const [eta, setEta] = useState(order.eta);
  const [payment, setPayment] = useState<PaymentType>(order.payment);
  const [status, setStatus] = useState<OrderStatus>(order.status);

  const selectedItem = ITEMS.find(i => i.name === itemName);

  function handleSave() {
    onSave({ ...order, supplier, item: itemName, category: selectedItem?.category as "Raw Materials" | "Tools" ?? order.category, quantity: Number(quantity), eta, payment, status, unit: selectedItem?.unit ?? order.unit });
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Edit Order - {order.id}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Modify order details while still pending</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Supplier *</label>
          <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={supplier} onChange={e => setSupplier(e.target.value)}>
            {SUPPLIERS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Item *</label>
          <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={itemName} onChange={e => setItemName(e.target.value)}>
            {ITEMS.map(i => <option key={i.name}>{i.name} ({i.category}) - {i.unit}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Quantity *</label>
            <input type="number" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expected Arrival (ETA) *</label>
            <input type="text" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={eta} onChange={e => setEta(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Payment Type *</label>
            <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={payment} onChange={e => setPayment(e.target.value as PaymentType)}>
              <option value="Payable">Payable</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status *</label>
            <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={status} onChange={e => setStatus(e.target.value as OrderStatus)}>
              <option value="Pending">Pending</option>
              <option value="Arrived">Arrived</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Receipt / Proof of Transaction *</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Upload File
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Order Receipt or Purchase Order</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (max 5MB)</p>
            <p className="text-xs text-blue-500 mt-1.5">Official Receipt, Invoice, or Purchase Order Screenshot</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
        <button onClick={handleSave} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Update Order</button>
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
                {"Order Completed - QA Approved"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">{"Arrived"}</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.arrivalDate}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">{"QA Inspected"}</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.qaInspected}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">{"QA Status"}</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.qaStatus}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">{"Inspected By"}</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{order.inspectedBy}</p></div>
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">{"Quantity Verification"}</p>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">{"Ordered"}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{order.quantity}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">{"Received"}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{order.received}</p></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">{"QA Approved"}</p><p className="text-xl font-bold text-green-600 dark:text-green-400">{order.qaApproved}</p></div>
            </div>
          </div>
          {order.qaNotes && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{"QA Inspection Notes:"}</p>
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

  function handleComplete() {
    if (!actualGood || !qaStatus || !condition || !inspector) return;
    onComplete({
      ...order,
      status: "Completed",
      payment: "Paid",
      arrivalDate: new Date().toLocaleDateString("en-US"),
      qaInspected: new Date().toLocaleDateString("en-US"),
      qaStatus: condition,
      inspectedBy: inspector,
      received: Number(actualGood),
      qaApproved: Number(actualGood),
      qaNotes: generalNotes,
    });
    onClose();
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
            <li>{"Only orders that pass QA with \"Good\" or acceptable \"Partial\" condition can be marked as Completed"}</li>
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

function TransactionHistoryModal({ orders, onClose }: { orders: Order[]; onClose: () => void }) {
  const [period, setPeriod] = useState("This Month");
  const [search] = useState("");

  const periods = ["This Day", "This Week", "This Month", "This Year", "Custom Range"];

  const filtered = orders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.item.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: filtered.length,
    pending: filtered.filter(o => o.status === "Pending").length,
    arrived: filtered.filter(o => o.status === "Arrived").length,
    completed: filtered.filter(o => o.status === "Completed").length,
    cancelled: filtered.filter(o => o.status === "Cancelled").length,
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Complete order archive with advanced filtering</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            ← Back to Orders
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            ↓ Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "TOTAL ORDERS", value: stats.total, color: "text-gray-900 dark:text-white" },
          { label: "PENDING", value: stats.pending, color: "text-yellow-600 dark:text-yellow-400" },
          { label: "ARRIVED", value: stats.arrived, color: "text-blue-600 dark:text-blue-400" },
          { label: "COMPLETED", value: stats.completed, color: "text-green-600 dark:text-green-400" },
          { label: "CANCELLED", value: stats.cancelled, color: "text-red-600 dark:text-red-400" },
          { label: "TOTAL VALUE", value: "₱0", color: "text-gray-900 dark:text-white" },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time Period</p>
            <div className="flex flex-wrap gap-2">
              {periods.map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${period === p ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            ▼ More Filters
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Showing <strong>{filtered.length}</strong> orders from the past month</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="w-full">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                {["DATE", "ORDER ID", "ITEM", "CATEGORY", "SUPPLIER", "QUANTITY", "ETA", "ARRIVAL", "STATUS", "PAYMENT"].map(col => (
                  <th key={col} className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No orders found matching your criteria</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Try adjusting your filters or search terms</p>
                  </td>
                </tr>
              ) : filtered.map((o, idx) => (
                <tr key={o.id} className={`${idx < filtered.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""} hover:bg-gray-50 dark:hover:bg-gray-700/50`}>
                  <td className="px-2 py-2.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">{o.orderDate}</td>
                  <td className="px-2 py-2.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">{o.id}</td>
                  <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{o.item}</td>
                  <td className="px-2 py-2.5"><CategoryBadge cat={o.category} /></td>
                  <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{o.supplier}</td>
                  <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{o.quantity}</td>
                  <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{o.eta}</td>
                  <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{o.arrivalDate ?? "—"}</td>
                  <td className="px-2 py-2.5"><StatusBadge status={o.status} /></td>
                  <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{o.payment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ViewOrdersProcurement() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [qaOrder, setQaOrder] = useState<Order | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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

  function handleSaveNew(o: Order) {
    setOrders(prev => [...prev, o]);
  }

  function handleSaveEdit(o: Order) {
    setOrders(prev => prev.map(x => x.id === o.id ? o : x));
  }

  function handleMarkArrived(id: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "Arrived" } : o));
  }

  function handleCancel(id: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "Cancelled" } : o));
  }

  function handleQAComplete(o: Order) {
    setOrders(prev => prev.map(x => x.id === o.id ? o : x));
  }

  return (
    <div className="p-4 space-y-4 max-w-full">
      {showHistory ? (
        <TransactionHistoryModal orders={orders} onClose={() => setShowHistory(false)} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders & Procurement</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage purchase orders for Raw Materials and Tools</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowHistory(true)}
                className="h-11 px-5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                </span>
                <input className="w-full px-4 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search by Order ID, Item, or Supplier..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ORDER ID</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ITEM</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">CATEGORY</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">SUPPLIER</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">QUANTITY</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ORDER DATE</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ETA</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">STATUS</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, idx) => (
                    <tr key={order.id} className={`${idx < filtered.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}>
                      <td className="px-2 py-2.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">{order.id}</td>
                      <td className="px-2 py-2.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{order.item}</td>
                      <td className="px-2 py-2.5"><CategoryBadge cat={order.category} /></td>
                      <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{order.supplier}</td>
                      <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{order.quantity}</td>
                      <td className="px-2 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{order.orderDate}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        <span className={order.status === "Completed" || order.status === "Arrived" ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-600 dark:text-gray-400"}>
                          {(order.status === "Completed" || order.status === "Arrived") && "✓ "}{order.eta}
                        </span>
                      </td>
                      <td className="px-2 py-2.5"><StatusBadge status={order.status} /></td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2 whitespace-nowrap min-w-max">
                          {order.status === "Arrived" && (
                            <button
                              onClick={() => setQaOrder(order)}
                              className="h-9 px-4 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors whitespace-nowrap"
                            >
                              QA Inspection
                            </button>
                          )}
                          {order.status === "Pending" && (
                            <>
                              <button
                                onClick={() => setEditOrder(order)}
                                className="h-9 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleMarkArrived(order.id)}
                                className="h-9 px-4 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors whitespace-nowrap"
                              >
                                Mark Arrived
                              </button>
                              <button
                                onClick={() => handleCancel(order.id)}
                                className="h-9 px-4 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors whitespace-nowrap"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {(order.status === "Completed" || order.status === "Cancelled") && (
                            <button
                              onClick={() => setViewOrder(order)}
                              className="h-9 px-4 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap"
                            >
                              View Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showNew && <NewOrderModal onClose={() => setShowNew(false)} onSave={handleSaveNew} />}
      {editOrder && <EditOrderModal order={editOrder} onClose={() => setEditOrder(null)} onSave={handleSaveEdit} />}
      {viewOrder && <OrderDetailsModal order={viewOrder} onClose={() => setViewOrder(null)} />}
      {qaOrder && <QAModal order={qaOrder} onClose={() => setQaOrder(null)} onComplete={handleQAComplete} />}
    </div>
  );
}