"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  X,
  Trash2,
} from "lucide-react";

type SupplyItem = {
  id: number;
  name: string;
  category: "Raw Materials" | "Tools & Supplies";
  unit: string;
  minStock: number;
};

type Supplier = {
  id: number;
  supplierName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
};

type Ingredient = {
  id: number;
  material: string;
  quantity: string;
  unit: string;
};

type Recipe = {
  id: number;
  finishedProduct: string;
  outputQuantity: string;
  notes: string;
  ingredients: Ingredient[];
};

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(
        document.documentElement.classList.contains("dark")
      );

    check();

    const observer = new MutationObserver(check);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl overflow-y-auto max-h-[95vh] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const supplyData: SupplyItem[] = [
  {
    id: 1,
    name: "Ube (Purple Yam)",
    category: "Raw Materials",
    unit: "kg",
    minStock: 100,
  },
  {
    id: 2,
    name: "White Sugar",
    category: "Raw Materials",
    unit: "kg",
    minStock: 50,
  },
  {
    id: 3,
    name: "Condensed Milk",
    category: "Raw Materials",
    unit: "liters",
    minStock: 20,
  },
  {
    id: 4,
    name: "Mixing Bowl",
    category: "Tools & Supplies",
    unit: "pcs",
    minStock: 5,
  },
  {
    id: 5,
    name: "Spatula",
    category: "Tools & Supplies",
    unit: "pcs",
    minStock: 10,
  },
];

const supplierData: Supplier[] = [
  {
    id: 1,
    supplierName: "Manila Fresh Produce",
    contactPerson: "Juan Dela Cruz",
    email: "juan@gmail.com",
    phone: "+63 917 123 4567",
    status: "Active",
  },
];

const recipeData: Recipe[] = [
  {
    id: 1,
    finishedProduct: "Ube Halaya",
    outputQuantity: "1",
    notes: "Traditional recipe",
    ingredients: [
      {
        id: 1,
        material: "Ube (Purple Yam)",
        quantity: "0.5",
        unit: "kg",
      },
    ],
  },
];

