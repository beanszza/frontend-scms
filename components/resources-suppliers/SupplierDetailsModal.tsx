"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ModalWrapper from "./ModalWrapper";
import { Supplier } from "./types";
import api from "@/lib/api";
import { ShieldCheck, AlertCircle, FileCheck, Package, Clock, CheckCircle2, XCircle } from "lucide-react";

interface SupplierDoc {
  documentId: number;
  documentType: string;
  documentNumber: string;
  title: string;
  issueDate: string;
  expiryDate: string | null;
  isVerified: boolean;
  verifiedBy: string | null;
  status: string;
  isExpired: boolean;
  daysUntilExpiry: number | null;
}

interface ComplianceSummary {
  hasValidFdaLto: boolean;
  hasValidSanitaryPermit: boolean;
  isFullyCompliant: boolean;
  totalDocumentsCount: number;
  expiredDocumentsCount: number;
  documents: SupplierDoc[];
}

interface CatalogItem {
  itemId: number;
  itemName: string;
  supplierSku: string | null;
  unitPrice: number;
  currency: string;
  purchaseUomName: string;
  packSize: number;
  leadTimeDays: number;
  isPreferred: boolean;
}

interface SupplierDetailsModalProps {
  supplier: Supplier | null;
  onClose: () => void;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export default function SupplierDetailsModal({
  supplier,
  onClose,
}: SupplierDetailsModalProps) {
  const [compliance, setCompliance] = useState<ComplianceSummary | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supplier) {
      setCompliance(null);
      setCatalog([]);
      return;
    }

    const loadDetails = async () => {
      setLoading(true);
      try {
        const [compRes, catRes] = await Promise.allSettled([
          api.get(`/api/scms/api/SupplierDocuments/compliance-summary/${supplier.supplierId}`).catch(() =>
            api.get(`/api/SupplierDocuments/compliance-summary/${supplier.supplierId}`)
          ),
          api.get(`/api/scms/api/SupplierItems/by-supplier/${supplier.supplierId}`).catch(() =>
            api.get(`/api/SupplierItems/by-supplier/${supplier.supplierId}`)
          ),
        ]);

        if (compRes.status === "fulfilled" && compRes.value?.data?.success) {
          setCompliance(compRes.value.data.data);
        }
        if (catRes.status === "fulfilled" && catRes.value?.data?.success) {
          setCatalog(catRes.value.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load supplier compliance/catalog", err);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [supplier]);

  if (!supplier) return null;

  return (
    <ModalWrapper
      open={!!supplier}
      title={`Supplier Profile - ${supplier.companyName}`}
      onClose={onClose}
      size="max-w-3xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                supplier.isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-muted/40 text-muted-foreground border border-border"
              }`}
            >
              {supplier.isActive ? "Active Vendor" : "Inactive"}
            </span>

            {compliance && (
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  compliance.isFullyCompliant
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                {compliance.isFullyCompliant ? (
                  <>
                    <ShieldCheck size={13} /> Fully FDA Compliant
                  </>
                ) : (
                  <>
                    <AlertCircle size={13} /> Pending Compliance Permits
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4 text-xs">
          <div>
            <p className="font-semibold text-muted-foreground">Contact Person</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{supplier.contactPerson}</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground">Email Address</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{supplier.email}</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground">Phone Number</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{supplier.phone}</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground">Physical Address</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{supplier.address}</p>
          </div>
        </div>

        {/* Regulatory & Compliance Documents */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <FileCheck size={16} className="text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Regulatory Permits & Quality Assurance Documents
              </h3>
            </div>
            {compliance && (
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  FDA LTO:{" "}
                  {compliance.hasValidFdaLto ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <XCircle size={13} className="text-rose-500" />
                  )}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  Sanitary Permit:{" "}
                  {compliance.hasValidSanitaryPermit ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <XCircle size={13} className="text-rose-500" />
                  )}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-muted-foreground">Loading documents...</div>
          ) : !compliance || compliance.documents.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No regulatory documents registered for this supplier.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-[11px]">
                    <th className="px-2.5 py-2 text-left">DOCUMENT TYPE</th>
                    <th className="px-2.5 py-2 text-left">PERMIT / REG NO.</th>
                    <th className="px-2.5 py-2 text-left">ISSUE DATE</th>
                    <th className="px-2.5 py-2 text-left">EXPIRY DATE</th>
                    <th className="px-2.5 py-2 text-left">VERIFICATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {compliance.documents.map((doc) => (
                    <tr key={doc.documentId} className="hover:bg-muted/20">
                      <td className="px-2.5 py-2.5 font-semibold text-foreground">{doc.documentType}</td>
                      <td className="px-2.5 py-2.5 font-mono text-muted-foreground">{doc.documentNumber}</td>
                      <td className="px-2.5 py-2.5 text-muted-foreground">{formatDate(doc.issueDate)}</td>
                      <td className="px-2.5 py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                            doc.isExpired
                              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                              : doc.daysUntilExpiry && doc.daysUntilExpiry <= 30
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "text-emerald-600 font-medium"
                          }`}
                        >
                          {formatDate(doc.expiryDate)} {doc.isExpired ? "(Expired)" : ""}
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5">
                        {doc.isVerified ? (
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Pending Review</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Catalog Items Supplied */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Package size={16} className="text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Catalog Items Supplied & Contracted Prices
            </h3>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-muted-foreground">Loading catalog...</div>
          ) : catalog.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No catalog items linked to this supplier.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-[11px]">
                    <th className="px-2.5 py-2 text-left">ITEM NAME</th>
                    <th className="px-2.5 py-2 text-left">VENDOR SKU</th>
                    <th className="px-2.5 py-2 text-left">UNIT PRICE</th>
                    <th className="px-2.5 py-2 text-left">PACK SIZE</th>
                    <th className="px-2.5 py-2 text-left">LEAD TIME</th>
                    <th className="px-2.5 py-2 text-left">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {catalog.map((ci) => (
                    <tr key={ci.itemId} className="hover:bg-muted/20">
                      <td className="px-2.5 py-2.5 font-semibold text-foreground">{ci.itemName}</td>
                      <td className="px-2.5 py-2.5 font-mono text-muted-foreground">{ci.supplierSku || "-"}</td>
                      <td className="px-2.5 py-2.5 font-bold text-foreground">
                        ₱{ci.unitPrice.toFixed(2)} / {ci.purchaseUomName}
                      </td>
                      <td className="px-2.5 py-2.5 text-muted-foreground">
                        {ci.packSize > 1 ? `${ci.packSize} units/pack` : "Standard"}
                      </td>
                      <td className="px-2.5 py-2.5 text-muted-foreground flex items-center gap-1 mt-2">
                        <Clock size={11} /> {ci.leadTimeDays} days
                      </td>
                      <td className="px-2.5 py-2.5">
                        {ci.isPreferred && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                            ★ Preferred
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            Close
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
