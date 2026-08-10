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
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium bg-card hover:bg-muted transition"
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      {darkMode ? "Light" : "Dark"}
    </button>
  );
}