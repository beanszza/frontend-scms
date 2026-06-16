"use client";

type Location = {
  id: string;
  name: string;
  type: string;
  address: string;
  status: string;
};

export default function LocationManagement({ locations }: { locations: Location[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              {["LOCATION NO.", "NAME", "TYPE", "ADDRESS", "STATUS", "ACTIONS"].map(h => (
                <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.map(l => (
              <tr key={l.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{l.id}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">{l.name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    {l.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{l.address}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-gray-400 hover:text-red-500 transition-colors font-medium">Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}