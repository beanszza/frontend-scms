import {
  ConfigProduct,
  ConfigVariation,
  ProductionRequest,
  MaterialRequest,
  MaterialRequestItem,
  LossReport,
  ProductionSummaryReport,
} from "./types";

const STORAGE_KEYS = {
  PRODUCTS: "scms_production_config_products_v2",
  REQUESTS: "scms_production_requests_v2",
  MATERIAL_REQUESTS: "scms_production_material_requests_v2",
  LOSS_REPORTS: "scms_production_loss_reports_v2",
  BATCH_SEQ: "scms_production_batch_sequence_v2",
  MR_SEQ: "scms_production_mr_sequence_v2",
  LOT_SEQ: "scms_production_lot_sequence_v2",
  LOSS_SEQ: "scms_production_loss_sequence_v2",
};

// Seed initial products if none exist
const DEFAULT_PRODUCTS: ConfigProduct[] = [
  {
    id: "prod-1",
    productId: 1,
    name: "Ube Halaya Classic",
    category: "Ube Halaya",
    description: "Premium handcrafted traditional purple yam delicacy made with pure ube, condensed milk, and fresh dairy butter.",
    isActive: true,
    imageUrl: "",
    variations: [
      {
        id: "var-1",
        productId: 1,
        sku: "UBH-CLS-250G",
        packagingType: "Tub",
        size: "250g",
        price: 150,
        isActive: true,
      },
      {
        id: "var-2",
        productId: 1,
        sku: "UBH-CLS-500G",
        packagingType: "Tub",
        size: "500g",
        price: 280,
        isActive: true,
      },
    ],
  },
  {
    id: "prod-2",
    productId: 2,
    name: "Ube Halaya with Cheese",
    category: "Ube Halaya",
    description: "Rich purple yam spread layered and topped with shredded aged cheddar cheese.",
    isActive: true,
    imageUrl: "",
    variations: [
      {
        id: "var-3",
        productId: 2,
        sku: "UBH-CHS-250G",
        packagingType: "Tub",
        size: "250g",
        price: 175,
        isActive: true,
      },
      {
        id: "var-4",
        productId: 2,
        sku: "UBH-CHS-500G",
        packagingType: "Tub",
        size: "500g",
        price: 320,
        isActive: true,
      },
    ],
  },
  {
    id: "prod-3",
    productId: 3,
    name: "Ube Jam Special",
    category: "Jams & Spreads",
    description: "Silky smooth slow-cooked spreadable ube jam for toasts and pastries.",
    isActive: true,
    imageUrl: "",
    variations: [
      {
        id: "var-5",
        productId: 3,
        sku: "UBJ-JAR-220G",
        packagingType: "Jar",
        size: "220g",
        price: 140,
        isActive: true,
      },
    ],
  },
];

// Seed initial demo requests
const DEFAULT_REQUESTS: ProductionRequest[] = [
  {
    batchId: 101,
    batchNumber: "BATCH-2026-001",
    productId: 1,
    productName: "Ube Halaya Classic",
    variant: "250g (Tub)",
    targetYield: 100,
    yieldUnit: "PCS",
    purpose: "Weekly Store Replenishment",
    status: "Approved",
    stage: "Material Request",
    scheduleDate: new Date().toISOString().split("T")[0],
    recipeId: 1,
    recipeName: "Standard Ube Halaya Formula A",
    assignedCook: "Head Cook Elena",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    approvedAt: new Date(Date.now() - 86400000).toISOString(),
    approvedBy: "System Administrator",
  },
  {
    batchId: 102,
    batchNumber: "BATCH-2026-002",
    productId: 2,
    productName: "Ube Halaya with Cheese",
    variant: "500g (Tub)",
    targetYield: 50,
    yieldUnit: "PCS",
    purpose: "Special Catering Order",
    status: "Pending Approval",
    stage: "Draft",
    scheduleDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
  },
];

