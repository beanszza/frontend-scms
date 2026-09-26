export interface ConfigVariation {
  id: string;
  productId: number;
  sku: string;
  packagingType: string;
  size: string;
  price: number;
  isActive: boolean;
}

export interface ConfigProduct {
  id: string;
  productId: number;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
  imageUrl?: string;
  variations: ConfigVariation[];
}

export interface MaterialRequestItem {
  ingredientId: number;
  itemId: number;
  itemName: string;
  supplierName: string;
  requiredQty: number;
  uom: string;
  availableStock: number;
  isShortfall: boolean;
  suggestedLot: string;
  suggestedExpiry: string;
  isScanned: boolean;
  scannedLot?: string;
  scannedAt?: string;
}

export interface MaterialRequest {
  mrId: string;
  batchId: number;
  batchNumber: string;
  productName: string;
  recipeId: number;
  recipeName: string;
  neededDate: string;
  status: "Pending" | "Ready to Issue" | "Issued";
  items: MaterialRequestItem[];
  submittedBy: string;
  submittedAt: string;
  issuedAt?: string;
  issuedBy?: string;
}

export interface ProductionStageLog {
  stageName: "Peeling" | "Steaming" | "Mixing" | "Grind" | "Cooking" | "Cooling";
  inCharge: string;
  timestamp: string;
  photoUrl: string;
  notes?: string;
  completed: boolean;
}

export interface QAChecklist {
  overallAppearance: "Pass" | "Fail";
  aroma: "Pass" | "Fail";
  texture: "Pass" | "Fail";
  tasteTest: "Pass" | "Fail";
  consistency: "Pass" | "Fail";
  inspector: string;
  notes: string;
  photoUrl?: string;
  decision: "Approved" | "Rejected";
  decisionDate: string;
  rejectionReason?: string;
}

export interface PackagingMaterialItem {
  name: string;
  required: number;
  available: number;
  shortfall: boolean;
}

export interface PackagingData {
  batchNumber: string;
  productName: string;
  packagingSize: string;
  bulkAvailable: string;
  targetOutput: number;
  materials: PackagingMaterialItem[];
  goodQty: number;
  damagedQty: number;
  wasteQty: number;
  fgLotNumber: string;
  expiryDate: string;
  packagerName: string;
  photoUrl?: string;
  completed: boolean;
}

export interface ProductionSummaryReport {
  batchNumber: string;
  productName: string;
  variant: string;
  targetYield: number;
  actualGoodOutput: number;
  purpose: string;
  createdAt: string;
  approvedBy: string;
  completedAt: string;
  materialsUsed: {
    itemName: string;
    supplierName: string;
    lotNumber: string;
    quantity: number;
    uom: string;
    expiryDate: string;
  }[];
  stageLogs: ProductionStageLog[];
  qaResults: QAChecklist;
  packaging: {
    packagingSize: string;
    goodQty: number;
    damagedQty: number;
    wasteQty: number;
    fgLotNumber: string;
    expiryDate: string;
    packagerName: string;
    photoUrl?: string;
  };
}

export interface FinishedProductItem {
  productId: number;
  itemId: number;
  itemName: string;
  sellingPrice: number;
  sku: string;
  variant: string;
  imageUrl?: string;
}

export interface ProductionBatchItem {
  batchId: number;
  batchNumber: string;
  recipeId: number;
  recipeName: string;
  productId: number;
  productName: string;
  variant: string;
  purpose: string;
  batchMultiplier: number;
  estimatedQuantity: number;
  actualQuantity: number;
  scrapQuantity: number;
  scrapReason?: string;
  fgLotId?: number;
  productionDate: string;
  stage: string;
  status: string;
  assignedCook: string;
  qualityStatus: string;
  rejectionReason: string;
  imageUrl: string;
  notes: string;
}

export interface ProductionRequest {
  batchId: number;
  batchNumber: string;
  productId: number;
  productName: string;
  variant: string;
  targetYield: number;
  yieldUnit: string;
  purpose: string;
  status:
    | "Draft"
    | "Pending Approval"
    | "Approved"
    | "In Progress"
    | "Passed QA"
    | "Rejected"
    | "Cancelled"
    | "Completed"
    | "Inventory Added";
  stage: string;
  scheduleDate: string;
  rejectionReason?: string;
  recipeId?: number;
  recipeName?: string;
  batchMultiplier?: number;
  actualQuantity?: number;
  scrapQuantity?: number;
  scrapReason?: string;
  fgLotId?: number;
  assignedCook?: string;
  imageUrl?: string;
  qualityStatus?: string;
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  startedAt?: string;
  completedAt?: string;
  materialRequest?: MaterialRequest;
  stageLogs?: ProductionStageLog[];
  qaChecklist?: QAChecklist;
  packagingData?: PackagingData;
  summaryReport?: ProductionSummaryReport;
}

export interface LossItemDetail {
  itemName: string;
  lotNumber: string;
  quantity: number;
  uom: string;
  unitCost: number;
  totalCost: number;
}

export interface LossReport {
  lossId: string;
  batchId: number;
  batchNumber: string;
  productName: string;
  variant: string;
  targetYield: number;
  failureStage: string;
  date: string;
  rejectionReason: string;
  inspector: string;
  notes: string;
  totalEstimatedLoss: number;
  items: LossItemDetail[];
}
