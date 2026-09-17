export type OrderStatus = "Pending" | "Arrived" | "Completed" | "Cancelled" | "Rejected";
export type PaymentType = "Payable" | "Paid";

export type Order = {
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

export type SupplyItem = {
  itemId: number;
  itemName: string;
  categoryName: string;
  uomName?: string;
};

export type Supplier = {
  supplierId: number;
  companyName: string;
};

export type PRStatus =
  | "Draft"
  | "Pending Approval"
  | "Returned"
  | "Approved"
  | "Rejected"
  | "Converted to PO"
  | "Cancelled"
  | "Closed";

export type PRItem = {
  prItemId?: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  uomName: string;
  purchaseUomId?: number;
  actualInventory: number;
  requestedQuantity: number;
  estimatedUnitPrice?: number;
};

export type PurchaseRequisition = {
  prId: number;
  prNumber: string;
  department: string;
  requestedBy: string;
  requestDate: string;
  requiredDate: string;
  status: PRStatus;
  requestType: string;
  priority: string;
  purpose: string;
  notes?: string;
  adminNotes?: string;
  estimatedTotalAmount?: number;
  generatedPoNumbers?: string;
  updatedAt?: string;
  items: PRItem[];
};

// ─── Purchase Order Types ───────────────────────────────────────────────────

export type POStatus =
  | "Draft"
  | "Pending Approval"
  | "Returned"
  | "Approved"
  | "Ordered"
  | "Rejected"
  | "Cancelled"
  | "Pending"    // legacy
  | "Arrived"    // legacy
  | "Completed"; // legacy

export type POItem = {
  poItemId?: number;
  itemId: number;
  itemName: string;
  poItemQuantity: number;
  receivedQuantity?: number;
  /** Total price for this line (user-typed, not per-unit) */
  totalPrice: number;
  /** Derived: totalPrice / poItemQuantity */
  unitPrice: number;
  purchaseUomId?: number;
  purchaseUomName: string;
  lineTotal: number;
};

export type PurchaseOrderPO = {
  poId: number;
  poNumber: string;
  prId?: number;
  prNumber?: string;
  supplierId: number;
  supplierName: string;
  requestedBy: string;
  orderDate: string;
  expectedArrivalDate: string;
  status: POStatus;
  paymentType?: string;
  adminNotes?: string;
  totalAmount: number;
  items: POItem[];
};
