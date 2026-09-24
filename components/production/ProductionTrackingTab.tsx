"use client";

import React, { useState, useRef } from "react";
import { Calendar, ChevronRight, X, QrCode, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductionRequest, MaterialRequest, MaterialRequestItem } from "./types";
import { productionStorage } from "./productionStorage";
import QrScannerModal from "./QrScannerModal";
import { CreatePRModal } from "@/components/orders-procurement/pr/CreatePRForm";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";

interface ProductionTrackingTabProps {
  initialSelectedBatchId?: number | null;
  isInventoryManager: boolean;
  isHeadCook: boolean;
  onNavigateToRequest?: () => void;
}

// Available Standard Recipes / BOMs
const AVAILABLE_BOMS = [
  {
    recipeId: 1,
    recipeName: "Standard Ube Halaya Formula A (Classic)",
    outputYield: 100,
    ingredients: [
      { itemId: 101, itemName: "Fresh Purple Yam (Ube)", supplierName: "Highland Agri Corp", standardQty: 30, uom: "KG", stock: 150, suggestedLot: "LOT-UB-2026-088", expiry: "2026-10-15" },
      { itemId: 102, itemName: "Condensed Milk (Sweetened)", supplierName: "Dairy Gold Co", standardQty: 15, uom: "Cans", stock: 80, suggestedLot: "LOT-CM-2026-012", expiry: "2027-03-20" },
      { itemId: 103, itemName: "Evaporated Milk", supplierName: "Dairy Gold Co", standardQty: 10, uom: "Cans", stock: 65, suggestedLot: "LOT-EM-2026-004", expiry: "2027-02-14" },
      { itemId: 104, itemName: "Pure Dairy Butter (Unsalted)", supplierName: "Creamery Phil", standardQty: 5, uom: "KG", stock: 25, suggestedLot: "LOT-DB-2026-091", expiry: "2026-11-30" },
      { itemId: 105, itemName: "Refined Cane Sugar", supplierName: "SweetLife Sugar", standardQty: 8, uom: "KG", stock: 90, suggestedLot: "LOT-SG-2026-033", expiry: "2027-08-10" },
    ],
  },
  {
    recipeId: 2,
    recipeName: "Special Ube Halaya with Cheese Formula B",
    outputYield: 50,
    ingredients: [
      { itemId: 101, itemName: "Fresh Purple Yam (Ube)", supplierName: "Highland Agri Corp", standardQty: 18, uom: "KG", stock: 150, suggestedLot: "LOT-UB-2026-088", expiry: "2026-10-15" },
      { itemId: 106, itemName: "Aged Cheddar Cheese (Block)", supplierName: "Dairy Gold Co", standardQty: 4, uom: "KG", stock: 2, suggestedLot: "LOT-CH-2026-009", expiry: "2026-10-05" }, // Simulated shortfall
      { itemId: 102, itemName: "Condensed Milk (Sweetened)", supplierName: "Dairy Gold Co", standardQty: 10, uom: "Cans", stock: 80, suggestedLot: "LOT-CM-2026-012", expiry: "2027-03-20" },
      { itemId: 104, itemName: "Pure Dairy Butter (Unsalted)", supplierName: "Creamery Phil", standardQty: 3, uom: "KG", stock: 25, suggestedLot: "LOT-DB-2026-091", expiry: "2026-11-30" },
    ],
  },
];

const PREP_STAGES = ["Peeling", "Steaming", "Mixing", "Grind", "Cooking", "Cooling"] as const;

