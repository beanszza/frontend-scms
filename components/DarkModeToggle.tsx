import { Moon, Sun } from "lucide-react";

interface Props {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export default function DarkModeToggle({
  darkMode,
  setDarkMode,
}: Props) {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      {darkMode ? "Light" : "Dark"}
    </button>
  );
}