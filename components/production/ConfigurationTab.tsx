"use client";

import React, { useState, useRef } from "react";
import { Search, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ConfigProduct, ConfigVariation } from "./types";
import { productionStorage } from "./productionStorage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";

const PRODUCT_CATEGORIES = [
  "Ube Halaya",
  "Jams & Spreads",
  "Pastes",
  "Baked Goods",
  "Beverages",
  "Other Delicacies",
];

const PACKAGING_TYPES = ["Tub", "Pack", "Jar", "Pouch", "Bottle", "Box", "Tin Can"];

export default function ConfigurationTab() {
  const [products, setProducts] = useState<ConfigProduct[]>(() =>
    productionStorage.getProducts()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Product Edit Modal state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ConfigProduct | null>(null);
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("Ube Halaya");
  const [productDescription, setProductDescription] = useState("");
  const [productIsActive, setProductIsActive] = useState(true);
  const [productImage, setProductImage] = useState<string>("");
  const [variationsList, setVariationsList] = useState<ConfigVariation[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Variation form inside modal
  const [newVarType, setNewVarType] = useState("Tub");
  const [newVarSize, setNewVarSize] = useState("250g");
  const [newVarSku, setNewVarSku] = useState("");
  const [newVarPrice, setNewVarPrice] = useState<number | "">(150);

  const refreshData = () => {
    setProducts(productionStorage.getProducts());
  };

  // Open Add Product
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductName("");
    setProductCategory("Ube Halaya");
    setProductDescription("");
    setProductIsActive(true);
    setProductImage("");
    setVariationsList([
      {
        id: `var-${Date.now()}`,
        productId: 0,
        sku: "UBH-TUB-250G",
        packagingType: "Tub",
        size: "250g",
        price: 150,
        isActive: true,
      },
    ]);
    setIsEditDialogOpen(true);
  };

  // Open Edit Product
  const handleOpenEditProduct = (prod: ConfigProduct) => {
    setEditingProduct(prod);
    setProductName(prod.name);
    setProductCategory(prod.category);
    setProductDescription(prod.description);
    setProductIsActive(prod.isActive);
    setProductImage(prod.imageUrl || "");
    setVariationsList([...prod.variations]);
    setIsEditDialogOpen(true);
  };

  // Image Upload handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file size exceeds 5MB limit");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVariationToProduct = () => {
    if (!newVarSku.trim() || newVarPrice === "") {
      toast.error("Please provide valid SKU and Price for the variation");
      return;
    }
    const newV: ConfigVariation = {
      id: `var-${Date.now()}`,
      productId: editingProduct?.productId || 0,
      sku: newVarSku.trim().toUpperCase(),
      packagingType: newVarType,
      size: newVarSize.trim(),
      price: Number(newVarPrice),
      isActive: true,
    };
    setVariationsList([...variationsList, newV]);
    setNewVarSku("");
    setNewVarPrice(150);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast.error("Product name is required");
      return;
    }

    productionStorage.saveProduct({
      id: editingProduct?.id,
      productId: editingProduct?.productId || 0,
      name: productName.trim(),
      category: productCategory,
      description: productDescription.trim(),
      isActive: productIsActive,
      imageUrl: productImage,
      variations: variationsList,
    });

    toast.success(editingProduct ? "Product updated successfully" : "Product created successfully");
    setIsEditDialogOpen(false);
    refreshData();
  };

  // Flattened records for single unified table view
  const flattenedRecords: { product: ConfigProduct; variation: ConfigVariation | null }[] = [];
  products.forEach((p) => {
    if (p.variations.length === 0) {
      flattenedRecords.push({ product: p, variation: null });
    } else {
      p.variations.forEach((v) => {
        flattenedRecords.push({ product: p, variation: v });
      });
    }
  });

  const filteredRecords = flattenedRecords.filter(({ product, variation }) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q) ||
      (variation && variation.sku.toLowerCase().includes(q)) ||
      (variation && variation.packagingType.toLowerCase().includes(q)) ||
      (variation && variation.size.toLowerCase().includes(q));

    const matchesCategory =
      categoryFilter === "All" || product.category === categoryFilter;

    const isRecActive = product.isActive && (variation?.isActive ?? true);
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && isRecActive) ||
      (statusFilter === "Inactive" && !isRecActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Finished Products Configuration</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure finished recipes, product sizes, SKUs, and packaging specs
          </p>
        </div>

        <Button
          onClick={handleOpenAddProduct}
          className="flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/85 transition-colors shadow-sm"
        >
          Add Product
        </Button>
      </div>

      {/* Full-width Search Bar (Reference from Resources & Suppliers / SupplyTab) */}
      <div className="border border-border rounded-md overflow-hidden bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-muted/20">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Search by product name, category, SKU, size, or packaging..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-8 p-0 text-sm flex-1 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 w-[180px] rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm focus:ring-1 focus:ring-ring">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {PRODUCT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[180px] rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm focus:ring-1 focus:ring-ring">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground font-medium pl-1 hidden sm:inline">
              Showing {filteredRecords.length} records
            </span>
          </div>
        </div>
      </div>

      {/* Table-only View */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            No products found matching "{searchQuery}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4 w-12">Photo</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Variant / Size</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Packaging</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map(({ product, variation }, idx) => (
                  <tr key={`${product.id}-${variation?.id || idx}`} className="hover:bg-muted/30 transition-colors">
                    {/* Thumbnail */}
                    <td className="py-2.5 px-4">
                      <div className="w-9 h-9 rounded-md border border-border bg-muted/30 overflow-hidden flex items-center justify-center shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                        )}
                      </div>
                    </td>

                    {/* Product Name */}
                    <td className="py-2.5 px-4 font-semibold text-foreground">
                      {product.name}
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {product.category}
                    </td>

                    {/* Variant / Size */}
                    <td className="py-2.5 px-4 font-medium text-foreground">
                      {variation ? variation.size : "Standard"}
                    </td>

                    {/* SKU */}
                    <td className="py-2.5 px-4 font-mono font-bold text-foreground">
                      {variation ? variation.sku : "—"}
                    </td>

                    {/* Packaging */}
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {variation ? variation.packagingType : "Standard"}
                    </td>

                    {/* Price */}
                    <td className="py-2.5 px-4 font-mono font-semibold text-foreground">
                      ₱{variation ? variation.price.toFixed(2) : "0.00"}
                    </td>

                    {/* StatusBadge */}
                    <td className="py-2.5 px-4">
                      <StatusBadge status={product.isActive && (variation?.isActive ?? true) ? "Active" : "Inactive"} />
                    </td>

                    {/* Actions: Edit button only (no delete) */}
                    <td className="py-2.5 px-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenEditProduct(product)}
                        className="h-7 px-3 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-md shadow-xs cursor-pointer"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Product Modal (Radix Dialog - Guaranteed Visible) ── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border p-6 shadow-2xl">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-base font-bold text-foreground">
              {editingProduct ? "Edit Finished Product" : "Add Finished Product"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure product details, recipe variations, SKU, and active status
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Product Name <span className="text-foreground">*</span>
              </label>
              <Input
                placeholder="e.g. Ube Halaya Supreme"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Product Category
              </label>
              <Select value={productCategory} onValueChange={setProductCategory}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Description
              </label>
              <Textarea
                placeholder="Formula notes, flavor characteristics..."
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="text-xs resize-none"
                rows={2}
              />
            </div>

            {/* Photo Upload / Change / Remove */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Product Photo
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg border border-border bg-muted/20 overflow-hidden flex items-center justify-center shrink-0">
                  {productImage ? (
                    <img src={productImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 text-xs font-semibold border-border hover:bg-muted"
                    >
                      {productImage ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {productImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setProductImage("")}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Stored directly in configuration records.
                  </p>
                </div>
              </div>
            </div>

            {/* Active / Inactive Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
              <div>
                <p className="text-xs font-semibold text-foreground">Product Active Status</p>
                <p className="text-[11px] text-muted-foreground">
                  Inactive products are hidden from new production requests
                </p>
              </div>
              <Switch checked={productIsActive} onCheckedChange={setProductIsActive} />
            </div>

            {/* Variations Editor List */}
            <div className="pt-2 border-t border-border">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                Configured Variations ({variationsList.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {variationsList.map((v, i) => (
                  <div
                    key={v.id || i}
                    className="flex items-center justify-between p-2 rounded border border-border bg-muted/20 text-xs gap-2"
                  >
                    <span className="font-mono font-bold text-foreground shrink-0">{v.sku}</span>
                    <span className="text-muted-foreground">{v.size} ({v.packagingType})</span>
                    <span className="font-mono font-semibold text-foreground">₱{v.price.toFixed(2)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setVariationsList(variationsList.filter((_, idx) => idx !== i));
                      }}
                      className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add new variation inline */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                <Select value={newVarType} onValueChange={setNewVarType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGING_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Size (e.g. 500g)"
                  value={newVarSize}
                  onChange={(e) => setNewVarSize(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="SKU"
                  value={newVarSku}
                  onChange={(e) => setNewVarSku(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariationToProduct}
                  className="h-8 text-xs font-semibold"
                >
                  Add Var
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="text-xs font-semibold border-border hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
