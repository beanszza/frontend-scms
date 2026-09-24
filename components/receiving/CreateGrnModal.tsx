"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import ConfirmModal from "@/components/ConfirmModal";
import api from "@/lib/api";
import { ArrivedDelivery, GRN, QAInspection } from "./types";

interface Props {
  open: boolean;
  initialDeliveryId?: number;
  onClose: () => void;
  onSuccess: (grn: GRN) => void;
}

interface ItemBatch {
  id: string;
  expiryDate: string;
  deliveredQuantity: number | "";
}

interface ItemRow {
  poItemId: number;
  deliveryItemId: number;
  itemId: number;
  itemName: string;
  categoryName: string;
  ordered: number;
  previous: number;
  declared: number;
  uom: string;
  batches: ItemBatch[];
}

interface QaItemRow {
  inspectionItemId: number;
  itemId: number;
  itemName: string;
  categoryName?: string;
  lotId?: number;
  deliveredQuantity: number;
  acceptedQuantity: number | "";
  rejectedQuantity: number | "";
  concessionQuantity: number;
  defectReason: string;
  notes: string;
  checks: Record<string, boolean>;
}

const rawMaterialChecks = [
  { id: "identity", label: "Material identity and approved specification match" },
  { id: "quantity", label: "Quantity, UOM, and pack size verified" },
  { id: "condition", label: "Freshness, appearance, packaging, and physical condition acceptable" },
  { id: "traceability", label: "Lot, label, manufacture date, and expiry checked" },
  { id: "safety", label: "Cleanliness, contamination, allergen, and foreign matter check passed" },
  { id: "documents", label: "COA, certificate, temperature, and storage requirements reviewed" },
];

const toolAndSupplyChecks = [
  { id: "identity", label: "Item identity, model, size, and approved specification match" },
  { id: "quantity", label: "Quantity, UOM, and pack count verified" },
  { id: "condition", label: "Item is undamaged, clean, and fit for use" },
  { id: "packaging", label: "Packaging and seals are intact where applicable" },
  { id: "safety", label: "Safety, hygiene, and contact-use requirements checked" },
  { id: "documents", label: "Certificate, warranty, expiry, or supplier document reviewed" },
];

const defectReasons = [
  "Expired / Insufficient Shelf Life",
  "Damaged Packaging / Torn Seal",
  "Contamination / Foreign Matter",
  "Temperature Abuse / Thawed",
  "Incorrect Product / Model",
  "Quality / Visual Defect",
  "Documentation Missing / Incomplete",
  "Quantity Shortage / Missing Units",
  "Other Quality Non-Conformance",
];

const receivingChecks = [
  ["physicalQuantityVerified", "Physical quantity verified"],
  ["itemsMatchPurchaseOrder", "Items match the PO"],
  ["supplierDocumentsChecked", "Supplier documents checked"],
  ["packagingConditionChecked", "Packaging / condition checked"],
] as const;

