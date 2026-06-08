import sys

with open('c:/Users/mdg4l/repo/r3b2p polyrepo/web-scms/pages/ViewOrdersProcurement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_props = """interface NewOrderModalContentProps {
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
  onClose: () => void;
  handleSave: () => void;
  itemsList: ItemResponse[];
  suppliersList: SupplierResponse[];
}"""

new_props = """interface NewOrderModalContentProps {
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
  status: OrderStatus;
  setStatus: (value: OrderStatus) => void;
  receiptFile: File | null;
  setReceiptFile: (file: File | null) => void;
  onClose: () => void;
  handleSave: () => void;
  itemsList: ItemResponse[];
  suppliersList: SupplierResponse[];
  isEdit?: boolean;
}"""
content = content.replace(old_props, new_props)

old_modals = """function NewOrderModal({ onClose, onSave, itemsList, suppliersList }: { onClose: () => void; onSave: (o: Order) => void; itemsList: ItemResponse[]; suppliersList: SupplierResponse[]; }) {
  const [supplierId, setSupplierId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [eta, setEta] = useState("");
  const [payment, setPayment] = useState<PaymentType>("Payable");

  async function handleSave() {
    if (!supplierId || !itemId || !quantity || !eta) return;
    
    try {
      const response = await api.post("/api/scms/api/PurchaseOrders", {
        supplierId: Number(supplierId),
        expectedArrivalDate: new Date(eta).toISOString(),
        paymentType: payment,
        totalAmount: 0, // Placeholder
        items: [{
          itemId: Number(itemId),
          poItemQuantity: Number(quantity)
        }]
      });
      
      if (response.data.success) {
        onSave(response.data.data);
      }
      onClose();
    } catch (error) {
      console.error("Error creating order", error);
      alert("Failed to create order");
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
      onClose={onClose}
      handleSave={handleSave}
      itemsList={itemsList}
      suppliersList={suppliersList}
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
  onClose,
  handleSave,
  itemsList,
  suppliersList,
}: NewOrderModalContentProps) {
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">New Order</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a new purchase order</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Supplier *</label>
          <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
            <option value="">Select supplier...</option>
            {suppliersList.map(s => <option key={s.supplierId} value={s.supplierId}>{s.companyName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Item *</label>
          <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={itemId} onChange={e => setItemId(e.target.value)}>
            <option value="">Select item...</option>
            {itemsList.map(i => <option key={i.itemId} value={i.itemId}>{i.itemName} ({i.category}) - {i.unitOfMeasure}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Quantity *</label>
            <input type="number" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 100" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expected Arrival (ETA) *</label>
            <input type="date" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="MM/DD/YYYY" value={eta} onChange={e => setEta(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Payment Type *</label>
          <select className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={payment} onChange={e => setPayment(e.target.value as PaymentType)}>
            <option value="Payable">Payable</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
        <button onClick={handleSave} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Create Order</button>
      </div>
    </Modal>
  );
}"""

new_modals = """function NewOrderModal({ onClose, onSave, itemsList, suppliersList }: { onClose: () => void; onSave: (o: Order) => void; itemsList: ItemResponse[]; suppliersList: SupplierResponse[]; }) {
  const [supplierId, setSupplierId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [eta, setEta] = useState("");
  const [payment, setPayment] = useState<PaymentType>("Payable");
  const [status, setStatus] = useState<OrderStatus>("Pending");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  async function handleSave() {
    if (!supplierId || !itemId || !quantity || !eta) return;
    
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
          const formData = new FormData();
          formData.append("file", receiptFile);
          await api.post(`/api/scms/api/PurchaseOrders/${poId}/upload-receipt`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
        if (status !== "Pending") {
          await api.put(`/api/scms/api/PurchaseOrders/${poId}/status`, { status });
        }
        onSave(response.data.data);
      }
      onClose();
    } catch (error) {
      console.error("Error creating order", error);
      alert("Failed to create order");
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
      status={status}
      setStatus={setStatus}
      receiptFile={receiptFile}
      setReceiptFile={setReceiptFile}
      onClose={onClose}
      handleSave={handleSave}
      itemsList={itemsList}
      suppliersList={suppliersList}
    />
  );
}

function EditOrderModal({ order, onClose, onSave, itemsList, suppliersList }: { order: Order; onClose: () => void; onSave: () => void; itemsList: ItemResponse[]; suppliersList: SupplierResponse[]; }) {
  const [supplierId, setSupplierId] = useState(order.supplierId?.toString() || "");
  const [itemId, setItemId] = useState(order.itemId?.toString() || "");
  const [quantity, setQuantity] = useState(order.quantity?.toString() || "");
  const [eta, setEta] = useState(new Date(order.eta).toISOString().split('T')[0] || "");
  const [payment, setPayment] = useState<PaymentType>(order.payment || "Payable");
  const [status, setStatus] = useState<OrderStatus>(order.status || "Pending");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  async function handleSave() {
    try {
      if (receiptFile) {
        const formData = new FormData();
        formData.append("file", receiptFile);
        await api.post(`/api/scms/api/PurchaseOrders/${order.poId}/upload-receipt`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      if (status !== order.status) {
        await api.put(`/api/scms/api/PurchaseOrders/${order.poId}/status`, { status });
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update order");
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
      status={status}
      setStatus={setStatus}
      receiptFile={receiptFile}
      setReceiptFile={setReceiptFile}
      onClose={onClose}
      handleSave={handleSave}
      itemsList={itemsList}
      suppliersList={suppliersList}
      isEdit={true}
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
  status,
  setStatus,
  receiptFile,
  setReceiptFile,
  onClose,
  handleSave,
  itemsList,
  suppliersList,
  isEdit
}: NewOrderModalContentProps) {
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{isEdit ? "Edit Order" : "Create New Order"}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Purchase Raw Materials, Tools, or Supplies</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Supplier *</label>
          <select disabled={isEdit} className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
            <option value="">Select supplier...</option>
            {suppliersList.map(s => <option key={s.supplierId} value={s.supplierId}>{s.companyName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Item *</label>
          <select disabled={isEdit} className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" value={itemId} onChange={e => setItemId(e.target.value)}>
            <option value="">Select item...</option>
            {itemsList.map(i => <option key={i.itemId} value={i.itemId}>{i.itemName} ({i.category}) - {i.unitOfMeasure}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Quantity *</label>
            <input disabled={isEdit} type="number" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" placeholder="e.g., 100" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expected Arrival (ETA) *</label>
            <input disabled={isEdit} type="date" className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" placeholder="MM/DD/YYYY" value={eta} onChange={e => setEta(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Payment Type *</label>
            <select disabled={isEdit} className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" value={payment} onChange={e => setPayment(e.target.value as PaymentType)}>
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
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
        <button onClick={handleSave} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">{isEdit ? "Save Changes" : "Create Order"}</button>
      </div>
    </Modal>
  );
}"""
content = content.replace(old_modals, new_modals)

content = content.replace('  const [showNew, setShowNew] = useState(false);', '  const [showNew, setShowNew] = useState(false);\n  const [editOrder, setEditOrder] = useState<Order | null>(null);')

old_button = """                      {order.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleMarkArrived(order.id, order.poId)}
                            className="h-9 px-4 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Mark Arrived
                          </button>
                          <button
                            onClick={() => handleCancel(order.id, order.poId)}
                            className="h-9 px-4 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </>
                      )}"""

new_button = """                      {order.status === "Pending" && (
                        <>
                          <button
                            onClick={() => setEditOrder(order)}
                            className="h-9 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleMarkArrived(order.id, order.poId)}
                            className="h-9 px-4 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Mark Arrived
                          </button>
                          <button
                            onClick={() => handleCancel(order.id, order.poId)}
                            className="h-9 px-4 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </>
                      )}"""
content = content.replace(old_button, new_button)

old_render = """      {showNew && <NewOrderModal onClose={() => setShowNew(false)} onSave={handleSaveNew} itemsList={itemsList} suppliersList={suppliersList} />}
      {viewOrder && <OrderDetailsModal order={viewOrder} onClose={() => setViewOrder(null)} />}"""

new_render = """      {showNew && <NewOrderModal onClose={() => setShowNew(false)} onSave={handleSaveNew} itemsList={itemsList} suppliersList={suppliersList} />}
      {editOrder && <EditOrderModal order={editOrder} onClose={() => setEditOrder(null)} onSave={() => fetchOrders()} itemsList={itemsList} suppliersList={suppliersList} />}
      {viewOrder && <OrderDetailsModal order={viewOrder} onClose={() => setViewOrder(null)} />}"""

content = content.replace(old_render, new_render)

with open('c:/Users/mdg4l/repo/r3b2p polyrepo/web-scms/pages/ViewOrdersProcurement.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
