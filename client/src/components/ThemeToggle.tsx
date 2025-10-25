export default function ThemeToggle({ theme, toggleTheme }: { theme: "light" | "dark"; toggleTheme: () => void }) {
  return (
    <button
      onClick={toggleTheme}
      className="text-sm mr-4 px-3 py-1 border rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:opacity-80 transition"
    >
      {theme === "light" ? "🌞 Light" : "🌙 Dark"}
    </button>
  );
}