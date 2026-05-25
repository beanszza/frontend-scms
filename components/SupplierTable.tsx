"use client";

import { Pencil, Plus, Star } from "lucide-react";

const suppliers = [
  {
    id: 1,
    name: "Manila Fresh Produce",
    contact: "Juan Dela Cruz",
    email: "juan@manila.ph",
    phone: "+63 917 123 4567",
    rating: 4.8,
    onTime: "95%",
    leadTime: "2 days",
    status: "Active",
  },
  {
    id: 2,
    name: "Baguio Ube Traders",
    contact: "Maria Santos",
    email: "maria@ube.ph",
    phone: "+63 918 888 2222",
    rating: 4.9,
    onTime: "98%",
    leadTime: "3 days",
    status: "Active",
  },
];

export default function SupplierTable() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">

      <div className="p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Supplier Management
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage supplier relationships
          </p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">

          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">

              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                SUPPLIER NAME
              </th>

              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                CONTACT PERSON
              </th>

              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                CONTACT DETAILS
              </th>

              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                RATING
              </th>

              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                ON-TIME RATE
              </th>

              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                AVG LEAD TIME
              </th>

              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                STATUS
              </th>

              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500">
                ACTIONS
              </th>
            </tr>
          </thead>

          <tbody>
            {suppliers.map((supplier) => (
              <tr
                key={supplier.id}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                <td className="px-6 py-5 text-sm font-semibold text-gray-900 dark:text-white">
                  {supplier.name}
                </td>

                <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
                  {supplier.contact}
                </td>

                <td className="px-6 py-5">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {supplier.email}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {supplier.phone}
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Star
                      size={15}
                      className="text-yellow-400 fill-yellow-400"
                    />

                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {supplier.rating}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-5 text-sm font-semibold text-green-600">
                  {supplier.onTime}
                </td>

                <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
                  {supplier.leadTime}
                </td>

                <td className="px-6 py-5">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {supplier.status}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <button className="text-blue-600">
                    <Pencil size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}