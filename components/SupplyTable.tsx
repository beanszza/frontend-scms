"use client";

import { Pencil, Plus, Search } from "lucide-react";

type SupplyItem = {
  id: number;
  name: string;
  category: string;
  unit: string;
  minStock: number;
};

const supplies: SupplyItem[] = [
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
    name: "Brown Sugar",
    category: "Raw Materials",
    unit: "kg",
    minStock: 30,
  },
  {
    id: 4,
    name: "Condensed Milk",
    category: "Raw Materials",
    unit: "liters",
    minStock: 20,
  },
  {
    id: 5,
    name: "Mixing Bowl",
    category: "Tools",
    unit: "pcs",
    minStock: 5,
  },
];

export default function SupplyTable() {
  return (
    <div className="flex flex-col gap-6">

      {/* TOP */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Supply List
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Raw materials and tools inventory
          </p>
        </div>

        <button
          className="
            flex items-center gap-2
            bg-blue-600 hover:bg-blue-700
            text-white
            px-4 py-3
            rounded-xl
            text-sm font-semibold
          "
        >
          <Plus size={18} />
          Add New Supply
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Items
          </p>

          <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
            14
          </h3>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Raw Materials
          </p>

          <h3 className="text-4xl font-bold text-blue-600 mt-2">
            9
          </h3>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tools
          </p>

          <h3 className="text-4xl font-bold text-green-600 mt-2">
            5
          </h3>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">

        {/* FILTER */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">

          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            All
          </button>

          <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium">
            Raw Materials
          </button>

          <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium">
            Tools
          </button>

          <div className="relative ml-auto w-[300px]">
            <Search
              size={18}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search supplies..."
              className="
                w-full
                pl-10 pr-4 py-3
                rounded-xl
                border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-800
                text-sm
                text-gray-900 dark:text-white
                outline-none
              "
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">

            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">

                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                  ITEM ID
                </th>

                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                  NAME
                </th>

                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                  CATEGORY
                </th>

                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                  UNIT
                </th>

                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                  MIN STOCK
                </th>

                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody>
              {supplies.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
                    {item.id}
                  </td>

                  <td className="px-6 py-5 text-sm font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </td>

                  <td className="px-6 py-5">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-semibold">
                      {item.category}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
                    {item.unit}
                  </td>

                  <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
                    {item.minStock}
                  </td>

                  <td className="px-6 py-5">
                    <button className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                      <Pencil size={16} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}