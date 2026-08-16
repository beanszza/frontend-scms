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