export default function ResourcesSuppliersPage() {
  useDarkMode();

  const [activeTab, setActiveTab] = useState<
    "supply" | "supplier" | "recipe"
  >("supply");

  const [supplyFilter, setSupplyFilter] = useState<
    "All" | "Raw Materials" | "Tools & Supplies"
  >("All");

  const [openSupplyModal, setOpenSupplyModal] =
    useState(false);

  const [openSupplierModal, setOpenSupplierModal] =
    useState(false);

  const [openRecipeModal, setOpenRecipeModal] =
    useState(false);

  const [selectedSupply, setSelectedSupply] =
    useState<SupplyItem | null>(null);

  const filteredSupplies = useMemo(() => {
    if (supplyFilter === "All") {
      return supplyData;
    }

    return supplyData.filter(
      (item) => item.category === supplyFilter
    );
  }, [supplyFilter]);

  const [ingredients, setIngredients] = useState<
    Ingredient[]
  >([
    {
      id: 1,
      material: "",
      quantity: "",
      unit: "",
    },
  ]);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: Date.now(),
        material: "",
        quantity: "",
        unit: "",
      },
    ]);
  };

  const removeIngredient = (id: number) => {
    setIngredients(
      ingredients.filter(
        (ingredient) => ingredient.id !== id
      )
    );
  };

  const updateIngredient = (
    id: number,
    field: keyof Ingredient,
    value: string
  ) => {
    setIngredients((prev) =>
      prev.map((ingredient) => {
        if (ingredient.id === id) {
          return {
            ...ingredient,
            [field]: value,
          };
        }

        return ingredient;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#101828] p-4 sm:p-6 transition-colors">

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Resources & Suppliers
        </h1>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Manage your foundation data - Supply,
          Suppliers, and Recipes
        </p>
      </div>

      <div className="mb-8 flex gap-6 overflow-x-auto border-b border-gray-200 dark:border-gray-700">

        <button
          onClick={() => setActiveTab("supply")}
          className={`pb-4 text-sm font-semibold whitespace-nowrap ${
            activeTab === "supply"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Supply List
        </button>

        <button
          onClick={() => setActiveTab("supplier")}
          className={`pb-4 text-sm font-semibold whitespace-nowrap ${
            activeTab === "supplier"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Supplier List
        </button>

        <button
          onClick={() => setActiveTab("recipe")}
          className={`pb-4 text-sm font-semibold whitespace-nowrap ${
            activeTab === "recipe"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Recipe / BOM
        </button>
      </div>

      {activeTab === "supply" && (
        <div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Supply List
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Raw materials and tools inventory
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedSupply(null);
                setOpenSupplyModal(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add New Supply
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Items
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {supplyData.length}
              </h2>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Raw Materials
              </p>

              <h2 className="mt-2 text-3xl font-bold text-blue-600">
                {
                  supplyData.filter(
                    (item) =>
                      item.category ===
                      "Raw Materials"
                  ).length
                }
              </h2>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tools & Supplies
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {
                  supplyData.filter(
                    (item) =>
                      item.category ===
                      "Tools & Supplies"
                  ).length
                }
              </h2>
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center">

            <div className="flex flex-wrap gap-3">

              <button
                onClick={() =>
                  setSupplyFilter("All")
                }
                className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                  supplyFilter === "All"
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] text-gray-700 dark:text-gray-300"
                }`}
              >
                All
              </button>

              <button
                onClick={() =>
                  setSupplyFilter(
                    "Raw Materials"
                  )
                }
                className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                  supplyFilter ===
                  "Raw Materials"
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] text-gray-700 dark:text-gray-300"
                }`}
              >
                Raw Materials
              </button>

              <button
                onClick={() =>
                  setSupplyFilter(
                    "Tools & Supplies"
                  )
                }
                className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                  supplyFilter ===
                  "Tools & Supplies"
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] text-gray-700 dark:text-gray-300"
                }`}
              >
                Tools & Supplies
              </button>
            </div>

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search supplies..."
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">

            <table className="w-full min-w-[700px]">
              <thead className="border-b border-gray-200 dark:border-gray-700">

                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">

                  <th className="px-5 py-4">
                    Item ID
                  </th>

                  <th className="px-5 py-4">
                    Name
                  </th>

                  <th className="px-5 py-4">
                    Category
                  </th>

                  <th className="px-5 py-4">
                    Unit
                  </th>

                  <th className="px-5 py-4">
                    Min Stock
                  </th>

                  <th className="px-5 py-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredSupplies.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                        {item.id}
                      </td>

                      <td className="px-5 py-5 text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </td>

                      <td className="px-5 py-5">
                        <span className="rounded-lg bg-blue-100 dark:bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                          {item.category}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                        {item.unit}
                      </td>

                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                        {item.minStock}
                      </td>

                      <td className="px-5 py-5">

                        <button
                          onClick={() => {
                            setSelectedSupply(
                              item
                            );

                            setOpenSupplyModal(
                              true
                            );
                          }}
                          className="flex items-center gap-2 text-sm font-semibold text-blue-600"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "supplier" && (
        <div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Supplier Management
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage supplier relationships
              </p>
            </div>

            <button
              onClick={() =>
                setOpenSupplierModal(true)
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Supplier
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939]">

            <table className="w-full min-w-[700px]">
              <thead className="border-b border-gray-200 dark:border-gray-700">

                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">

                  <th className="px-5 py-4">
                    Supplier Name
                  </th>

                  <th className="px-5 py-4">
                    Contact Person
                  </th>

                  <th className="px-5 py-4">
                    Email
                  </th>

                  <th className="px-5 py-4">
                    Phone
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {supplierData.map(
                  (supplier) => (
                    <tr
                      key={supplier.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-5 py-5 text-sm font-semibold text-gray-900 dark:text-white">
                        {
                          supplier.supplierName
                        }
                      </td>

                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                        {
                          supplier.contactPerson
                        }
                      </td>

                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                        {supplier.email}
                      </td>

                      <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                        {supplier.phone}
                      </td>

                      <td className="px-5 py-5">
                        <span className="rounded-full bg-green-100 dark:bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300">
                          {
                            supplier.status
                          }
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <button className="text-blue-600">
                          <Pencil
                            size={16}
                          />
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "recipe" && (
        <div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Recipe / BOM Setup
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Define bills of materials
              </p>
            </div>

            <button
              onClick={() =>
                setOpenRecipeModal(true)
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              New Recipe
            </button>
          </div>

          <div className="space-y-5">

            {recipeData.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2939] p-6"
              >
                <div className="mb-6 flex items-center justify-between">

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {
                        recipe.finishedProduct
                      }
                    </h3>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Output:{" "}
                      {
                        recipe.outputQuantity
                      }
                    </p>
                  </div>

                  <button className="text-blue-600">
                    <Pencil size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                  {recipe.ingredients.map(
                    (ingredient) => (
                      <div
                        key={
                          ingredient.id
                        }
                        className="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                      >
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {
                            ingredient.material
                          }
                        </p>

                        <p className="mt-2 text-sm font-bold text-blue-600">
                          {
                            ingredient.quantity
                          }{" "}
                          {
                            ingredient.unit
                          }
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={openSupplyModal}
        title={
          selectedSupply
            ? "Edit Supply"
            : "Add New Supply"
        }
        onClose={() =>
          setOpenSupplyModal(false)
        }
      >
        <div className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Item Name
            </label>

            <input
              type="text"
              defaultValue={
                selectedSupply?.name || ""
              }
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Category
            </label>

            <select
              defaultValue={
                selectedSupply?.category ||
                "Raw Materials"
              }
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
            >
              <option>
                Raw Materials
              </option>

              <option>
                Tools & Supplies
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Unit of Measurement
            </label>

            <select
              defaultValue={
                selectedSupply?.unit ||
                "kg"
              }
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
            >
              <option>kg</option>
              <option>grams</option>
              <option>liters</option>
              <option>ml</option>
              <option>pcs</option>
              <option>boxes</option>
              <option>packs</option>
              <option>sets</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Minimum Stock Level
            </label>

            <input
              type="number"
              defaultValue={
                selectedSupply?.minStock ||
                ""
              }
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">

            <button
              onClick={() =>
                setOpenSupplyModal(false)
              }
              className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>

            <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              Save
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={openSupplierModal}
        title="Add New Supplier"
        onClose={() =>
          setOpenSupplierModal(false)
        }
      >
        <div className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Supplier Name
            </label>

            <input
              type="text"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Contact Person
            </label>

            <input
              type="text"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Email
              </label>

              <input
                type="email"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Phone No.
              </label>

              <input
                type="text"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Status
            </label>

            <select className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">

            <button
              onClick={() =>
                setOpenSupplierModal(false)
              }
              className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>

            <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              Save Supplier
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={openRecipeModal}
        title="Create New Recipe"
        onClose={() =>
          setOpenRecipeModal(false)
        }
      >
        <div className="space-y-6">

          <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Select your finished product, then
              add each raw material with its
              quantity.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Finished Product
            </label>

            <select className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none">
              <option>
                Select finished product...
              </option>

              <option>
                Ube Halaya
              </option>

              <option>
                Ube Cake
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Output Quantity
            </label>

            <input
              type="number"
              defaultValue="1"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div>

            <div className="mb-4 flex items-center justify-between">

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Required Ingredients
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add all raw materials needed
                </p>
              </div>

              <span className="rounded-full bg-blue-100 dark:bg-blue-500/10 px-4 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                {ingredients.length} ingredient
              </span>
            </div>

            <div className="space-y-5">

              {ingredients.map(
                (ingredient, index) => (
                  <div
                    key={ingredient.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
                  >

                    <div className="mb-5 flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/10 text-sm font-bold text-blue-700 dark:text-blue-300">
                          {index + 1}
                        </div>

                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Raw Material
                        </p>
                      </div>

                      {ingredients.length >
                        1 && (
                        <button
                          onClick={() =>
                            removeIngredient(
                              ingredient.id
                            )
                          }
                          className="text-red-500"
                        >
                          <Trash2
                            size={18}
                          />
                        </button>
                      )}
                    </div>

                    <div className="space-y-5">

                      <select
                        value={
                          ingredient.material
                        }
                        onChange={(e) =>
                          updateIngredient(
                            ingredient.id,
                            "material",
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
                      >
                        <option value="">
                          Select raw material...
                        </option>

                        <option>
                          Ube (Purple Yam)
                        </option>

                        <option>
                          White Sugar
                        </option>

                        <option>
                          Condensed Milk
                        </option>
                      </select>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Quantity
                          </label>

                          <input
                            type="number"
                            placeholder="e.g. 500"
                            value={
                              ingredient.quantity
                            }
                            onChange={(e) =>
                              updateIngredient(
                                ingredient.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Unit
                          </label>

                          <input
                            type="text"
                            value={
                              ingredient.unit
                            }
                            onChange={(e) =>
                              updateIngredient(
                                ingredient.id,
                                "unit",
                                e.target.value
                              )
                            }
                            placeholder="kg"
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <button
              onClick={addIngredient}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              <Plus size={18} />
              Add Ingredient
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Notes
            </label>

            <textarea
              rows={4}
              placeholder="Special instructions..."
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101828] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">

            <button
              onClick={() =>
                setOpenRecipeModal(false)
              }
              className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>

            <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              Create Recipe
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}