export default function ProductionTrackingTab({
  initialSelectedBatchId,
  isInventoryManager,
  isHeadCook,
}: ProductionTrackingTabProps) {
  const [requests, setRequests] = useState<ProductionRequest[]>(() =>
    productionStorage.getRequests()
  );

  // Active batches for tracking (In Progress or Approved)
  const activeBatches = requests.filter(
    (r) => r.status === "In Progress" || r.status === "Approved"
  );

  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(() => {
    if (initialSelectedBatchId) return initialSelectedBatchId;
    return activeBatches[0]?.batchId || null;
  });

  // Inventory Manager Tabs: Material Request and Material Issued
  const [invMainTab, setInvMainTab] = useState<"requests" | "issued">("requests");
  const [mrSearchQuery, setMrSearchQuery] = useState("");
  const [mrStockFilter, setMrStockFilter] = useState("All");
  const [selectedMRId, setSelectedMRId] = useState<string | null>(null);
  const [isIssuanceMode, setIsIssuanceMode] = useState(false);

  // Step 2: BOM Selection & MR State
  const [selectedBomId, setSelectedBomId] = useState<number>(AVAILABLE_BOMS[0].recipeId);
  const [neededDate, setNeededDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );

  // QR Scanner State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanningItem, setScanningItem] = useState<MaterialRequestItem | null>(null);

  // Shortfall PR Modal State
  const [isPROpen, setIsPROpen] = useState(false);

  // Step 5: Cooking Stages Input State
  const [stageInCharge, setStageInCharge] = useState(isHeadCook ? "Head Cook" : "Elena");
  const [stagePhoto, setStagePhoto] = useState<string>("");
  const [stageNotes, setStageNotes] = useState("");
  const stageFileInputRef = useRef<HTMLInputElement>(null);

  // Step 6: QA Form State
  const [qaAppearance, setQaAppearance] = useState<"Pass" | "Fail">("Pass");
  const [qaAroma, setQaAroma] = useState<"Pass" | "Fail">("Pass");
  const [qaTexture, setQaTexture] = useState<"Pass" | "Fail">("Pass");
  const [qaTaste, setQaTaste] = useState<"Pass" | "Fail">("Pass");
  const [qaConsistency, setQaConsistency] = useState<"Pass" | "Fail">("Pass");
  const [qaInspector, setQaInspector] = useState(isHeadCook ? "Head Cook Elena" : "Inspector Ramos");
  const [qaNotes, setQaNotes] = useState("");
  const [qaRejectReason, setQaRejectReason] = useState("");
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);

  // Step 7: Packaging Form State
  const [goodOutput, setGoodOutput] = useState<number | "">("");
  const [damagedOutput, setDamagedOutput] = useState<number | "">(0);
  const [wasteOutput, setWasteOutput] = useState<number | "">(0);
  const [packagerName, setPackagerName] = useState("Elena Reyes");
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 86400000 * 90).toISOString().split("T")[0]
  );
  const [packagingPhoto, setPackagingPhoto] = useState<string>("");
  const packagingFileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    setRequests(productionStorage.getRequests());
  };

  const selectedBatch = requests.find((r) => r.batchId === selectedBatchId);
  const selectedBom = AVAILABLE_BOMS.find((b) => b.recipeId === selectedBomId) || AVAILABLE_BOMS[0];

  // Calculate current waterfall step (1 to 8)
  const getBatchStep = (batch?: ProductionRequest): number => {
    if (!batch) return 1;
    if (batch.status === "Completed") return 8;
    if (batch.stage === "Stock In") return 8;
    if (batch.stage === "Packaging") return 7;
    if (batch.stage === "QA") return 6;
    if (PREP_STAGES.includes(batch.stage as any)) return 5;
    if (batch.stage === "Materials Issued" || batch.materialRequest?.status === "Issued") return 4;
    if (batch.materialRequest) return 3;
    if (batch.status === "Approved" || batch.status === "In Progress") return 2;
    return 1;
  };

  const currentStep = getBatchStep(selectedBatch);

  // Submit Material Request (Step 2 -> Step 3)
  const handleSubmitMR = () => {
    if (!selectedBatch) return;

    const multiplier = selectedBatch.targetYield / selectedBom.outputYield;
    const items: MaterialRequestItem[] = selectedBom.ingredients.map((ing, idx) => {
      const required = Math.round(ing.standardQty * multiplier * 10) / 10;
      const isShortfall = ing.stock < required;
      return {
        ingredientId: idx + 1,
        itemId: ing.itemId,
        itemName: ing.itemName,
        supplierName: ing.supplierName,
        requiredQty: required,
        uom: ing.uom,
        availableStock: ing.stock,
        isShortfall,
        suggestedLot: ing.suggestedLot,
        suggestedExpiry: ing.expiry,
        isScanned: false,
      };
    });

    productionStorage.createMaterialRequest({
      batchId: selectedBatch.batchId,
      batchNumber: selectedBatch.batchNumber,
      productName: selectedBatch.productName,
      recipeId: selectedBom.recipeId,
      recipeName: selectedBom.recipeName,
      neededDate,
      items,
      submittedBy: isHeadCook ? "Head Cook" : "Elena",
    });

    toast.success("Material Request generated and sent to Inventory Manager!");
    refreshData();
  };

  // Scan trigger
  const handleOpenScan = (item: MaterialRequestItem) => {
    setScanningItem(item);
    setScannerOpen(true);
  };

  const handleScanSuccess = (scannedLot: string) => {
    const mrId = selectedBatch?.materialRequest?.mrId || selectedMRId;
    if (!mrId || !scanningItem) return;
    const res = productionStorage.updateMRItemScan(
      mrId,
      scanningItem.itemId,
      scannedLot
    );
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    refreshData();
  };

  // Issue Materials to Production
  const handleIssueMaterials = (mrId: string) => {
    const allMRs = productionStorage.getMaterialRequests();
    const targetMR = allMRs.find((m) => m.mrId === mrId);
    if (!targetMR) return;

    const allScanned = targetMR.items.every((i) => i.isScanned);
    if (!allScanned) {
      toast.error("All ingredients must be scanned and verified before issuance!");
      return;
    }

    productionStorage.issueMaterialsToProduction(mrId);
    toast.success("Materials issued to production! Transferred to Material Issued tab.");
    setSelectedMRId(null);
    setIsIssuanceMode(false);
    refreshData();
  };

  // Complete Cooking Stage (Step 5)
  const handleCompleteCurrentStage = (stageName: typeof PREP_STAGES[number]) => {
    if (!selectedBatch) return;
    if (!stagePhoto) {
      toast.error(`Please upload a proof of completion photo for the ${stageName} stage.`);
      return;
    }
    if (!stageInCharge.trim()) {
      toast.error("Please specify the operator in-charge.");
      return;
    }

    productionStorage.completeStage(
      selectedBatch.batchId,
      stageName,
      stageInCharge.trim(),
      stagePhoto,
      stageNotes.trim()
    );

    toast.success(`Completed stage: ${stageName}`);
    setStagePhoto("");
    setStageNotes("");
    refreshData();
  };

  // Submit QA (Step 6)
  const handleQAApprove = () => {
    if (!selectedBatch) return;
    productionStorage.submitQA(selectedBatch.batchId, {
      overallAppearance: qaAppearance,
      aroma: qaAroma,
      texture: qaTexture,
      tasteTest: qaTaste,
      consistency: qaConsistency,
      inspector: qaInspector,
      notes: qaNotes.trim() || "Passed all sensory checks",
      decision: "Approved",
    });
    toast.success("QA Inspection Passed! Batch unlocked for Packaging.");
    refreshData();
  };

  const handleQAReject = () => {
    if (!selectedBatch) return;
    if (!qaRejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    productionStorage.submitQA(selectedBatch.batchId, {
      overallAppearance: qaAppearance,
      aroma: qaAroma,
      texture: qaTexture,
      tasteTest: qaTaste,
      consistency: qaConsistency,
      inspector: qaInspector,
      notes: qaNotes.trim(),
      decision: "Rejected",
      rejectionReason: qaRejectReason.trim(),
    });

    toast.error(`Batch rejected! Automatic loss report generated in the Loss tab.`);
    setShowRejectPrompt(false);
    setQaRejectReason("");
    refreshData();
  };

  // Submit Packaging (Step 7)
  const handleCompletePackaging = () => {
    if (!selectedBatch) return;
    if (goodOutput === "" || Number(goodOutput) <= 0) {
      toast.error("Please enter a valid Good Output quantity");
      return;
    }
    if (!packagerName.trim()) {
      toast.error("Please provide the Packager Name");
      return;
    }

    const fgLot = productionStorage.completePackaging(selectedBatch.batchId, {
      goodQty: Number(goodOutput),
      damagedQty: Number(damagedOutput) || 0,
      wasteQty: Number(wasteOutput) || 0,
      packagerName: packagerName.trim(),
      expiryDate,
      photoUrl: packagingPhoto,
    });

    toast.success(`Packaging finalized! System assigned Lot: ${fgLot}`);
    refreshData();
  };

  // Final Stock In (Step 8)
  const handleAddBatchToInventory = () => {
    if (!selectedBatch) return;
    productionStorage.addBatchToInventory(selectedBatch.batchId);
    toast.success("Batch successfully stocked into Finished Goods Inventory!");
    refreshData();
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size cannot exceed 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ==========================================
  // INVENTORY MANAGER VIEW: Material Request & Material Issued
  // ==========================================
  // INVENTORY MANAGER VIEW: Material Request & Material Issued
  // ==========================================
  if (isInventoryManager) {
    const allMRs = productionStorage.getMaterialRequests();
    const q = mrSearchQuery.toLowerCase().trim();

    const filteredMRs = allMRs.filter((m) => {
      const matchesSearch =
        !q ||
        m.mrId.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q) ||
        m.productName.toLowerCase().includes(q) ||
        m.recipeName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const hasShortfall = m.items.some((i) => i.isShortfall);
      if (mrStockFilter === "Sufficient") return !hasShortfall;
      if (mrStockFilter === "Shortfall") return hasShortfall;
      return true;
    });

    const pendingMRs = filteredMRs.filter((m) => m.status === "Pending" || m.status === "Ready to Issue");
    const issuedMRs = filteredMRs.filter((m) => m.status === "Issued");
    const activeMR = allMRs.find((m) => m.mrId === selectedMRId);

    return (
      <div className="space-y-6">
        {/* Top Header matching Resources & Suppliers / PR Tab */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">View Material Requests</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review kitchen requisitions, verify stock availability, and issue supplies
            </p>
          </div>
        </div>

        {/* Full-width Search Bar (Reference from Resources & Suppliers / SupplyTab) */}
        <div className="border border-border rounded-md overflow-hidden bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-muted/20">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                type="text"
                placeholder="Search by MR No, Batch No, Product Name, or Recipe..."
                value={mrSearchQuery}
                onChange={(e) => setMrSearchQuery(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-8 p-0 text-sm flex-1 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Select value={mrStockFilter} onValueChange={setMrStockFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs bg-transparent border-input">
                  <SelectValue placeholder="All Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Stock Status</SelectItem>
                  <SelectItem value="Sufficient">Sufficient Stock</SelectItem>
                  <SelectItem value="Shortfall">Shortfall Detected</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground font-medium pl-1 hidden sm:inline">
                Showing {invMainTab === "requests" ? pendingMRs.length : issuedMRs.length} records
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Tabs styled exactly as screenshot 4 pill button tabs */}
        <div className="flex items-center">
          <div className="inline-flex p-1 rounded-xl border border-border bg-card shadow-xs gap-1">
            <button
              type="button"
              onClick={() => {
                setInvMainTab("requests");
                setSelectedMRId(null);
                setIsIssuanceMode(false);
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                invMainTab === "requests"
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Pending MR ({pendingMRs.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setInvMainTab("issued");
                setSelectedMRId(null);
                setIsIssuanceMode(false);
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                invMainTab === "issued"
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Material Issued ({issuedMRs.length})
            </button>
          </div>
        </div>

        {/* ── TAB 1: Material Requests ── */}
        {invMainTab === "requests" && (
          <div className="space-y-4">
            {!activeMR ? (
              /* PRTable reference styling: rounded-2xl border border-border bg-card shadow-sm min-h-[300px] */
              <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm min-h-[300px]">
                {pendingMRs.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-xs font-medium">
                    No pending material requests matching your search.
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">MR NUMBER</th>
                        <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">BATCH NUMBER</th>
                        <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PRODUCT NAME</th>
                        <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">RECIPE FORMULA</th>
                        <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">DATE NEEDED</th>
                        <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">STOCK STATUS</th>
                        <th className="px-4 py-3 text-center font-bold text-muted-foreground tracking-wider whitespace-nowrap w-32">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pendingMRs.map((mr) => {
                        const hasShortfall = mr.items.some((i) => i.isShortfall);
                        return (
                          <tr
                            key={mr.mrId}
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedMRId(mr.mrId);
                              setIsIssuanceMode(false);
                            }}
                          >
                            <td className="px-4 py-3.5 font-mono text-foreground whitespace-nowrap font-medium">
                              {mr.mrId}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-foreground whitespace-nowrap font-semibold">
                              {mr.batchNumber}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">
                              {mr.productName}
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                              {mr.recipeName}
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground font-mono whitespace-nowrap">
                              {new Date(mr.neededDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <StatusBadge status={hasShortfall ? "Shortfall" : "Approved"} />
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMRId(mr.mrId);
                                  setIsIssuanceMode(false);
                                }}
                                className="h-8 px-3 text-xs font-semibold bg-foreground text-background hover:bg-foreground/85 transition-colors rounded-lg shadow-xs cursor-pointer"
                              >
                                Review Request
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              /* Selected Request Review / Issuance View (Prominent View Material Request header card) */
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm space-y-6 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <button
                      onClick={() => {
                        setSelectedMRId(null);
                        setIsIssuanceMode(false);
                      }}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 cursor-pointer"
                    >
                      &larr; Back to Material Requests
                    </button>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-foreground">
                        View Material Request &mdash; {activeMR.mrId}
                      </h2>
                      <StatusBadge status={isIssuanceMode ? "In Progress" : activeMR.items.some((i) => i.isShortfall) ? "Shortfall" : "Approved"} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Batch: <strong className="text-foreground font-mono">{activeMR.batchNumber}</strong> &bull; Product: <strong className="text-foreground">{activeMR.productName}</strong> &bull; Recipe: {activeMR.recipeName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* If in stock check and has shortfall -> Create PR */}
                    {!isIssuanceMode && activeMR.items.some((i) => i.isShortfall) && (
                      <Button
                        size="sm"
                        onClick={() => setIsPROpen(true)}
                        className="h-9 px-4 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-xl shadow-xs cursor-pointer"
                      >
                        Create PR
                      </Button>
                    )}

                    {/* If in stock check and sufficient -> Proceed to Material Issuance */}
                    {!isIssuanceMode && !activeMR.items.some((i) => i.isShortfall) && (
                      <Button
                        size="sm"
                        onClick={() => setIsIssuanceMode(true)}
                        className="h-9 px-4 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-xl shadow-xs cursor-pointer"
                      >
                        Proceed to Material Issuance
                      </Button>
                    )}

                    {/* In Issuance Mode: Issue to Production button */}
                    {isIssuanceMode && (
                      <Button
                        disabled={!activeMR.items.every((i) => i.isScanned)}
                        onClick={() => handleIssueMaterials(activeMR.mrId)}
                        className="h-9 px-4 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-colors rounded-xl shadow-xs cursor-pointer"
                      >
                        Issue to Production
                      </Button>
                    )}
                  </div>
                </div>

                {/* Details Form Grid styled like PRDetailsModal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">MR Number</label>
                    <Input readOnly value={activeMR.mrId} className="h-9 font-mono text-xs bg-muted/40 cursor-not-allowed border-border" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Batch Number</label>
                    <Input readOnly value={activeMR.batchNumber} className="h-9 font-mono text-xs bg-muted/40 cursor-not-allowed border-border" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Product &amp; Recipe</label>
                    <Input readOnly value={`${activeMR.productName} (${activeMR.recipeName})`} className="h-9 text-xs bg-muted/40 cursor-not-allowed border-border" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Date Needed</label>
                    <Input readOnly value={new Date(activeMR.neededDate).toLocaleDateString()} className="h-9 font-mono text-xs bg-muted/40 cursor-not-allowed border-border" />
                  </div>
                </div>

                {/* Table of Materials styled like PRDetailsModal Requested Supplies Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">
                      Requested Supplies &amp; Ingredients
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {activeMR.items.length} ingredient(s) required
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-border bg-card">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border">
                        <tr>
                          <th className="px-4 py-3">Ingredient</th>
                          <th className="px-4 py-3">Required Qty</th>
                          <th className="px-4 py-3">Available Stock</th>
                          <th className="px-4 py-3">Stock Status</th>
                          {isIssuanceMode && <th className="px-4 py-3">Suggested Lot</th>}
                          {isIssuanceMode && <th className="px-4 py-3">Expiry Date</th>}
                          {isIssuanceMode && <th className="px-4 py-3 text-right">QR Scan Verification</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {activeMR.items.map((item) => (
                          <tr key={item.itemId} className="hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-foreground">
                              {item.itemName}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold">
                              {item.requiredQty} {item.uom}
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">
                              {item.availableStock} {item.uom}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                  item.isShortfall
                                    ? "bg-muted text-foreground border border-border font-bold"
                                    : "bg-foreground text-background"
                                }`}
                              >
                                {item.isShortfall ? "Shortfall" : "Sufficient"}
                              </span>
                            </td>
                            {isIssuanceMode && (
                              <td className="px-4 py-3 font-mono font-bold text-foreground">
                                {item.suggestedLot}
                              </td>
                            )}
                            {isIssuanceMode && (
                              <td className="px-4 py-3 text-muted-foreground font-mono">
                                {item.suggestedExpiry}
                              </td>
                            )}
                            {isIssuanceMode && (
                              <td className="px-4 py-3 text-right">
                                {item.isScanned ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                                    Verified ✓
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenScan(item)}
                                    className="h-7 px-3 text-xs font-semibold border-border hover:bg-muted cursor-pointer"
                                  >
                                    Scan
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Material Issued (Issued to Production) ── */}
        {invMainTab === "issued" && (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm min-h-[300px]">
            {issuedMRs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs font-medium">
                No issued material records found matching your search.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">MR NUMBER</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">BATCH NUMBER</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">PRODUCT NAME</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">RECIPE FORMULA</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">DATE ISSUED</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">ISSUED BY</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground tracking-wider whitespace-nowrap">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {issuedMRs.map((mr) => (
                    <tr key={mr.mrId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-medium text-foreground whitespace-nowrap">
                        {mr.mrId}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-foreground font-semibold whitespace-nowrap">
                        {mr.batchNumber}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">
                        {mr.productName}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{mr.recipeName}</td>
                      <td className="px-4 py-3.5 font-mono text-muted-foreground whitespace-nowrap">
                        {mr.issuedAt ? new Date(mr.issuedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        {mr.issuedBy || "Inventory Manager"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status="Issued" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* QR Scanner Modal */}
        {scanningItem && (
          <QrScannerModal
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
            itemName={scanningItem.itemName}
            suggestedLot={scanningItem.suggestedLot}
            onScanSuccess={handleScanSuccess}
          />
        )}

        {/* Purchase Requisition Modal for Shortfall */}
        <CreatePRModal
          open={isPROpen}
          onClose={() => setIsPROpen(false)}
          onSuccess={() => {
            setIsPROpen(false);
            toast.success("Purchase Requisition created for shortfall item!");
          }}
        />
      </div>
    );
  }

  // ==========================================
  // PRODUCTION TRACKING VIEW (Head Cook & Production)
  // ==========================================
  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* ── Left Sidebar: Slim / Minimized Active Batches ── */}
      <div className="lg:w-44 shrink-0 w-full">
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="px-3 py-2 border-b border-border bg-muted/20 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Batches ({activeBatches.length})
            </h3>
          </div>
          <div className="p-1.5 space-y-1.5 max-h-[75vh] overflow-y-auto">
            {activeBatches.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No active batches.
              </p>
            ) : (
              activeBatches.map((b) => {
                const step = getBatchStep(b);
                const progressPercent = Math.min(100, Math.round((step / 8) * 100));
                const isSelected = selectedBatchId === b.batchId;

                return (
                  <button
                    key={b.batchId}
                    type="button"
                    onClick={() => setSelectedBatchId(b.batchId)}
                    className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "border-foreground bg-foreground text-background shadow-xs"
                        : "border-border bg-card text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold">{b.batchNumber}</span>
                      <span
                        className={`text-[9px] font-semibold uppercase px-1 py-0.2 rounded ${
                          isSelected ? "bg-background text-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step}/8
                      </span>
                    </div>
                    <p className={`text-xs font-bold mt-0.5 truncate ${isSelected ? "text-background" : "text-foreground"}`}>
                      {b.productName}
                    </p>
                    <p className={`text-[10px] truncate ${isSelected ? "text-background/80" : "text-muted-foreground"}`}>
                      {b.variant} &bull; {b.targetYield} PCS
                    </p>

                    <div className="mt-1.5">
                      <div className={`w-full h-1 rounded-full overflow-hidden ${isSelected ? "bg-background/20" : "bg-muted"}`}>
                        <div
                          className={`h-full transition-all duration-300 ${isSelected ? "bg-background" : "bg-foreground"}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Wide Waterfall Process ── */}
      <div className="flex-1 w-full min-w-0">
        {!selectedBatch ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground text-xs">
            Select an active batch from the left to execute the waterfall stages.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-border bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold font-mono text-foreground">
                    {selectedBatch.batchNumber}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    &bull; {selectedBatch.productName}
                  </span>
                  <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded border border-border bg-muted">
                    {selectedBatch.variant}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target Yield: <strong className="text-foreground">{selectedBatch.targetYield} PCS</strong> &bull; Target Start Date: <span className="font-mono">{new Date(selectedBatch.scheduleDate).toLocaleDateString()}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-foreground text-background font-mono shadow-xs">
                  Step {currentStep} of 8: {selectedBatch.stage}
                </span>
              </div>
            </div>

            {/* Waterfall Horizontal Step Progress */}
            <div className="p-3 border-b border-border bg-muted/20 overflow-x-auto no-scrollbar">
              <div className="flex items-center min-w-max gap-1.5 text-xs">
                {[
                  "1. Request",
                  "2. BOM Selection",
                  "3. Material Request",
                  "4. Materials Issued",
                  "5. Cooking Stages",
                  "6. QA Review",
                  "7. Packaging",
                  "8. Stock In",
                ].map((stepLabel, idx) => {
                  const stepNum = idx + 1;
                  const isDone = currentStep > stepNum;
                  const isCurr = currentStep === stepNum;

                  return (
                    <div key={stepLabel} className="flex items-center gap-1.5">
                      <div
                        className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                          isDone
                            ? "bg-foreground text-background"
                            : isCurr
                            ? "border border-foreground bg-card text-foreground font-bold shadow-xs"
                            : "text-muted-foreground/60 opacity-60"
                        }`}
                      >
                        {stepLabel}
                      </div>
                      {idx < 7 && <span className="text-muted-foreground/40 text-xs">&rarr;</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage Body */}
            <div className="p-6 space-y-6">
              {/* ── STEP 1: Request Approved ── */}
              {currentStep === 1 && (
                <div className="p-6 rounded-xl border border-border bg-muted/10 space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      Step 1: Production Request Approved
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      This batch has been authorized by Admin. Proceed to select the Bill of Materials (BOM) recipe.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      productionStorage.startPreProduction(selectedBatch.batchId);
                      refreshData();
                    }}
                    className="h-9 px-4 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md shadow-xs cursor-pointer"
                  >
                    Select BOM Recipe
                  </Button>
                </div>
              )}

              {/* ── STEP 2: BOM Selection & Material Request ── */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      Step 2: Select BOM Recipe & Generate Material Request
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Select the standard recipe formula. Required quantities are calculated based on target yield: {selectedBatch.targetYield} PCS.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground mb-1.5 block">
                        Recipe / Bill of Materials (BOM)
                      </label>
                      <Select
                        value={selectedBomId.toString()}
                        onValueChange={(val) => setSelectedBomId(parseInt(val, 10))}
                      >
                        <SelectTrigger className="h-10 text-sm w-full bg-card border-border px-3 font-medium">
                          <SelectValue placeholder="Choose BOM Recipe" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border shadow-lg">
                          {AVAILABLE_BOMS.map((b) => (
                            <SelectItem key={b.recipeId} value={b.recipeId.toString()} className="text-sm py-2">
                              {b.recipeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground mb-1.5 block">
                        Date Required by Kitchen
                      </label>
                      <div className="w-full">
                        <Input
                          type="date"
                          value={neededDate}
                          onChange={(e) => setNeededDate(e.target.value)}
                          className="h-10 text-sm w-full bg-card border-border px-3 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BOM Ingredients Preview Table */}
                  <div className="border border-border rounded-xl overflow-hidden mt-3">
                    <div className="p-3.5 bg-muted/30 border-b border-border text-sm font-bold text-foreground">
                      Ingredients in Selected BOM Formula
                    </div>
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/20 text-muted-foreground uppercase text-xs border-b border-border">
                        <tr>
                          <th className="py-3 px-4">Ingredient</th>
                          <th className="py-3 px-4">Standard Yield</th>
                          <th className="py-3 px-4">Scaled Target Qty</th>
                          <th className="py-3 px-4">Available Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedBom.ingredients.map((ing) => {
                          const multiplier = selectedBatch.targetYield / selectedBom.outputYield;
                          const scaled = Math.round(ing.standardQty * multiplier * 10) / 10;
                          return (
                            <tr key={ing.itemId} className="hover:bg-muted/10">
                              <td className="py-3 px-4 font-semibold text-foreground">
                                {ing.itemName}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground">
                                {ing.standardQty} {ing.uom}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-foreground">
                                {scaled} {ing.uom}
                              </td>
                              <td className="py-3 px-4 font-mono text-muted-foreground">
                                {ing.stock} {ing.uom}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSubmitMR}
                      className="h-9 px-4 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md shadow-xs cursor-pointer"
                    >
                      Submit Material Request
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Material Request Dispatched (Waiting for Inventory) ── */}
              {currentStep === 3 && selectedBatch.materialRequest && (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-foreground">
                        Step 3: Material Request Dispatched ({selectedBatch.materialRequest.mrId})
                      </h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Dispatched to Inventory Manager for stock verification and QR lot scanning.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-foreground text-background">
                      {selectedBatch.materialRequest.status}
                    </span>
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/40 text-muted-foreground uppercase text-xs border-b border-border">
                        <tr>
                          <th className="py-3 px-4">Ingredient</th>
                          <th className="py-3 px-4">Required</th>
                          <th className="py-3 px-4">Assigned Lot</th>
                          <th className="py-3 px-4 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedBatch.materialRequest.items.map((item) => (
                          <tr key={item.itemId}>
                            <td className="py-3 px-4 font-semibold text-foreground">
                              {item.itemName}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {item.requiredQty} {item.uom}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-foreground">
                              {item.suggestedLot}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {item.isScanned ? (
                                <span className="text-xs font-semibold text-foreground">
                                  Verified ✓
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  Pending Scan
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Simulation Helper */}
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        selectedBatch.materialRequest?.items.forEach((item) => {
                          productionStorage.updateMRItemScan(
                            selectedBatch.materialRequest!.mrId,
                            item.itemId,
                            item.suggestedLot
                          );
                        });
                        productionStorage.issueMaterialsToProduction(selectedBatch.materialRequest!.mrId);
                        toast.success("Materials scanned and issued to production!");
                        refreshData();
                      }}
                      className="h-8 px-3 text-xs font-semibold border-border hover:bg-muted"
                    >
                      Simulate Verification & Issuance
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Materials Issued Confirmation ── */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg border border-border bg-muted/20">
                    <h4 className="text-xs font-bold text-foreground">
                      Step 4: Raw Materials Issued & Verified
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      All ingredients have been verified. Click below to begin cooking stages.
                    </p>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] border-b border-border">
                        <tr>
                          <th className="py-2 px-3">Supply Name</th>
                          <th className="py-2 px-3">Supplier Name</th>
                          <th className="py-2 px-3">Lot Number</th>
                          <th className="py-2 px-3">Expiry Date</th>
                          <th className="py-2 px-3 text-right">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedBatch.materialRequest?.items.map((item) => (
                          <tr key={item.itemId}>
                            <td className="py-2 px-3 font-semibold text-foreground">
                              {item.itemName}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">{item.supplierName}</td>
                            <td className="py-2 px-3 font-mono font-bold text-foreground">
                              {item.scannedLot || item.suggestedLot}
                            </td>
                            <td className="py-2 px-3 font-mono text-muted-foreground">
                              {item.suggestedExpiry}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                              {item.requiredQty} {item.uom}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => {
                        productionStorage.completeStage(
                          selectedBatch.batchId,
                          "Peeling",
                          isHeadCook ? "Head Cook" : "Elena",
                          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23333'/></svg>",
                          "Verified"
                        );
                        refreshData();
                      }}
                      className="h-8 px-3 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md shadow-xs cursor-pointer"
                    >
                      Start Production Stages
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 5: 6 Preparation & Cooking Stages (Waterfall) ── */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Step 5: Production Execution (Waterfall Stages)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Each stage strictly requires an operator name, photo upload, and timestamp before proceeding.
                    </p>
                  </div>

                  {/* Stage Progress Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {PREP_STAGES.map((s, idx) => {
                      const isCompleted = selectedBatch.stageLogs?.some(
                        (l) => l.stageName === s && l.completed
                      );
                      const isCurrentStage = selectedBatch.stage === s;

                      return (
                        <div
                          key={s}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            isCompleted
                              ? "border-border bg-foreground text-background"
                              : isCurrentStage
                              ? "border-foreground bg-card text-foreground font-bold shadow-xs"
                              : "border-border bg-muted/20 text-muted-foreground/60 opacity-60"
                          }`}
                        >
                          <span className="text-[9px] block uppercase font-semibold">
                            Stage {idx + 1}
                          </span>
                          <span className="text-xs font-bold block">{s}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current Active Stage Form */}
                  {PREP_STAGES.includes(selectedBatch.stage as any) && (
                    <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <h5 className="text-xs font-bold text-foreground">
                          Active Stage: {selectedBatch.stage}
                        </h5>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1 block">
                            Operator In-Charge <span className="text-foreground">*</span>
                          </label>
                          <Input
                            placeholder="Operator name..."
                            value={stageInCharge}
                            onChange={(e) => setStageInCharge(e.target.value)}
                            className="h-9 text-xs"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1 block">
                            Stage Notes
                          </label>
                          <Input
                            placeholder="Observations, temperature..."
                            value={stageNotes}
                            onChange={(e) => setStageNotes(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      {/* Photo Upload */}
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">
                          Stage Completion Photo <span className="text-foreground">*</span>
                        </label>
                        <input
                          type="file"
                          ref={stageFileInputRef}
                          onChange={(e) => handlePhotoUpload(e, setStagePhoto)}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-lg border border-border bg-card overflow-hidden flex items-center justify-center shrink-0">
                            {stagePhoto ? (
                              <img src={stagePhoto} alt="Stage Proof" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] text-muted-foreground">No Photo</span>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => stageFileInputRef.current?.click()}
                                className="h-8 text-xs font-semibold border-border hover:bg-muted"
                              >
                                {stagePhoto ? "Change Photo" : "Upload Photo"}
                              </Button>
                              {!stagePhoto && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setStagePhoto(
                                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23222'/><text x='50%25' y='50%25' fill='%23fff' dominant-baseline='middle' text-anchor='middle'>Stage Verified</text></svg>"
                                    )
                                  }
                                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Use Demo Snapshot
                                </Button>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Photo saved directly in database.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={() =>
                            handleCompleteCurrentStage(selectedBatch.stage as typeof PREP_STAGES[number])
                          }
                          className="h-8 px-3 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md shadow-xs cursor-pointer"
                        >
                          Complete {selectedBatch.stage}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 6: Quality Assurance (QA) Checklist ── */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-foreground">
                      Step 6: Quality Assurance (QA) Food Sensory Checklist
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Perform taste test and sensory checklist. Rejection will automatically log a Loss Report in the Loss tab.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {[
                      { label: "Overall Appearance", val: qaAppearance, set: setQaAppearance },
                      { label: "Aroma", val: qaAroma, set: setQaAroma },
                      { label: "Texture & Mouthfeel", val: qaTexture, set: setQaTexture },
                      { label: "Taste Test", val: qaTaste, set: setQaTaste },
                      { label: "Consistency", val: qaConsistency, set: setQaConsistency },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-lg border border-border bg-card space-y-2 text-xs">
                        <span className="font-semibold text-foreground block">{item.label}</span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => item.set("Pass")}
                            className={`w-full h-7 text-xs font-bold ${
                              item.val === "Pass"
                                ? "bg-foreground text-background"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Pass
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => item.set("Fail")}
                            className={`w-full h-7 text-xs font-bold ${
                              item.val === "Fail"
                                ? "bg-foreground text-background"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Fail
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">
                        QA Inspector Name <span className="text-foreground">*</span>
                      </label>
                      <Input
                        value={qaInspector}
                        onChange={(e) => setQaInspector(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">
                        Tasting Comments
                      </label>
                      <Input
                        placeholder="Sensory tasting notes..."
                        value={qaNotes}
                        onChange={(e) => setQaNotes(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectPrompt(true)}
                      className="h-8 px-3 text-xs font-semibold border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      Reject Batch
                    </Button>
                    <Button
                      onClick={handleQAApprove}
                      className="h-8 px-3 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md shadow-xs cursor-pointer"
                    >
                      Approve QA
                    </Button>
                  </div>

                  {showRejectPrompt && (
                    <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                      <p className="text-xs font-bold text-foreground">
                        Rejection Reason (Auto-generates Loss Report)
                      </p>
                      <Textarea
                        placeholder="State reason for rejection..."
                        value={qaRejectReason}
                        onChange={(e) => setQaRejectReason(e.target.value)}
                        className="text-xs resize-none"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRejectPrompt(false)}
                          className="h-8 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleQAReject}
                          className="h-8 px-3 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md shadow-xs cursor-pointer"
                        >
                          Confirm Rejection
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 7: Packaging ── */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Step 7: Packaging & Finished Goods Lot Allocation
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Review packaging materials, record actual output, and generate finished goods lot number.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4 font-mono text-xs">
                    <div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted-foreground uppercase font-sans font-bold">
                          Batch No:
                        </span>
                        <span className="font-bold text-foreground">{selectedBatch.batchNumber}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted-foreground uppercase font-sans font-bold">
                          Product:
                        </span>
                        <span className="font-bold text-foreground">{selectedBatch.productName}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted-foreground uppercase font-sans font-bold">
                          Packaging Size:
                        </span>
                        <span className="font-bold text-foreground">{selectedBatch.variant}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div>
                        <span className="text-muted-foreground uppercase font-sans font-semibold block text-[10px]">
                          Bulk Product Available
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {Math.round(selectedBatch.targetYield * 0.25)} KG
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase font-sans font-semibold block text-[10px]">
                          Target Output
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {selectedBatch.targetYield} PCS
                        </span>
                      </div>
                    </div>

                    {/* Packaging Materials Table */}
                    <div className="pt-2 border-t border-border">
                      <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Packaging Materials
                      </div>
                      <div className="space-y-1">
                        {[
                          { name: "Plastic Jar / Tub", required: selectedBatch.targetYield, available: selectedBatch.targetYield + 20, shortfall: false },
                          { name: "Lid Cap", required: selectedBatch.targetYield, available: selectedBatch.targetYield + 10, shortfall: false },
                          { name: "Brand Label", required: selectedBatch.targetYield, available: selectedBatch.targetYield, shortfall: false },
                          { name: "Heat Induction Seal", required: selectedBatch.targetYield, available: selectedBatch.targetYield - 20, shortfall: true },
                        ].map((mat) => (
                          <div
                            key={mat.name}
                            className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/30"
                          >
                            <span className="font-sans text-foreground">{mat.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground">
                                {mat.required} required
                              </span>
                              <span className="font-bold text-foreground">
                                {mat.available} available
                              </span>
                              {mat.shortfall ? (
                                <span className="text-foreground" title="Deficit">
                                  ⚠
                                </span>
                              ) : (
                                <span className="text-foreground text-[10px]">✓</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actual Output Form */}
                    <div className="pt-3 border-t border-border space-y-3 font-sans">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Actual Output
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1 block">
                            Good (PCS) <span className="text-foreground">*</span>
                          </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder={selectedBatch.targetYield.toString()}
                            value={goodOutput}
                            onChange={(e) =>
                              setGoodOutput(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                            }
                            className="h-9 text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1 block">
                            Damaged (PCS)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={damagedOutput}
                            onChange={(e) =>
                              setDamagedOutput(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                            }
                            className="h-9 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1 block">
                            Waste (PCS)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={wasteOutput}
                            onChange={(e) =>
                              setWasteOutput(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                            }
                            className="h-9 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1 block">
                            Packager Name <span className="text-foreground">*</span>
                          </label>
                          <Input
                            value={packagerName}
                            onChange={(e) => setPackagerName(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1 block">
                            Assigned Expiry Date <span className="text-foreground">*</span>
                          </label>
                          <Input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      {/* Photo Upload for Packaging */}
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">
                          Packaging Confirmation Photo
                        </label>
                        <input
                          type="file"
                          ref={packagingFileInputRef}
                          onChange={(e) => handlePhotoUpload(e, setPackagingPhoto)}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => packagingFileInputRef.current?.click()}
                            className="h-8 text-xs font-semibold border-border hover:bg-muted"
                          >
                            {packagingPhoto ? "Change Photo" : "Upload Photo"}
                          </Button>
                          {packagingPhoto && (
                            <span className="text-xs font-semibold text-foreground">
                              Photo Attached ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleCompletePackaging}
                      className="h-8 px-3 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md shadow-xs cursor-pointer"
                    >
                      Finalize Packaging
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 8: Stock In (Add to Inventory) ── */}
              {currentStep === 8 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                    <h4 className="text-xs font-bold text-foreground">
                      Step 8: Final Production Stock-In Review
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Production and packaging are completed. Click below to add the finished goods into the active Inventory module with the assigned Lot Number.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border border-border bg-card text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Finished Lot
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {selectedBatch.packagingData?.fgLotNumber || "LOT-FP-2026-001"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Stock Quantity
                        </span>
                        <span className="font-bold text-foreground">
                          {selectedBatch.packagingData?.goodQty || selectedBatch.targetYield} PCS
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Expiry Date
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {selectedBatch.packagingData?.expiryDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Packager
                        </span>
                        <span className="font-bold text-foreground">
                          {selectedBatch.packagingData?.packagerName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleAddBatchToInventory}
                      className="h-8 px-4 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md shadow-xs cursor-pointer"
                    >
                      Add to Inventory
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
