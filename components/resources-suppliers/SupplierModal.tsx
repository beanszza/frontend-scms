"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ModalWrapper from "./ModalWrapper";
import { Supplier, SupplyItem } from "./types";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SupplierModalProps {
  open: boolean;
  editingSupplier: Supplier | null;
  baseSupplies: SupplyItem[];
  onClose: () => void;
  onSave: (data: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    website?: string;
    isActive: boolean;
    suppliedItemIds: number[];
  }) => void;
}

export default function SupplierModal({
  open,
  editingSupplier,
  baseSupplies,
  onClose,
  onSave,
}: SupplierModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [supplierActive, setSupplierActive] = useState(true);
  const [suppliedItemIds, setSuppliedItemIds] = useState<number[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);

  const [companyNameError, setCompanyNameError] = useState("");
  const [contactPersonError, setContactPersonError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [websiteError, setWebsiteError] = useState("");

  // Validation functions
  const validateCompanyName = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setCompanyNameError("Supplier Name is required.");
      return false;
    }
    if (trimmed.length < 2) {
      setCompanyNameError("Supplier Name must be at least 2 characters.");
      return false;
    }
    if (trimmed.length > 50) {
      setCompanyNameError("Supplier Name cannot exceed 50 characters.");
      return false;
    }
    setCompanyNameError("");
    return true;
  };

  const validateContactPerson = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setContactPersonError("Contact Person is required.");
      return false;
    }
    if (/\d/.test(val)) {
      setContactPersonError("Contact Person cannot contain numbers.");
      return false;
    }
    if (!/^[a-zA-Z\s\.\-']+$/.test(val)) {
      setContactPersonError("Contact Person can only contain letters and spaces.");
      return false;
    }
    if (trimmed.length < 2) {
      setContactPersonError("Contact Person must be at least 2 characters.");
      return false;
    }
    if (trimmed.length > 50) {
      setContactPersonError("Contact Person cannot exceed 50 characters.");
      return false;
    }
    setContactPersonError("");
    return true;
  };

  const validateEmail = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError("Email address is required.");
      return false;
    }
    // RFC 5322 compatible email regex accepting standard domains (gmail, yahoo, outlook, corporate domains)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address (e.g. supplier@gmail.com).");
      return false;
    }
    if (trimmed.length > 50) {
      setEmailError("Email cannot exceed 50 characters.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) {
      setPhoneError("Phone number is required.");
      return false;
    }
    // Philippine mobile: 10 digits starting with 9 (e.g. 9171234567)
    // PH landline: 7-8 digits
    const isMobile = /^9\d{9}$/.test(digits);
    const isLandline = /^[2-8]\d{6,7}$/.test(digits);

    if (!isMobile && !isLandline) {
      setPhoneError("Please enter a valid 10-digit mobile number (e.g. 917 123 4567).");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const validateAddress = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setAddressError("Address is required.");
      return false;
    }
    if (trimmed.length < 5) {
      setAddressError("Please enter a complete address (at least 5 characters).");
      return false;
    }
    if (trimmed.length > 100) {
      setAddressError("Address cannot exceed 100 characters.");
      return false;
    }
    setAddressError("");
    return true;
  };

  const validateWebsite = (val: string) => {
    const trimmed = val.trim();
    if (trimmed) {
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      if (!urlRegex.test(trimmed)) {
        setWebsiteError("Please enter a valid website URL (e.g. www.supplier.com).");
        return false;
      }
      if (trimmed.length > 50) {
        setWebsiteError("Website cannot exceed 50 characters.");
        return false;
      }
    }
    setWebsiteError("");
    return true;
  };

  useEffect(() => {
    if (open) {
      if (editingSupplier) {
        setCompanyName(editingSupplier.companyName || "");
        setContactPerson(editingSupplier.contactPerson || "");
        setEmail(editingSupplier.email || "");
        
        // Strip country code/leading 0 for clean display in +63 field
        let rawPhone = (editingSupplier.phone || "").trim();
        if (rawPhone.startsWith("+63")) {
          rawPhone = rawPhone.slice(3);
        } else if (rawPhone.startsWith("63") && rawPhone.length > 10) {
          rawPhone = rawPhone.slice(2);
        } else if (rawPhone.startsWith("0") && rawPhone.length === 11) {
          rawPhone = rawPhone.slice(1);
        }
        setPhone(rawPhone.replace(/\D/g, "").slice(0, 10));
        
        setAddress(editingSupplier.address || "");
        setWebsite(editingSupplier.website || "");
        setSupplierActive(editingSupplier.isActive !== false);
        setSuppliedItemIds(editingSupplier.suppliedItems?.map((s) => s.itemId) || []);
      } else {
        setCompanyName("");
        setContactPerson("");
        setEmail("");
        setPhone("");
        setAddress("");
        setWebsite("");
        setSupplierActive(true);
        setSuppliedItemIds([]);
      }
      setCompanyNameError("");
      setContactPersonError("");
      setEmailError("");
      setPhoneError("");
      setAddressError("");
      setWebsiteError("");
    }
  }, [editingSupplier, open]);

  // Input change handlers with instant real-time feedback
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 50);
    setCompanyName(val);
    validateCompanyName(val);
  };

  const handleContactPersonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip numeric digits immediately
    const cleanVal = e.target.value.replace(/[0-9]/g, "");
    const val = cleanVal.slice(0, 50);
    setContactPerson(val);
    validateContactPerson(val);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 50);
    setEmail(val);
    validateEmail(val);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.trim();
    // If pasted with +63, strip it
    if (raw.startsWith("+63")) raw = raw.slice(3);
    else if (raw.startsWith("63") && raw.length > 10) raw = raw.slice(2);
    // If started with 0 (e.g. 0917), strip leading 0
    if (raw.startsWith("0")) raw = raw.slice(1);
    
    // Only allow digits, max 10
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    validatePhone(digits);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 100);
    setAddress(val);
    validateAddress(val);
  };

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 50);
    setWebsite(val);
    validateWebsite(val);
  };

  const handleSave = () => {
    const v1 = validateCompanyName(companyName);
    const v2 = validateContactPerson(contactPerson);
    const v3 = validateEmail(email);
    const v4 = validatePhone(phone);
    const v5 = validateAddress(address);
    const v6 = validateWebsite(website);

    if (!v1 || !v2 || !v3 || !v4 || !v5 || !v6) return;

    const formattedPhone = phone.trim() ? `+63${phone.replace(/\D/g, "")}` : "";

    onSave({
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: formattedPhone,
      address: address.trim(),
      website: website.trim() || undefined,
      isActive: supplierActive,
      suppliedItemIds,
    });
  };

  const hasErrors =
    !!companyNameError ||
    !!contactPersonError ||
    !!emailError ||
    !!phoneError ||
    !!addressError ||
    !!websiteError ||
    !companyName.trim() ||
    !contactPerson.trim() ||
    !email.trim() ||
    !phone.trim() ||
    !address.trim();

  return (
    <ModalWrapper
      open={open}
      title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
      onClose={onClose}
      size="max-w-xl"
    >
      <div className="space-y-4">
        {/* Supplier Name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Supplier Name <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            maxLength={50}
            value={companyName}
            onChange={handleCompanyNameChange}
            placeholder="e.g. Acme Supplies Ltd."
            className={`w-full rounded-xl border ${
              companyNameError ? "border-red-500 focus-visible:ring-red-500" : "border-border"
            } bg-card text-foreground px-4 py-2.5 text-sm transition-colors`}
          />
          {companyNameError && (
            <p className="mt-1.5 text-xs font-medium text-red-500 animate-in fade-in-50">
              {companyNameError}
            </p>
          )}
        </div>

        {/* Contact Person */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Contact Person <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            maxLength={50}
            value={contactPerson}
            onChange={handleContactPersonChange}
            placeholder="e.g. John Doe"
            className={`w-full rounded-xl border ${
              contactPersonError ? "border-red-500 focus-visible:ring-red-500" : "border-border"
            } bg-card text-foreground px-4 py-2.5 text-sm transition-colors`}
          />
          {contactPersonError && (
            <p className="mt-1.5 text-xs font-medium text-red-500 animate-in fade-in-50">
              {contactPersonError}
            </p>
          )}
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              maxLength={50}
              value={email}
              onChange={handleEmailChange}
              placeholder="e.g. contact@supplier.com"
              className={`w-full rounded-xl border ${
                emailError ? "border-red-500 focus-visible:ring-red-500" : "border-border"
              } bg-card text-foreground px-4 py-2.5 text-sm transition-colors`}
            />
            {emailError && (
              <p className="mt-1.5 text-xs font-medium text-red-500 animate-in fade-in-50">
                {emailError}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Phone No. <span className="text-destructive">*</span>
            </label>
            <div
              className={`flex rounded-xl border ${
                phoneError
                  ? "border-red-500 focus-within:ring-1 focus-within:ring-red-500"
                  : "border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
              } bg-card overflow-hidden transition-colors`}
            >
              <div className="flex items-center justify-center bg-muted/60 px-3.5 border-r border-border text-xs font-semibold text-muted-foreground select-none">
                +63
              </div>
              <Input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={handlePhoneChange}
                placeholder="917 123 4567"
                className="w-full rounded-none border-0 bg-transparent text-foreground px-3.5 py-2.5 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            {phoneError && (
              <p className="mt-1.5 text-xs font-medium text-red-500 animate-in fade-in-50">
                {phoneError}
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Address <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            maxLength={100}
            value={address}
            onChange={handleAddressChange}
            placeholder="e.g. 123 Main St, Manila"
            className={`w-full rounded-xl border ${
              addressError ? "border-red-500 focus-visible:ring-red-500" : "border-border"
            } bg-card text-foreground px-4 py-2.5 text-sm transition-colors`}
          />
          {addressError && (
            <p className="mt-1.5 text-xs font-medium text-red-500 animate-in fade-in-50">
              {addressError}
            </p>
          )}
        </div>

        {/* Website (Optional) */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Website (Optional)
          </label>
          <Input
            type="text"
            maxLength={50}
            value={website}
            onChange={handleWebsiteChange}
            placeholder="e.g. www.acme.com"
            className={`w-full rounded-xl border ${
              websiteError ? "border-red-500 focus-visible:ring-red-500" : "border-border"
            } bg-card text-foreground px-4 py-2.5 text-sm transition-colors`}
          />
          {websiteError && (
            <p className="mt-1.5 text-xs font-medium text-red-500 animate-in fade-in-50">
              {websiteError}
            </p>
          )}
        </div>

        {/* Status (when editing) */}
        {editingSupplier && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Status
            </label>
            <select
              value={supplierActive ? "true" : "false"}
              onChange={(e) => setSupplierActive(e.target.value === "true")}
              className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}

        {/* Supplied Items Dropdown */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Supplied Items</label>
            <span className="text-[11px] text-muted-foreground">
              {baseSupplies?.length || 0} items available
            </span>
          </div>
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between rounded-xl border-border bg-card text-foreground font-normal hover:bg-muted"
              >
                {suppliedItemIds.length === 0
                  ? "Select items..."
                  : `${suppliedItemIds.length} item${suppliedItemIds.length === 1 ? "" : "s"} selected`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0 z-[100000]"
              align="start"
              sideOffset={4}
            >
              <Command>
                <CommandInput placeholder="Search supplies..." />
                <CommandList>
                  <CommandEmpty>No supplies found in inventory.</CommandEmpty>
                  <CommandGroup>
                    {baseSupplies?.map((item) => (
                      <CommandItem
                        key={item.itemId}
                        value={`${item.itemCode || ""} ${item.itemName}`}
                        onSelect={() => {
                          setSuppliedItemIds((prev) =>
                            prev.includes(item.itemId)
                              ? prev.filter((id) => id !== item.itemId)
                              : [...prev, item.itemId]
                          );
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            suppliedItemIds.includes(item.itemId) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {item.itemCode ? `${item.itemCode} - ` : ""}
                        {item.itemName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {suppliedItemIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {suppliedItemIds.map((id) => {
                const supply = baseSupplies?.find((s) => s.itemId === id);
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="rounded-md px-2 py-1 flex items-center gap-1 bg-muted"
                  >
                    {supply?.itemCode ? `${supply.itemCode} - ` : ""}
                    {supply?.itemName}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors"
                      onClick={() => setSuppliedItemIds((prev) => prev.filter((prevId) => prevId !== id))}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={hasErrors}
            onClick={handleSave}
            className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingSupplier ? "Save Changes" : "Create Supplier"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

