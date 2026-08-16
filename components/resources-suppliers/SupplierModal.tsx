"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ModalWrapper from "./ModalWrapper";
import { Supplier } from "./types";

interface SupplierModalProps {
  open: boolean;
  editingSupplier: Supplier | null;
  onClose: () => void;
  onSave: (data: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    website?: string;
    isActive: boolean;
  }) => void;
}

export default function SupplierModal({ open, editingSupplier, onClose, onSave }: SupplierModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [supplierActive, setSupplierActive] = useState(true);

  const [companyNameError, setCompanyNameError] = useState("");
  const [contactPersonError, setContactPersonError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    if (editingSupplier) {
      setCompanyName(editingSupplier.companyName || "");
      setContactPerson(editingSupplier.contactPerson || "");
      setEmail(editingSupplier.email || "");
      setPhone(editingSupplier.phone || "");
      setAddress(editingSupplier.address || "");
      setWebsite(editingSupplier.website || "");
      setSupplierActive(editingSupplier.isActive);
    } else {
      setCompanyName("");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setAddress("");
      setWebsite("");
      setSupplierActive(true);
    }
    setCompanyNameError("");
    setContactPersonError("");
    setEmailError("");
    setPhoneError("");
    setAddressError("");
  }, [editingSupplier, open]);

  const handleSave = () => {
    let isValid = true;
    if (!companyName.trim()) {
      setCompanyNameError("Supplier Name is required.");
      isValid = false;
    }
    if (!contactPerson.trim()) {
      setContactPersonError("Contact Person is required.");
      isValid = false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Valid email is required.");
      isValid = false;
    }
    if (!phone.trim()) {
      setPhoneError("Phone number is required.");
      isValid = false;
    }
    if (!address.trim()) {
      setAddressError("Address is required.");
      isValid = false;
    }

    if (!isValid) return;

    onSave({
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      website: website.trim() || undefined,
      isActive: supplierActive,
    });
  };

  return (
    <ModalWrapper open={open} title={editingSupplier ? "Edit Supplier" : "Add New Supplier"} onClose={onClose} size="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Supplier Name <span className="text-muted-foreground">*</span></label>
          <Input
            type="text"
            value={companyName}
            onChange={(e) => { setCompanyName(e.target.value); if (e.target.value.trim()) setCompanyNameError(""); }}
            placeholder="e.g. Acme Supplies Ltd."
            className={`w-full rounded-xl border ${companyNameError ? "border-red-500" : "border-border"} bg-card text-foreground px-4 py-2.5 text-sm`}
          />
          {companyNameError && <p className="mt-1 text-xs text-red-500">{companyNameError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Contact Person <span className="text-muted-foreground">*</span></label>
          <Input
            type="text"
            value={contactPerson}
            onChange={(e) => { setContactPerson(e.target.value); if (e.target.value.trim()) setContactPersonError(""); }}
            placeholder="e.g. John Doe"
            className={`w-full rounded-xl border ${contactPersonError ? "border-red-500" : "border-border"} bg-card text-foreground px-4 py-2.5 text-sm`}
          />
          {contactPersonError && <p className="mt-1 text-xs text-red-500">{contactPersonError}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Email <span className="text-muted-foreground">*</span></label>
            <Input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (e.target.value.trim()) setEmailError(""); }}
              placeholder="e.g. contact@acme.com"
              className={`w-full rounded-xl border ${emailError ? "border-red-500" : "border-border"} bg-card text-foreground px-4 py-2.5 text-sm`}
            />
            {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Phone No. <span className="text-muted-foreground">*</span></label>
            <Input
              type="text"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (e.target.value.trim()) setPhoneError(""); }}
              placeholder="e.g. +639XXXXXXXXX"
              className={`w-full rounded-xl border ${phoneError ? "border-red-500" : "border-border"} bg-card text-foreground px-4 py-2.5 text-sm`}
            />
            {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Address <span className="text-muted-foreground">*</span></label>
          <Input
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); if (e.target.value.trim()) setAddressError(""); }}
            placeholder="e.g. 123 Main St, Manila"
            className={`w-full rounded-xl border ${addressError ? "border-red-500" : "border-border"} bg-card text-foreground px-4 py-2.5 text-sm`}
          />
          {addressError && <p className="mt-1 text-xs text-red-500">{addressError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Website (Optional)</label>
          <Input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="e.g. www.acme.com" className="w-full rounded-xl border border-border bg-card text-foreground px-4 py-2.5 text-sm" />
        </div>

        {editingSupplier && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Status</label>
            <select value={supplierActive ? "true" : "false"} onChange={(e) => setSupplierActive(e.target.value === "true")} className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors">Cancel</Button>
          <Button type="button" onClick={handleSave} className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors">{editingSupplier ? "Save Changes" : "Create Supplier"}</Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
