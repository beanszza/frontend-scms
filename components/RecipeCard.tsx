"use client";

import { Pencil } from "lucide-react";

export default function RecipeCard() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">

      <div className="flex items-start justify-between">

        <div>
          <div className="flex items-center gap-3">

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ube Halaya (500g Jar)
            </h2>

            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              Active
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Recipe No.: RCP-001
          </p>

          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            Output: 1 jar
          </p>
        </div>

        <button className="text-blue-600">
          <Pencil size={18} />
        </button>
      </div>

      {/* INGREDIENTS */}
      <div className="mt-6">

        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Required Ingredients:
        </h3>

        <div className="grid grid-cols-3 gap-4">

          {[
            {
              name: "Ube (Purple Yam)",
              qty: "0.5 kg",
            },
            {
              name: "White Sugar",
              qty: "0.2 kg",
            },
            {
              name: "Condensed Milk",
              qty: "0.1 liters",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.name}
                  </h4>

                  <p className="text-xs text-gray-500 mt-1">
                    Raw Material
                  </p>
                </div>

                <span className="text-sm font-bold text-blue-600">
                  {item.qty}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* NOTES */}
        <div className="mt-5 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">

          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Notes:
          </p>

          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            Traditional Ube Halaya recipe with premium ingredients.
          </p>
        </div>
      </div>
    </div>
  );
}