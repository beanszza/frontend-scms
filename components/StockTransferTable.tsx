"use client";

type Transfer = {
  id: string;
  product: string;
  from: string;
  to: string;
  quantity: number;
  date: string;
  status: "Completed" | "In Transit" | "Pending";
};

interface StockTransferTableProps {
  transfers: Transfer[];
  onDispatchClick: (transfer: Transfer) => void;
  onCompleteClick: (id: string) => void;
}

export default function StockTransferTable({ transfers, onDispatchClick, onCompleteClick }: StockTransferTableProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              {["TRANSFER ID", "PRODUCT", "FROM", "TO", "QUANTITY", "TRANSFER DATE", "STATUS", "ACTIONS"].map(h => (
                <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transfers.map(t => (
              <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{t.id}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{t.product}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.from}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.to}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{t.quantity}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    t.status === "Completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    t.status === "In Transit" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {t.status === "Pending" && (
                    <button onClick={() => onDispatchClick(t)} className="h-8 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap">
                      Dispatch
                    </button>
                  )}
                  {t.status === "In Transit" && (
                    <button onClick={() => onCompleteClick(t.id)} className="h-8 px-3 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors whitespace-nowrap">
                      Complete
                    </button>
                  )}
                  {t.status === "Completed" && (
                    <span className="text-gray-400 dark:text-gray-500 font-medium">View Details</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}