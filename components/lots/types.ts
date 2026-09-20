export type LotItem = {
  lotId: number;
  lotCode: string;
  itemId: number;
  itemName: string;
  locationId: number;
  locationName: string;
  sourceType: string;
  supplierId: number | null;
  supplierName: string | null;
  supplierLotNo: string | null;
  receivedDate: string; // ISO date string
  expiryDate: string | null; // ISO date string
  quantityReceived: number;
  quantityRemaining: number;
  uomName: string;
  unitCost: number;
  status: string;
  isOpeningBalance: boolean;
  isExpired: boolean;
  sharePercent?: number | null;
  isFefoNext?: boolean;
  manufactureDate?: string | null;
  daysUntilExpiry?: number | null;
};