export const productionStorage = {
  // --- Sequence Generators ---
  getNextBatchNumber(): string {
    if (typeof window === "undefined") return "BATCH-2026-001";
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.BATCH_SEQ) || "102", 10);
    const next = current + 1;
    localStorage.setItem(STORAGE_KEYS.BATCH_SEQ, next.toString());
    const year = new Date().getFullYear();
    const formattedSeq = next.toString().padStart(3, "0");
    return `BATCH-${year}-${formattedSeq}`;
  },

  getNextMRNumber(): string {
    if (typeof window === "undefined") return "MR-2026-001";
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.MR_SEQ) || "10", 10);
    const next = current + 1;
    localStorage.setItem(STORAGE_KEYS.MR_SEQ, next.toString());
    const year = new Date().getFullYear();
    return `MR-${year}-${next.toString().padStart(3, "0")}`;
  },

  getNextFGLotNumber(): string {
    if (typeof window === "undefined") return "LOT-FP-2026-001";
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.LOT_SEQ) || "20", 10);
    const next = current + 1;
    localStorage.setItem(STORAGE_KEYS.LOT_SEQ, next.toString());
    const year = new Date().getFullYear();
    return `LOT-FP-${year}-${next.toString().padStart(3, "0")}`;
  },

  getNextLossId(): string {
    if (typeof window === "undefined") return "LOSS-2026-001";
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.LOSS_SEQ) || "5", 10);
    const next = current + 1;
    localStorage.setItem(STORAGE_KEYS.LOSS_SEQ, next.toString());
    const year = new Date().getFullYear();
    return `LOSS-${year}-${next.toString().padStart(3, "0")}`;
  },

  // --- Products Configuration ---
  getProducts(): ConfigProduct[] {
    if (typeof window === "undefined") return DEFAULT_PRODUCTS;
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PRODUCTS;
    }
  },

  saveProduct(product: Omit<ConfigProduct, "id"> & { id?: string }): ConfigProduct {
    const products = this.getProducts();
    if (product.id) {
      // update
      const idx = products.findIndex((p) => p.id === product.id);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          ...product,
          id: product.id,
        };
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return products[idx];
      }
    }
    // create
    const newId = `prod-${Date.now()}`;
    const newProd: ConfigProduct = {
      ...product,
      id: newId,
      productId: products.length > 0 ? Math.max(...products.map((p) => p.productId)) + 1 : 1,
      variations: product.variations || [],
    };
    products.push(newProd);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newProd;
  },

  saveVariation(productId: number, variation: Omit<ConfigVariation, "id"> & { id?: string }): ConfigVariation {
    const products = this.getProducts();
    const product = products.find((p) => p.productId === productId);
    if (!product) throw new Error("Parent product not found");

    if (variation.id) {
      const vIdx = product.variations.findIndex((v) => v.id === variation.id);
      if (vIdx !== -1) {
        product.variations[vIdx] = { ...product.variations[vIdx], ...variation, id: variation.id };
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return product.variations[vIdx];
      }
    }

    const newVarId = `var-${Date.now()}`;
    const newVar: ConfigVariation = {
      ...variation,
      id: newVarId,
      productId,
    };
    product.variations.push(newVar);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newVar;
  },

  deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  deleteVariation(productId: number, varId: string): void {
    const products = this.getProducts();
    const product = products.find((p) => p.productId === productId);
    if (product) {
      product.variations = product.variations.filter((v) => v.id !== varId);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }
  },

  // --- Production Requests ---
  getRequests(): ProductionRequest[] {
    if (typeof window === "undefined") return DEFAULT_REQUESTS;
    const raw = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(DEFAULT_REQUESTS));
      return DEFAULT_REQUESTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_REQUESTS;
    }
  },

  saveRequest(req: ProductionRequest): void {
    const requests = this.getRequests();
    const idx = requests.findIndex((r) => r.batchId === req.batchId);
    if (idx !== -1) {
      requests[idx] = req;
    } else {
      requests.unshift(req);
    }
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  },

  createRequest(data: {
    productId: number;
    productName: string;
    variant: string;
    targetYield: number;
    purpose: string;
    scheduleDate: string;
    status: "Draft" | "Pending Approval";
    assignedCook?: string;
  }): ProductionRequest {
    const batchNumber = this.getNextBatchNumber();
    const batchId = Date.now();
    const newReq: ProductionRequest = {
      batchId,
      batchNumber,
      productId: data.productId,
      productName: data.productName,
      variant: data.variant,
      targetYield: data.targetYield,
      yieldUnit: "PCS",
      purpose: data.purpose,
      status: data.status,
      stage: "Request",
      scheduleDate: data.scheduleDate,
      assignedCook: data.assignedCook || "Head Cook",
      createdAt: new Date().toISOString(),
    };
    this.saveRequest(newReq);
    return newReq;
  },

  approveRequest(batchId: number, approvedBy = "System Administrator"): void {
    const requests = this.getRequests();
    const req = requests.find((r) => r.batchId === batchId);
    if (req) {
      req.status = "Approved";
      req.approvedAt = new Date().toISOString();
      req.approvedBy = approvedBy;
      this.saveRequest(req);
    }
  },

  rejectRequest(batchId: number, rejectionReason: string): void {
    const requests = this.getRequests();
    const req = requests.find((r) => r.batchId === batchId);
    if (req) {
      req.status = "Rejected";
      req.rejectionReason = rejectionReason;
      this.saveRequest(req);
    }
  },

  startPreProduction(batchId: number): void {
    const requests = this.getRequests();
    const req = requests.find((r) => r.batchId === batchId);
    if (req) {
      req.status = "In Progress";
      req.stage = "Material Request";
      req.startedAt = new Date().toISOString();
      this.saveRequest(req);
    }
  },

  // --- Material Requests & Issuance ---
  getMaterialRequests(): MaterialRequest[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEYS.MATERIAL_REQUESTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  createMaterialRequest(data: {
    batchId: number;
    batchNumber: string;
    productName: string;
    recipeId: number;
    recipeName: string;
    neededDate: string;
    items: MaterialRequestItem[];
    submittedBy: string;
  }): MaterialRequest {
    const mrId = this.getNextMRNumber();
    const mr: MaterialRequest = {
      mrId,
      batchId: data.batchId,
      batchNumber: data.batchNumber,
      productName: data.productName,
      recipeId: data.recipeId,
      recipeName: data.recipeName,
      neededDate: data.neededDate,
      status: "Pending",
      items: data.items,
      submittedBy: data.submittedBy,
      submittedAt: new Date().toISOString(),
    };

    const allMRs = this.getMaterialRequests();
    allMRs.unshift(mr);
    localStorage.setItem(STORAGE_KEYS.MATERIAL_REQUESTS, JSON.stringify(allMRs));

    // Link into request
    const requests = this.getRequests();
    const req = requests.find((r) => r.batchId === data.batchId);
    if (req) {
      req.materialRequest = mr;
      req.recipeId = data.recipeId;
      req.recipeName = data.recipeName;
      this.saveRequest(req);
    }
    return mr;
  },

  updateMRItemScan(mrId: string, itemId: number, scannedLot: string): { success: boolean; message: string } {
    const allMRs = this.getMaterialRequests();
    const mr = allMRs.find((m) => m.mrId === mrId);
    if (!mr) return { success: false, message: "Material request not found" };

    const item = mr.items.find((i) => i.itemId === itemId);
    if (!item) return { success: false, message: "Item not found in MR" };

    if (scannedLot.trim().toUpperCase() !== item.suggestedLot.trim().toUpperCase()) {
      return {
        success: false,
        message: `Mismatched Lot! Expected: ${item.suggestedLot}, Scanned: ${scannedLot}`,
      };
    }

    item.isScanned = true;
    item.scannedLot = scannedLot;
    item.scannedAt = new Date().toISOString();

    const allScanned = mr.items.every((i) => i.isScanned);
    if (allScanned) {
      mr.status = "Ready to Issue";
    }

    localStorage.setItem(STORAGE_KEYS.MATERIAL_REQUESTS, JSON.stringify(allMRs));

    // Update in batch as well
    const requests = this.getRequests();
    const req = requests.find((r) => r.batchId === mr.batchId);
    if (req && req.materialRequest) {
      req.materialRequest = mr;
      this.saveRequest(req);
    }

    return { success: true, message: `Successfully verified Lot ${scannedLot}!` };
  },

  issueMaterialsToProduction(mrId: string, issuedBy = "Inventory Manager"): void {
    const allMRs = this.getMaterialRequests();
    const mr = allMRs.find((m) => m.mrId === mrId);
    if (!mr) return;

    mr.status = "Issued";
    mr.issuedAt = new Date().toISOString();
    mr.issuedBy = issuedBy;
    localStorage.setItem(STORAGE_KEYS.MATERIAL_REQUESTS, JSON.stringify(allMRs));

    const requests = this.getRequests();
    const req = requests.find((r) => r.batchId === mr.batchId);
    if (req) {
      req.materialRequest = mr;
      req.stage = "Peeling"; // Advance to first cooking stage!
      this.saveRequest(req);
    }
  },

  // --- Production Stages ---
  completeStage(
    batchId: number,
    stageName: "Peeling" | "Steaming" | "Mixing" | "Grind" | "Cooking" | "Cooling",
    inCharge: string,
    photoUrl: string,
    notes = ""
  ): void {
    const requests = this.getRequests();
    const req = requests.find((r) => r.batchId === batchId);
    if (!req) return;

    if (!req.stageLogs) req.stageLogs = [];
    const logIdx = req.stageLogs.findIndex((l) => l.stageName === stageName);
    const logData = {
      stageName,
      inCharge,
      timestamp: new Date().toISOString(),
      photoUrl,
      notes,
      completed: true,
    };
    if (logIdx !== -1) {
      req.stageLogs[logIdx] = logData;
    } else {
      req.stageLogs.push(logData);
    }

    // Advance next stage
    const STAGE_ORDER: ("Peeling" | "Steaming" | "Mixing" | "Grind" | "Cooking" | "Cooling" | "QA")[] = [
      "Peeling",
      "Steaming",
      "Mixing",
      "Grind",
      "Cooking",
      "Cooling",
      "QA",
    ];
    const currIdx = STAGE_ORDER.indexOf(stageName);
    if (currIdx !== -1 && currIdx < STAGE_ORDER.length - 1) {
      req.stage = STAGE_ORDER[currIdx + 1];
    }
    this.saveRequest(req);
  },

  // --- QA Decision ---
  submitQA(
    batchId: number,
    checklist: {
      overallAppearance: "Pass" | "Fail";
      aroma: "Pass" | "Fail";
      texture: "Pass" | "Fail";
      tasteTest: "Pass" | "Fail";
      consistency: "Pass" | "Fail";
      inspector: string;
      notes: string;
      photoUrl?: string;
      decision: "Approved" | "Rejected";
      rejectionReason?: string;
    }
  ): void {
    const requests = this.getRequests();
    const req = requests.find((r) => r.batchId === batchId);
    if (!req) return;

    req.qaChecklist = {
      ...checklist,
      decisionDate: new Date().toISOString(),
    };

    if (checklist.decision === "Rejected") {
      req.status = "Rejected";
      req.stage = "Rejected in QA";
      req.rejectionReason = checklist.rejectionReason || "Failed QA taste & sensory parameters";

      // Auto-generate Loss Report
      const lossId = this.getNextLossId();
      const lossItems = (req.materialRequest?.items || []).map((item) => ({
        itemName: item.itemName,
        lotNumber: item.scannedLot || item.suggestedLot || "N/A",
        quantity: item.requiredQty,
        uom: item.uom,
        unitCost: 45,
        totalCost: item.requiredQty * 45,
      }));
      const totalEstimatedLoss = lossItems.reduce((acc, i) => acc + i.totalCost, 0);

      const lossReport: LossReport = {
        lossId,
        batchId: req.batchId,
        batchNumber: req.batchNumber,
        productName: req.productName,
        variant: req.variant,
        targetYield: req.targetYield,
        failureStage: "Quality Assurance Inspection",
        date: new Date().toISOString(),
        rejectionReason: req.rejectionReason,
        inspector: checklist.inspector,
        notes: checklist.notes,
        totalEstimatedLoss,
        items: lossItems,
      };

      const lossReports = this.getLossReports();
      lossReports.unshift(lossReport);
      localStorage.setItem(STORAGE_KEYS.LOSS_REPORTS, JSON.stringify(lossReports));
    } else {
      req.stage = "Packaging";
    }
    this.saveRequest(req);
  },

  // --- Packaging & Stock-In ---
  completePackaging(
    batchId: number,
    data: {
      goodQty: number;
      damagedQty: number;
      wasteQty: number;
      packagerName: string;
      expiryDate: string;
      photoUrl?: string;
    }
  ): string {
    const requests = this.getRequests();
    const req = requests.find((r) => r.batchId === batchId);
    if (!req) throw new Error("Batch not found");

    const fgLotNumber = this.getNextFGLotNumber();

    req.packagingData = {
      batchNumber: req.batchNumber,
      productName: req.productName,
      packagingSize: req.variant,
      bulkAvailable: `${Math.round(req.targetYield * 0.25)} KG`,
      targetOutput: req.targetYield,
      materials: [
        { name: "Plastic Jar / Tub", required: req.targetYield, available: req.targetYield + 20, shortfall: false },
        { name: "Lid Cap", required: req.targetYield, available: req.targetYield + 10, shortfall: false },
        { name: "Brand Label", required: req.targetYield, available: req.targetYield, shortfall: false },
        { name: "Heat Induction Seal", required: req.targetYield, available: req.targetYield - 20, shortfall: true },
      ],
      goodQty: data.goodQty,
      damagedQty: data.damagedQty,
      wasteQty: data.wasteQty,
      fgLotNumber,
      expiryDate: data.expiryDate,
      packagerName: data.packagerName,
      photoUrl: data.photoUrl,
      completed: true,
    };

    req.stage = "Stock In";
    this.saveRequest(req);
    return fgLotNumber;
  },

  addBatchToInventory(batchId: number): void {
    const requests = this.getRequests();
    const req = requests.find((r) => r.batchId === batchId);
    if (!req) return;

    req.status = "Completed";
    req.stage = "Completed";
    req.completedAt = new Date().toISOString();

    // Build comprehensive Summary Report for Approved tab "View" modal
    const summary: ProductionSummaryReport = {
      batchNumber: req.batchNumber,
      productName: req.productName,
      variant: req.variant,
      targetYield: req.targetYield,
      actualGoodOutput: req.packagingData?.goodQty || req.targetYield,
      purpose: req.purpose,
      createdAt: req.createdAt,
      approvedBy: req.approvedBy || "Administrator",
      completedAt: req.completedAt,
      materialsUsed: (req.materialRequest?.items || []).map((m) => ({
        itemName: m.itemName,
        supplierName: m.supplierName,
        lotNumber: m.scannedLot || m.suggestedLot,
        quantity: m.requiredQty,
        uom: m.uom,
        expiryDate: m.suggestedExpiry,
      })),
      stageLogs: req.stageLogs || [],
      qaResults: req.qaChecklist || {
        overallAppearance: "Pass",
        aroma: "Pass",
        texture: "Pass",
        tasteTest: "Pass",
        consistency: "Pass",
        inspector: " Elena",
        notes: "Passed sensory tasting standard",
        decision: "Approved",
        decisionDate: new Date().toISOString(),
      },
      packaging: {
        packagingSize: req.variant,
        goodQty: req.packagingData?.goodQty || req.targetYield,
        damagedQty: req.packagingData?.damagedQty || 0,
        wasteQty: req.packagingData?.wasteQty || 0,
        fgLotNumber: req.packagingData?.fgLotNumber || "LOT-FP-2026-001",
        expiryDate: req.packagingData?.expiryDate || new Date(Date.now() + 86400000 * 90).toISOString().split("T")[0],
        packagerName: req.packagingData?.packagerName || req.assignedCook || "Elena",
        photoUrl: req.packagingData?.photoUrl,
      },
    };

    req.summaryReport = summary;
    this.saveRequest(req);
  },

  // --- Loss Reports ---
  getLossReports(): LossReport[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEYS.LOSS_REPORTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },
};
