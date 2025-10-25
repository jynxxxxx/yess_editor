import Chat from "./components/Chat";
import "./App.css";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="relative p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold">Yess — Korean Spell Correction</h1>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <div className="absolute right-6 bottom-[-2rem] text-sm text-neutral-500">Model: gpt-4.1-mini</div>
      </header>

      <main className="flex-1">
        <Chat />
      </main>
    </div>
  );
}