export default function CreateGrnModal({ open, initialDeliveryId, onClose, onSuccess }: Props) {
  // Stepper: Step 1 = Receiving & Physical Count; Step 2 = QA Inspection
  const [step, setStep] = useState<1 | 2>(1);

  const [deliveries, setDeliveries] = useState<ArrivedDelivery[]>([]);
  const [selected, setSelected] = useState<ArrivedDelivery | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [previewGrnNo, setPreviewGrnNo] = useState<string>("GRN-Pending");
  const [notes, setNotes] = useState("");

  // Step 1: Receiving Check checkboxes
  const [verified, setVerified] = useState<Record<string, boolean>>({
    physicalQuantityVerified: false,
    itemsMatchPurchaseOrder: false,
    supplierDocumentsChecked: false,
    packagingConditionChecked: false,
  });

  // Rejection dialog
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Confirmations
  const [confirmFinishGrnOpen, setConfirmFinishGrnOpen] = useState(false);

  // Step 2: QA state
  const [activeGrn, setActiveGrn] = useState<GRN | null>(null);
  const [qaInspection, setQaInspection] = useState<QAInspection | null>(null);
  const [qaItems, setQaItems] = useState<QaItemRow[]>([]);
  const [inspectorName, setInspectorName] = useState("");
  const [qaOverallNotes, setQaOverallNotes] = useState("");
  const [expandedQaItems, setExpandedQaItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError(null);
    setFieldErrors({});
    setItems([]);
    setSelected(null);
    setNotes("");
    setActiveGrn(null);
    setQaInspection(null);
    setQaItems([]);
    setInspectorName("");
    setQaOverallNotes("");
    setExpandedQaItems({});
    setShowRejectModal(false);
    setRejectionReason("");
    setConfirmFinishGrnOpen(false);
    setVerified({
      physicalQuantityVerified: false,
      itemsMatchPurchaseOrder: false,
      supplierDocumentsChecked: false,
      packagingConditionChecked: false,
    });

    api
      .get("/api/Deliveries?eligibleForGrn=true&pageSize=1000")
      .then(({ data }) => {
        const payload = data?.data;
        const list = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
        const arrived = list.filter((d: ArrivedDelivery) => d.status === "Arrived");
        setDeliveries(arrived);

        if (initialDeliveryId) {
          const target = arrived.find((d: ArrivedDelivery) => d.deliveryId === initialDeliveryId);
          if (target) loadSource(target);
        }
      })
      .catch(() => setError("Unable to load arrived deliveries. Please refresh and try again."));

    api
      .get("/api/GoodsReceipts")
      .then(({ data }) => {
        const allGrns: GRN[] = Array.isArray(data?.data) ? data.data : [];
        const year = new Date().getFullYear();
        const nextSeq = allGrns.length + 1;
        setPreviewGrnNo(`GRN-${year}-${String(nextSeq).padStart(4, "0")}`);
      })
      .catch(() => {
        const year = new Date().getFullYear();
        setPreviewGrnNo(`GRN-${year}-0001`);
      });
  }, [open, initialDeliveryId]);

  const loadSource = async (delivery: ArrivedDelivery) => {
    setSelected(delivery);
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      const [deliveryResult, poResult, itemsCatalogRes] = await Promise.all([
        api.get(`/api/Deliveries/${delivery.deliveryId}`),
        api.get(`/api/PurchaseOrders/${delivery.poId}`),
        api.get("/api/Items?pageSize=1000").catch(() => ({ data: { data: [] } })),
      ]);

      const catalogItems = Array.isArray(itemsCatalogRes.data?.data?.items)
        ? itemsCatalogRes.data.data.items
        : Array.isArray(itemsCatalogRes.data?.data)
        ? itemsCatalogRes.data.data
        : [];
      const categoryMap: Record<number, string> = {};
      catalogItems.forEach((catItem: any) => {
        if (catItem.itemId) {
          categoryMap[catItem.itemId] = catItem.categoryName || "";
        }
      });

      const poItems = poResult.data?.data?.items || [];
      const rows: ItemRow[] = (deliveryResult.data?.data?.items || []).map((line: any) => {
        const po = poItems.find((p: any) => p.poItemId === line.poItemId) || line;
        const declared = Number(line.declaredQuantity);
        const resolvedCategory =
          categoryMap[line.itemId] ||
          po.categoryName ||
          line.categoryName ||
          "Raw Materials";

        // Counts start empty so user fills them in
        return {
          poItemId: line.poItemId,
          deliveryItemId: line.deliveryItemId,
          itemId: line.itemId,
          itemName: line.itemName || `Item #${line.itemId}`,
          categoryName: resolvedCategory,
          ordered: Number(po.quantity ?? line.poOrderedQuantity ?? 0),
          previous: Number(po.receivedQuantity ?? line.poTotalReceivedQuantity ?? 0),
          declared,
          uom: line.purchaseUomName || line.uomName || "Unit",
          batches: [
            {
              id: `batch-${Date.now()}-${Math.random()}`,
              expiryDate: "",
              deliveredQuantity: "",
            },
          ],
        };
      });
      setItems(rows);
    } catch {
      setError("Unable to load delivery source lines.");
    } finally {
      setLoading(false);
    }
  };

  const updateBatchQuantity = (itemIndex: number, batchIndex: number, value: string) => {
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[`qty_${itemIndex}_${batchIndex}`];
      return copy;
    });
    setItems((current) =>
      current.map((item, i) => {
        if (i !== itemIndex) return item;
        const newBatches: ItemBatch[] = item.batches.map((b, bi) => {
          if (bi !== batchIndex) return b;
          const qty: number | "" = value.trim() === "" ? "" : Math.max(0, Number(value));
          return {
            ...b,
            deliveredQuantity: qty,
          };
        });
        return { ...item, batches: newBatches };
      })
    );
  };

  const updateBatchExpiry = (itemIndex: number, batchIndex: number, value: string) => {
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[`expiry_${itemIndex}_${batchIndex}`];
      return copy;
    });
    setItems((current) =>
      current.map((item, i) => {
        if (i !== itemIndex) return item;
        const newBatches = item.batches.map((b, bi) => {
          if (bi !== batchIndex) return b;
          return { ...b, expiryDate: value };
        });
        return { ...item, batches: newBatches };
      })
    );
  };

  const addBatch = (itemIndex: number) => {
    setItems((current) =>
      current.map((item, i) => {
        if (i !== itemIndex) return item;
        return {
          ...item,
          batches: [
            ...item.batches,
            {
              id: `batch-${Date.now()}-${Math.random()}`,
              expiryDate: "",
              deliveredQuantity: "",
            },
          ],
        };
      })
    );
  };

  const removeBatch = (itemIndex: number, batchIndex: number) => {
    setItems((current) =>
      current.map((item, i) => {
        if (i !== itemIndex) return item;
        if (item.batches.length <= 1) return item;
        return {
          ...item,
          batches: item.batches.filter((_, bi) => bi !== batchIndex),
        };
      })
    );
  };

  const getItemTotalActual = (item: ItemRow): number => {
    return item.batches.reduce((sum, b) => {
      const q = typeof b.deliveredQuantity === "number" ? b.deliveredQuantity : 0;
      return sum + q;
    }, 0);
  };

  // Variance is shown whenever ANY batch has a quantity — independent of expiry
  const hasAnyQty = (item: ItemRow): boolean => {
    return item.batches.some(
      (b) => b.deliveredQuantity !== "" && typeof b.deliveredQuantity === "number" && b.deliveredQuantity > 0
    );
  };

  // For proceed-to-QA: all batches need qty>0, AND expiry required for raw materials
  const isItemExpiryRequired = (item: ItemRow): boolean => {
    const isToolOrSupply =
      item.categoryName?.toLowerCase().includes("tool") ||
      item.categoryName?.toLowerCase().includes("suppl") ||
      item.categoryName?.toLowerCase().includes("equip");
    return !isToolOrSupply;
  };

  const isBatchValid = (b: ItemBatch, reqExpiry: boolean): boolean => {
    const hasQty =
      b.deliveredQuantity !== "" &&
      typeof b.deliveredQuantity === "number" &&
      !isNaN(b.deliveredQuantity) &&
      b.deliveredQuantity > 0;
    const hasExpiry = reqExpiry ? Boolean(b.expiryDate && b.expiryDate.trim()) : true;
    return hasQty && hasExpiry;
  };

  const isItemCounted = (item: ItemRow): boolean => {
    const reqExpiry = isItemExpiryRequired(item);
    return item.batches.length > 0 && item.batches.every((b) => isBatchValid(b, reqExpiry));
  };

  const isReadyForQa = Boolean(
    selected &&
      items.length > 0 &&
      items.every((item) => isItemCounted(item))
  );

  const rawMaterials = items.filter(
    (i) =>
      !i.categoryName?.toLowerCase().includes("tool") &&
      !i.categoryName?.toLowerCase().includes("suppl")
  );
  const toolsAndSupplies = items.filter(
    (i) =>
      i.categoryName?.toLowerCase().includes("tool") ||
      i.categoryName?.toLowerCase().includes("suppl")
  );

  // STEP 1 Action: Reject Entire Shipment at gate
  const handleRejectShipment = async () => {
    if (!selected) return;
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejecting the shipment.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const requestItems = items.flatMap((i) =>
        i.batches.map((b) => ({
          poItemId: i.poItemId,
          deliveryItemId: i.deliveryItemId,
          itemId: i.itemId,
          deliveredQuantity: Number(b.deliveredQuantity) || 0,
          expiryDate: b.expiryDate || undefined,
        }))
      );

      const { data: createData } = await api.post("/api/GoodsReceipts", {
        deliveryId: selected.deliveryId,
        notes: notes.trim() || undefined,
        ...verified,
        items: requestItems,
      });

      if (!createData?.success) {
        throw new Error(createData?.message || "Failed to initiate GRN for rejection.");
      }

      const createdGrn = createData.data;

      const { data: rejectData } = await api.post(`/api/GoodsReceipts/${createdGrn.grnId}/reject`, {
        reason: rejectionReason.trim(),
        notes: notes.trim() || undefined,
      });

      if (!rejectData?.success) {
        throw new Error(rejectData?.message || "Failed to record shipment rejection.");
      }

      onSuccess(rejectData.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to reject shipment.");
    } finally {
      setSubmitting(false);
      setShowRejectModal(false);
    }
  };

  // STEP 1 Action: Proceed to QA Step in same modal
  const executeProceedToQa = async () => {
    if (!selected) {
      setFieldErrors({ delivery: "Please select an arrived delivery." });
      return;
    }

    if (items.length === 0) {
      setError("No items found for this delivery.");
      return;
    }

    const errs: Record<string, string> = {};

    items.forEach((item, itemIdx) => {
      const reqExpiry = isItemExpiryRequired(item);
      item.batches.forEach((b, batchIdx) => {
        const hasQty =
          b.deliveredQuantity !== "" &&
          typeof b.deliveredQuantity === "number" &&
          !isNaN(b.deliveredQuantity) &&
          b.deliveredQuantity > 0;
        if (!hasQty) {
          errs[`qty_${itemIdx}_${batchIdx}`] = "Quantity required (> 0)";
        }
        if (reqExpiry && (!b.expiryDate || !b.expiryDate.trim())) {
          errs[`expiry_${itemIdx}_${batchIdx}`] = "Expiry date required";
        }
      });
    });

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Check if a GRN already exists for this delivery (handles retry after partial failure)
      let resolvedGrn: GRN | null = null;

      const existingGrnRes = await api.get(`/api/GoodsReceipts?deliveryId=${selected.deliveryId}`);
      const existingGrns: GRN[] = Array.isArray(existingGrnRes.data?.data) ? existingGrnRes.data.data : [];

      // Find a GRN that has already been posted (Received or later) for this delivery
      const postedGrn = existingGrns.find(
        (g) => g.deliveryId === selected.deliveryId && g.status !== "Draft" && g.status !== "Cancelled"
      );

      if (postedGrn) {
        // GRN was already posted — reuse it and skip creation
        resolvedGrn = postedGrn;
        setActiveGrn(postedGrn);
      } else {
        // Check for existing draft for this delivery
        const draftGrn = existingGrns.find(
          (g) => g.deliveryId === selected.deliveryId && g.status === "Draft"
        );

        let createdGrn: GRN;

        if (draftGrn) {
          // Reuse existing draft
          createdGrn = draftGrn;
        } else {
          // Create a new draft GRN
          const requestItems = items.flatMap((i) =>
            i.batches.map((b) => ({
              poItemId: i.poItemId,
              deliveryItemId: i.deliveryItemId,
              itemId: i.itemId,
              deliveredQuantity: Number(b.deliveredQuantity) || 0,
              expiryDate: b.expiryDate || undefined,
            }))
          );

          const { data: createData } = await api.post("/api/GoodsReceipts", {
            deliveryId: selected.deliveryId,
            notes: notes.trim() || undefined,
            ...verified,
            items: requestItems,
          });

          if (!createData?.success) {
            throw new Error(createData?.message || "Failed to create draft GRN.");
          }

          createdGrn = createData.data;
        }

        setActiveGrn(createdGrn);

        // Post the draft GRN
        const postResult = await api.post(`/api/GoodsReceipts/${createdGrn.grnId}/post`);
        if (!postResult.data?.success) {
          throw new Error(postResult.data?.message || "GRN saved as draft but failed to advance.");
        }

        resolvedGrn = postResult.data.data;
        setActiveGrn(resolvedGrn);
      }

      // Fetch or locate the QA inspection for this GRN
      const qaRes = await api.get(`/api/QualityInspections?grnId=${resolvedGrn!.grnId}`);
      const inspectionList: QAInspection[] = Array.isArray(qaRes.data?.data) ? qaRes.data.data : [];
      const inspection = inspectionList[0] || null;

      if (!inspection) {
        throw new Error("Unable to locate quality inspection record for this GRN.");
      }

      setQaInspection(inspection);

      const qaRows: QaItemRow[] = (inspection.items || []).map((qItem) => {
        const matchingSource = items.find((src) => src.itemId === qItem.itemId);
        // Fields start empty so user fills them in
        return {
          inspectionItemId: qItem.inspectionItemId,
          itemId: qItem.itemId,
          itemName: qItem.itemName || matchingSource?.itemName || `Item #${qItem.itemId}`,
          categoryName: matchingSource?.categoryName || "Raw Materials",
          lotId: qItem.lotId,
          deliveredQuantity: qItem.deliveredQuantity,
          acceptedQuantity: "",
          rejectedQuantity: "",
          concessionQuantity: 0,
          defectReason: "",
          notes: "",
          checks: Object.fromEntries(
            [...rawMaterialChecks, ...toolAndSupplyChecks].map((c) => [c.id, false])
          ),
        };
      });

      setQaItems(qaRows);
      setExpandedQaItems(Object.fromEntries(qaRows.map((r, i) => [r.inspectionItemId, i === 0])));
      setStep(2);
    } catch (err: any) {
      console.error("[Proceed to QA] Error:", err?.response?.data || err?.message || err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "An error occurred while proceeding to QA inspection."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 2 QA Handlers
  const getQaChecks = (item: QaItemRow) => {
    const isTool = /tool|suppl/i.test(item.categoryName || "");
    return isTool ? toolAndSupplyChecks : rawMaterialChecks;
  };

  const handleSetAccepted = (index: number, valStr: string) => {
    setQaItems((prev) => {
      const copy = [...prev];
      if (valStr === "") {
        copy[index] = { ...copy[index], acceptedQuantity: "" };
        return copy;
      }
      const num = Math.max(0, Math.min(copy[index].deliveredQuantity, Number(valStr)));
      copy[index] = {
        ...copy[index],
        acceptedQuantity: num,
        rejectedQuantity: copy[index].deliveredQuantity - num,
      };
      return copy;
    });
  };

  const handleSetRejected = (index: number, valStr: string) => {
    setQaItems((prev) => {
      const copy = [...prev];
      if (valStr === "") {
        copy[index] = { ...copy[index], rejectedQuantity: "" };
        return copy;
      }
      const num = Math.max(0, Math.min(copy[index].deliveredQuantity, Number(valStr)));
      copy[index] = {
        ...copy[index],
        rejectedQuantity: num,
        acceptedQuantity: copy[index].deliveredQuantity - num,
      };
      return copy;
    });
  };

  const toggleQaCheck = (itemIndex: number, checkId: string) => {
    setQaItems((prev) => {
      const copy = [...prev];
      const current = copy[itemIndex].checks[checkId] ?? false;
      copy[itemIndex] = {
        ...copy[itemIndex],
        checks: { ...copy[itemIndex].checks, [checkId]: !current },
      };
      return copy;
    });
  };

  const toggleCheckAll = (itemIndex: number) => {
    setQaItems((prev) => {
      const copy = [...prev];
      const item = copy[itemIndex];
      const available = getQaChecks(item);
      const allChecked = available.every((c) => item.checks[c.id]);
      const newChecks = { ...item.checks };
      available.forEach((c) => {
        newChecks[c.id] = !allChecked;
      });
      copy[itemIndex] = { ...item, checks: newChecks };
      return copy;
    });
  };

  const toggleExpandQaItem = (itemId: number) => {
    setExpandedQaItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Check if Step 2 QA is fully completed
  const isQaDone = Boolean(
    inspectorName.trim() &&
      qaItems.length > 0 &&
      qaItems.every((i) => {
        const hasAccepted = typeof i.acceptedQuantity === "number" && !isNaN(i.acceptedQuantity);
        const hasRejected = typeof i.rejectedQuantity === "number" && !isNaN(i.rejectedQuantity);
        if (!hasAccepted || !hasRejected) return false;
        if (Number(i.acceptedQuantity) + Number(i.rejectedQuantity) !== Number(i.deliveredQuantity)) return false;
        if (Number(i.rejectedQuantity) > 0 && !i.defectReason.trim()) return false;
        const availableChecks = getQaChecks(i);
        const allChecked = availableChecks.every((c) => i.checks[c.id]);
        return allChecked;
      })
  );

  // STEP 2 Action: Finish GRN (Complete QA)
  const executeFinishGrn = async () => {
    if (!qaInspection || !activeGrn || !isQaDone) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        overallNotes: qaOverallNotes.trim()
          ? `Inspector: ${inspectorName.trim()} | ${qaOverallNotes.trim()}`
          : `Inspector: ${inspectorName.trim()}`,
        items: qaItems.map((i) => ({
          inspectionItemId: i.inspectionItemId,
          itemId: i.itemId,
          lotId: i.lotId,
          deliveredQuantity: Number(i.deliveredQuantity),
          acceptedQuantity: Number(i.acceptedQuantity),
          rejectedQuantity: Number(i.rejectedQuantity),
          concessionQuantity: Number(i.concessionQuantity),
          defectReason: i.defectReason.trim() || undefined,
          notes: i.notes.trim() || undefined,
        })),
      };

      const res = await api.post(`/api/QualityInspections/${qaInspection.inspectionId}/complete`, payload);
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to complete QA inspection.");
      }

      const grnRes = await api.get(`/api/GoodsReceipts/${activeGrn.grnId}`);
      const finalGrn: GRN = grnRes.data?.data || activeGrn;

      onSuccess(finalGrn);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to complete GRN QA.");
    } finally {
      setSubmitting(false);
    }
  };

  // Printable Report Generation (Summary PDF)
  const handlePrintGrnReport = () => {
    if (!isQaDone) return;

    const style = document.createElement("style");
    style.id = "__grn-report-print-style";
    style.media = "print";
    style.innerHTML = `
      @media print {
        body > *:not(#grn-report-print-root) { display: none !important; }
        #grn-report-print-root { display: block !important; position: fixed; inset: 0; background: white; z-index: 99999; padding: 28px; color: black; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f4f4f5; font-weight: 700; font-size: 10px; text-transform: uppercase; }
      }
    `;
    document.head.appendChild(style);

    let printRoot = document.getElementById("grn-report-print-root");
    if (!printRoot) {
      printRoot = document.createElement("div");
      printRoot.id = "grn-report-print-root";
      document.body.appendChild(printRoot);
    }

    const grnNo = activeGrn?.grnNumber || previewGrnNo;
    const now = new Date().toLocaleString("en-PH");

    printRoot.innerHTML = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:16px">
          <div>
            <h1 style="font-size:20px;font-weight:900;margin:0;letter-spacing:-0.5px">GOODS RECEIPT &amp; QA REPORT</h1>
            <p style="font-size:11px;color:#555;margin:4px 0 0 0">Commissary Central Receiving &amp; Quality Control</p>
          </div>
          <div style="text-align:right">
            <div style="font-size:16px;font-weight:800;color:#000">${grnNo}</div>
            <div style="font-size:10px;color:#666">Printed: ${now}</div>
            <div style="display:inline-block;background:#e2e8f0;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;margin-top:4px">QA COMPLETED</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;background:#f8fafc;padding:12px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:16px;font-size:11px">
          <div><strong>Supplier:</strong> ${selected?.supplierName || "—"}</div>
          <div><strong>PO Number:</strong> ${selected?.poNumber || "—"}</div>
          <div><strong>Delivery No:</strong> ${selected?.deliveryNumber || "—"}</div>
          <div><strong>Inspector:</strong> ${inspectorName || "—"}</div>
        </div>

        <h3 style="font-size:12px;font-weight:800;text-transform:uppercase;margin:16px 0 8px 0;border-bottom:1px solid #ccc;padding-bottom:4px">
          Received Items &amp; Quality Inspection Verdict
        </h3>

        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align:right">Declared</th>
              <th style="text-align:right">Received</th>
              <th style="text-align:right">Accepted</th>
              <th style="text-align:right">Rejected</th>
              <th style="text-align:center">Expiry</th>
              <th>QA Status &amp; Notes</th>
            </tr>
          </thead>
          <tbody>
            ${qaItems
              .map((item) => {
                const source = items.find((s) => s.itemId === item.itemId);
                const expiry = source?.batches[0]?.expiryDate || "—";
                const isRejected = Number(item.rejectedQuantity) > 0;
                return `
                  <tr>
                    <td><strong>${item.itemName}</strong></td>
                    <td style="text-align:right">${source?.declared ?? item.deliveredQuantity}</td>
                    <td style="text-align:right"><strong>${item.deliveredQuantity}</strong></td>
                    <td style="text-align:right;font-weight:bold">${item.acceptedQuantity}</td>
                    <td style="text-align:right;font-weight:bold;color:${isRejected ? "#dc2626" : "#000"}">${item.rejectedQuantity}</td>
                    <td style="text-align:center">${expiry}</td>
                    <td>
                      ${isRejected ? `<span style="font-weight:bold">[REJECTED: ${item.defectReason || "Defect"}]</span> ` : `<span style="font-weight:bold">[PASSED]</span> `}
                      ${item.notes || ""}
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>

        ${
          qaOverallNotes
            ? `<div style="background:#f8fafc;padding:10px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:20px">
                <div><strong>Inspector Notes:</strong> ${qaOverallNotes}</div>
              </div>`
            : ""
        }

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:24px;margin-top:40px;padding-top:16px;border-top:1px solid #ccc">
          <div>
            <div style="font-size:10px;text-transform:uppercase;color:#666">Received &amp; Counted By:</div>
            <div style="margin-top:35px;border-bottom:1px solid #000;width:80%"></div>
            <div style="font-size:9px;color:#555;margin-top:4px">Warehouse Receiving Officer</div>
          </div>
          <div>
            <div style="font-size:10px;text-transform:uppercase;color:#666">Quality Inspected By:</div>
            <div style="margin-top:35px;border-bottom:1px solid #000;width:80%"></div>
            <div style="font-size:9px;color:#555;margin-top:4px">${inspectorName || "QA Specialist"}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:10px;text-transform:uppercase;color:#666">Acknowledged / Noted:</div>
            <div style="margin-top:35px;border-bottom:1px solid #000;width:80%;margin-left:auto"></div>
            <div style="font-size:9px;color:#555;margin-top:4px">Commissary Supervisor</div>
          </div>
        </div>
      </div>
    `;

    window.print();
    setTimeout(() => {
      style.remove();
      printRoot?.remove();
    }, 1000);
  };

  const renderItemTableSection = (groupItems: ItemRow[], title: string) => {
    if (groupItems.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            {title} ({groupItems.length})
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Item Description</th>
                <th className="px-3 py-3 text-right">Declared</th>
                <th className="px-3 py-3 text-right">Actual Received</th>
                <th className="px-3 py-3 text-center">Expiry Date <span className="text-destructive">*</span></th>
                <th className="px-3 py-3 text-center">Variance</th>
                <th className="px-3 py-3 text-right">Batch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {groupItems.map((item) => {
                const itemIndex = items.findIndex((i) => i.deliveryItemId === item.deliveryItemId);
                const actualTotal = getItemTotalActual(item);
                // Variance shows as soon as ANY qty is entered — independent of expiry date
                const hasQty = hasAnyQty(item);
                const variance = hasQty ? actualTotal - item.declared : null;

                return (
                  <React.Fragment key={item.deliveryItemId}>
                    <tr className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="font-semibold text-foreground">{item.itemName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.uom} {item.batches.length > 1 ? `· ${item.batches.length} Batches` : ""}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold">{item.declared}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.batches[0].deliveredQuantity === "" ? "" : item.batches[0].deliveredQuantity}
                            placeholder=""
                            onKeyDown={(e) => {
                              if (e.key === "-" || e.key === "e") e.preventDefault();
                            }}
                            onChange={(e) => updateBatchQuantity(itemIndex, 0, e.target.value)}
                            className={`w-24 rounded-xl border ${
                              fieldErrors[`qty_${itemIndex}_0`]
                                ? "!border-destructive text-destructive focus:!ring-destructive"
                                : "border-border"
                            } bg-background px-2.5 py-1.5 text-right font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground`}
                          />
                          {fieldErrors[`qty_${itemIndex}_0`] && (
                            <span className="text-[10px] text-destructive font-medium mt-0.5 whitespace-nowrap">
                              {fieldErrors[`qty_${itemIndex}_0`]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <input
                            type="date"
                            value={item.batches[0].expiryDate}
                            onChange={(e) => updateBatchExpiry(itemIndex, 0, e.target.value)}
                            className={`rounded-xl border ${
                              fieldErrors[`expiry_${itemIndex}_0`]
                                ? "!border-destructive text-destructive focus:!ring-destructive"
                                : "border-border"
                            } bg-background px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground`}
                          />
                          {fieldErrors[`expiry_${itemIndex}_0`] && (
                            <span className="text-[10px] text-destructive font-medium mt-0.5 whitespace-nowrap">
                              {fieldErrors[`expiry_${itemIndex}_0`]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-medium">
                        {variance === null ? (
                          <span className="text-muted-foreground/60 text-xs">—</span>
                        ) : variance === 0 ? (
                          <span className="font-semibold text-foreground text-xs">Match</span>
                        ) : variance < 0 ? (
                          <span className="text-destructive font-bold text-xs">
                            Short {Math.abs(variance)}
                          </span>
                        ) : (
                          <span className="text-destructive font-bold text-xs">
                            Over +{variance}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => addBatch(itemIndex)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
                        >
                          <Plus size={14} className="shrink-0" />
                          <span>Add Batch</span>
                        </button>
                      </td>
                    </tr>

                    {/* Additional Batch Rows */}
                    {item.batches.slice(1).map((batch, subIdx) => {
                      const batchIndex = subIdx + 1;
                      return (
                        <tr key={batch.id} className="bg-muted/15 border-t border-border/40">
                          <td className="px-4 py-2 pl-8 font-medium">
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                              <span>Batch #{batchIndex + 1}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-[11px] text-muted-foreground">—</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex flex-col items-end">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={batch.deliveredQuantity === "" ? "" : batch.deliveredQuantity}
                                placeholder=""
                                onKeyDown={(e) => {
                                  if (e.key === "-" || e.key === "e") e.preventDefault();
                                }}
                                onChange={(e) => updateBatchQuantity(itemIndex, batchIndex, e.target.value)}
                                className={`w-24 rounded-xl border ${
                                  fieldErrors[`qty_${itemIndex}_${batchIndex}`]
                                    ? "!border-destructive text-destructive focus:!ring-destructive"
                                    : "border-border"
                                } bg-background px-2.5 py-1.5 text-right font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-foreground`}
                              />
                              {fieldErrors[`qty_${itemIndex}_${batchIndex}`] && (
                                <span className="text-[10px] text-destructive font-medium mt-0.5 whitespace-nowrap">
                                  {fieldErrors[`qty_${itemIndex}_${batchIndex}`]}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex flex-col items-center">
                              <input
                                type="date"
                                value={batch.expiryDate}
                                onChange={(e) => updateBatchExpiry(itemIndex, batchIndex, e.target.value)}
                                className={`rounded-xl border ${
                                  fieldErrors[`expiry_${itemIndex}_${batchIndex}`]
                                    ? "!border-destructive text-destructive focus:!ring-destructive"
                                    : "border-border"
                                } bg-background px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground`}
                              />
                              {fieldErrors[`expiry_${itemIndex}_${batchIndex}`] && (
                                <span className="text-[10px] text-destructive font-medium mt-0.5 whitespace-nowrap">
                                  {fieldErrors[`expiry_${itemIndex}_${batchIndex}`]}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center text-xs text-muted-foreground">—</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeBatch(itemIndex, batchIndex)}
                              className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors focus:outline-none"
                              title="Remove Batch"
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <ModalWrapper
        open={open}
        title={
          step === 1
            ? "Create Goods Receipt Note (GRN)"
            : `Quality Assurance Inspection — ${activeGrn?.grnNumber || previewGrnNo}`
        }
        onClose={onClose}
        size="max-w-7xl"
      >
        <div className="space-y-4 text-foreground">
          {/* Top Assigned GRN Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                step === 1 ? "bg-foreground text-background" : "bg-muted text-foreground"
              }`}>
                <span>1</span>
                <span>Receiving &amp; Physical Count</span>
              </div>
              <span className="text-muted-foreground">›</span>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                step === 2 ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground"
              }`}>
                <span>2</span>
                <span>Quality Assurance Inspection</span>
              </div>
            </div>

            <div className="text-xs font-medium text-muted-foreground">
              Assigned GRN: <span className="font-mono font-bold text-foreground">{previewGrnNo}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-foreground flex items-start justify-between gap-3">
              <span className="whitespace-pre-line leading-relaxed">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-foreground font-bold text-xs hover:underline ml-2 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ================= STEP 1: RECEIVING CHECK & PHYSICAL COUNTS ================= */}
          {step === 1 && (
            <>
              {/* Delivery Selection */}
              <section className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Select Delivery <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={selected?.deliveryId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.delivery;
                        return copy;
                      });
                      if (!val) {
                        setSelected(null);
                        setItems([]);
                        setActiveGrn(null);
                        return;
                      }
                      const id = Number(val);
                      const target = deliveries.find((d) => d.deliveryId === id);
                      if (target) loadSource(target);
                    }}
                    className={`w-64 rounded-xl border ${
                      fieldErrors.delivery
                        ? "!border-destructive focus:!ring-destructive"
                        : "border-border"
                    } bg-card px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer`}
                  >
                    <option value="">Select Delivery</option>
                    {deliveries.map((d) => (
                      <option key={d.deliveryId} value={d.deliveryId}>
                        {d.deliveryNumber}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.delivery && (
                  <p className="mt-1.5 text-xs font-medium text-destructive animate-in fade-in-50">
                    {fieldErrors.delivery}
                  </p>
                )}

                {selected && (
                  <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Supplier</span>
                        <span className="font-semibold text-foreground">{selected.supplierName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Purchase Order</span>
                        <span className="font-semibold text-foreground">{selected.poNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Delivery Note</span>
                        <span className="font-semibold text-foreground">{selected.deliveryNumber}</span>
                      </div>
                      {selected.carrier && selected.carrier !== "N/A" && (
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground block">Carrier</span>
                          <span className="font-semibold text-foreground">{selected.carrier}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {!selected && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-2xl bg-muted/10">
                  <p className="text-sm font-semibold text-muted-foreground">No delivery selected</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Choose an arrived delivery above to enter physical counts.
                  </p>
                </div>
              )}

              {loading && (
                <div className="py-10 text-center text-xs text-muted-foreground animate-pulse">
                  Loading delivery items…
                </div>
              )}

              {selected && !loading && (
                <>
                  <section className="space-y-4">
                    <div>
                      <p className="text-sm font-bold text-foreground">Physical Count &amp; Expiry Verification</p>
                      <p className="text-xs text-muted-foreground">
                        Enter actual counts and expiry dates for each item. Click &quot;Add Batch&quot; on the right if received across multiple lots or expiry dates.
                      </p>
                    </div>

                    {renderItemTableSection(rawMaterials, "Raw Materials")}
                    {renderItemTableSection(toolsAndSupplies, "Tools and Supplies")}
                  </section>

                  {/* Receiving Checks Section */}
                  <section className="rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="mb-3 text-sm font-bold text-foreground">Receiving Check</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {receivingChecks.map(([key, label]) => (
                        <label
                          key={key}
                          className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium cursor-pointer hover:bg-muted/30 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={!!verified[key]}
                            onChange={(e) => setVerified((v) => ({ ...v, [key]: e.target.checked }))}
                            className="h-4 w-4 rounded border-border text-foreground accent-foreground"
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  {/* Receiving Notes */}
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-foreground">Receiving Gate Notes</span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                      placeholder="Document quantity differences, packaging condition, or gate inspection notes."
                    />
                  </label>
                </>
              )}

              {/* Step 1 Footer Action Buttons: Reference Add Suppliers modal buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  {selected && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowRejectModal(true)}
                      className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Reject Entire Shipment
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={submitting || !selected}
                    onClick={executeProceedToQa}
                    className="rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-semibold hover:bg-foreground/85 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {submitting ? "Proceeding…" : "Proceed to QA"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ================= STEP 2: EMBEDDED QA INSPECTION ================= */}
          {step === 2 && (
            <>
              {/* QA Inspector Header */}
              <div className="grid sm:grid-cols-2 gap-3 pb-2">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-foreground">Inspector Name <span className="text-destructive">*</span></span>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    placeholder="Enter name of quality inspector"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </label>
              </div>

              {/* Item QA Inspection Accordion List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Items to Inspect ({qaItems.length})
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Fill out accepted and rejected quantities for each item
                  </span>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {qaItems.map((qaItem, idx) => {
                    const checksList = getQaChecks(qaItem);
                    const allChecked = checksList.every((c) => qaItem.checks[c.id]);
                    const isExpanded = !!expandedQaItems[qaItem.inspectionItemId];

                    return (
                      <div
                        key={qaItem.inspectionItemId}
                        className="rounded-2xl border border-border bg-card overflow-hidden transition-colors"
                      >
                        {/* Accordion Header (Click to minimize / expand) */}
                        <div
                          onClick={() => toggleExpandQaItem(qaItem.inspectionItemId)}
                          className="flex items-center justify-between p-3.5 bg-muted/20 cursor-pointer hover:bg-muted/35 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm text-foreground">{qaItem.itemName}</span>
                            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {qaItem.categoryName || "Raw Material"}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-xs text-muted-foreground">
                              Delivered: <strong className="text-foreground">{qaItem.deliveredQuantity}</strong>
                            </div>
                            {typeof qaItem.acceptedQuantity === "number" && (
                              <div className="text-xs text-muted-foreground">
                                Acc: <strong className="text-foreground">{qaItem.acceptedQuantity}</strong>
                              </div>
                            )}
                            {typeof qaItem.rejectedQuantity === "number" && Number(qaItem.rejectedQuantity) > 0 && (
                              <div className="text-xs text-destructive font-bold">
                                Rej: {qaItem.rejectedQuantity}
                              </div>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Accordion Body */}
                        {isExpanded && (
                          <div className="p-4 space-y-3.5 border-t border-border/60">
                            {/* Checklist Section */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Verification Checks
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleCheckAll(idx)}
                                  className="text-[11px] font-semibold text-foreground hover:underline"
                                >
                                  {allChecked ? "Uncheck All" : "Check All"}
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {checksList.map((check) => (
                                  <label
                                    key={check.id}
                                    className="flex items-start gap-2 rounded-lg border border-border bg-card p-2 text-[11px] cursor-pointer hover:bg-muted/30 transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!!qaItem.checks[check.id]}
                                      onChange={() => toggleQaCheck(idx, check.id)}
                                      className="mt-0.5 h-3.5 w-3.5 rounded border-border text-foreground accent-foreground"
                                    />
                                    <span className="leading-tight">{check.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Quantity Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                              <label className="space-y-1">
                                <span className="text-xs font-semibold text-foreground block">
                                  Accepted Quantity <span className="text-destructive">*</span>
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max={qaItem.deliveredQuantity}
                                  value={qaItem.acceptedQuantity}
                                  placeholder=""
                                  onChange={(e) => handleSetAccepted(idx, e.target.value)}
                                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                                />
                              </label>

                              <label className="space-y-1">
                                <span className="text-xs font-semibold text-foreground block">
                                  Rejected Quantity <span className="text-destructive">*</span>
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max={qaItem.deliveredQuantity}
                                  value={qaItem.rejectedQuantity}
                                  placeholder=""
                                  onChange={(e) => handleSetRejected(idx, e.target.value)}
                                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                                />
                              </label>

                              {Number(qaItem.rejectedQuantity) > 0 ? (
                                <label className="space-y-1">
                                  <span className="text-xs font-semibold text-destructive block">
                                    Defect Reason <span className="text-destructive">*</span>
                                  </span>
                                  <select
                                    value={qaItem.defectReason}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setQaItems((prev) => {
                                        const c = [...prev];
                                        c[idx] = { ...c[idx], defectReason: val };
                                        return c;
                                      });
                                    }}
                                    className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                                  >
                                    <option value="">Select Reason</option>
                                    {defectReasons.map((r) => (
                                      <option key={r} value={r}>
                                        {r}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : (
                                <label className="space-y-1">
                                  <span className="text-xs font-semibold text-muted-foreground block">
                                    Item Notes
                                  </span>
                                  <input
                                    type="text"
                                    value={qaItem.notes}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setQaItems((prev) => {
                                        const c = [...prev];
                                        c[idx] = { ...c[idx], notes: val };
                                        return c;
                                      });
                                    }}
                                    placeholder="Optional remarks"
                                    className="w-full rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overall QA Notes moved to end */}
              <label className="block space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-foreground">Overall QA Notes</span>
                <textarea
                  value={qaOverallNotes}
                  onChange={(e) => setQaOverallNotes(e.target.value)}
                  rows={2}
                  placeholder="Record any general quality observations or inspection summary..."
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </label>

              {/* Step 2 Footer Actions: Buttons styled after SupplierModal, without logos */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Back to Receiving Counts
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!isQaDone || submitting}
                    onClick={handlePrintGrnReport}
                    className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Print GRN Report
                  </button>
                  <button
                    type="button"
                    disabled={!isQaDone || submitting}
                    onClick={() => setConfirmFinishGrnOpen(true)}
                    className="rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-semibold hover:bg-foreground/85 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {submitting ? "Finishing GRN…" : "Finish GRN"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </ModalWrapper>

      {/* Reject Entire Shipment Modal (Monochromatic theme matching resources & suppliers) */}
      {showRejectModal && (
        <ModalWrapper
          open={showRejectModal}
          title="Reject Entire Shipment"
          onClose={() => setShowRejectModal(false)}
          size="max-w-xl"
        >
          <div className="space-y-4 text-foreground">
            <p className="text-xs text-muted-foreground">
              Rejecting this shipment will mark the Goods Receipt Note as <strong>Rejected</strong> and automatically log Discrepancy records for every line item.
            </p>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Rejection Reason <span className="text-destructive">*</span></span>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
              >
                <option value="">Select Reason</option>
                <option value="Severe transit damage to cargo">Severe transit damage to cargo</option>
                <option value="Packaging compromised / contaminated">Packaging compromised / contaminated</option>
                <option value="Wrong products delivered altogether">Wrong products delivered altogether</option>
                <option value="Delivery documentation completely missing">Delivery documentation completely missing</option>
                <option value="Temperature compliance breached">Temperature compliance breached</option>
                <option value="Expired products on arrival">Expired products on arrival</option>
                <option value="Rejected by commissary gate supervisor">Rejected by commissary gate supervisor</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Detailed Remarks</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes or photos reference..."
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={submitting}
                className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || submitting}
                onClick={handleRejectShipment}
                className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {submitting ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}


      {/* Confirmation before Finish GRN */}
      {confirmFinishGrnOpen && (
        <ConfirmModal
          message={`Are you sure you want to complete QA inspection and finalize ${activeGrn?.grnNumber || previewGrnNo}?`}
          onConfirm={() => {
            setConfirmFinishGrnOpen(false);
            executeFinishGrn();
          }}
          onCancel={() => setConfirmFinishGrnOpen(false)}
        />
      )}
    </>
  );
}
