"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText } from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import { SupplyItem } from "./types";
import SupplyTable from "./SupplyTable";

interface SupplyTabProps {
  supplies: SupplyItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  isAuthorizedForReports: boolean;
  onAddNew: () => void;
  onEdit: (item: SupplyItem) => void;
  onView?: (item: SupplyItem) => void;
}

export default function SupplyTab({
  supplies,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  currentPage,
  onPageChange,
  isAuthorizedForReports,
  onAddNew,
  onEdit,
  onView,
}: SupplyTabProps) {
  const filteredSupplies = supplies.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.itemName.toLowerCase().includes(q) ||
      (item.itemCode ? item.itemCode.toLowerCase().includes(q) : false) ||
      item.itemId.toString().includes(q);
    const matchesCategory = categoryFilter === "All" || item.categoryName === categoryFilter;
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && item.isActive !== false) ||
      (statusFilter === "Inactive" && item.isActive === false);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const pageSize = 10;
  const totalCount = filteredSupplies.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedSupplies = filteredSupplies.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Supply List</h2>
          <p className="mt-1 text-sm text-muted-foreground">Raw materials and tools inventory</p>
        </div>
        <div className="flex items-center gap-3">
          {isAuthorizedForReports && (
            <Link
              href="/resources-suppliers/logs?type=Supply"
              className="flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <FileText size={16} /> Transaction History
            </Link>
          )}
          <Button
            onClick={onAddNew}
            className="flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add New Supply
          </Button>
        </div>
      </div>

      <div className="mb-6 border border-border rounded-md overflow-hidden bg-card">
        <div className="flex items-center justify-between gap-sm px-md py-sm bg-muted/20">
          <div className="flex items-center gap-sm flex-1">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Search by name or ID (e.g. SPL-0001)..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                onPageChange(1);
              }}
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-8 p-0 text-body-sm flex-1 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-sm shrink-0">
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                onCategoryFilterChange(val);
                onPageChange(1);
              }}
            >
              <SelectTrigger className="w-[150px] h-8 text-body-sm bg-transparent border-input">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                <SelectItem value="Tools and Supplies">Tools & Supplies</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                onStatusFilterChange(val);
                onPageChange(1);
              }}
            >
              <SelectTrigger className="w-[130px] h-8 text-body-sm bg-transparent border-input">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <SupplyTable
        items={paginatedSupplies}
        currentPage={currentPage}
        pageSize={pageSize}
        onEdit={onEdit}
        onView={onView}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={onPageChange}
      />
    </div>
  );
}
