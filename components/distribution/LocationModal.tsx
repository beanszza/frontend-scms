"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ModalWrapper from "@/components/resources-suppliers/ModalWrapper";
import { LocationItem } from "./types";

interface LocationModalProps {
  open: boolean;
  editingLocation: LocationItem | null;
  onClose: () => void;
  onSave: (data: { name: string; type: string; address: string; isActive: boolean }) => void;
}

export default function LocationModal({
  open,
  editingLocation,
  onClose,
  onSave,
}: LocationModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Warehouse");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (editingLocation) {
      setName(editingLocation.name || "");
      setType(editingLocation.type || "Warehouse");
      setAddress(editingLocation.address || "");
      setIsActive(editingLocation.status === "Active");
    } else {
      setName("");
      setType("Warehouse");
      setAddress("");
      setIsActive(true);
    }
    setNameError("");
  }, [editingLocation, open]);

  const handleSave = () => {
    if (!name.trim()) {
      setNameError("Location name is required.");
      return;
    }
    onSave({ name: name.trim(), type, address: address.trim(), isActive });
  };

  return (
    <ModalWrapper open={open} title={editingLocation ? "Edit Location" : "Add New Location"} onClose={onClose} size="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Location Name <span className="text-muted-foreground">*</span></label>
          <Input type="text" value={name} onChange={(e) => { setName(e.target.value); setNameError(""); }} placeholder="e.g. Main Distribution Hub" className="rounded-xl border border-border bg-card text-foreground text-sm" />
          {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Location Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-ring">
            <option value="Warehouse">Warehouse</option>
            <option value="Store Branch">Store Branch</option>
            <option value="Distribution Center">Distribution Center</option>
            <option value="Production Facility">Production Facility</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">Address</label>
          <Input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Logistics Way" className="rounded-xl border border-border bg-card text-foreground text-sm" />
        </div>

        {editingLocation && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Status</label>
            <select value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")} className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors">
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/85 transition-colors">
            {editingLocation ? "Save Changes" : "Create Location"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
