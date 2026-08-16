export type SupplyItem = {
  itemId: number;
  itemName: string;
  categoryName: string;
  uomId: number;
  uomName: string;
  minStockLevel: number;
  maxStockLevel: number;
  currentStock: number;
  isActive: boolean;
};

export type Supplier = {
  supplierId: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  isActive: boolean;
};

export type Ingredient = {
  id: number;
  itemId: number;
  itemName?: string;
  uomId: number;
  quantity: string;
};

export type Recipe = {
  recipeId: number;
  recipeName: string;
  finishedProduct: string;
  productId: number;
  outputQuantity: number;
  notes: string;
  isActive: boolean;
  ingredients: { itemId: number; standardQuantity: number }[];
};

export type FinishedProduct = {
  productId: number;
  itemName: string;
  variant?: string;
};

export type CategoryOption = {
  categoryId: number;
  categoryName: string;
};

export type UomOption = {
  uomId: number;
  uomName: string;
};
