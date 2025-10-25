import Chat from "./components/Chat";
import "./App.css";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="relative pl-8 pt-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Yess — Korean Spell Correction</h1>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <div className="absolute right-4 bottom-[-1.5rem] text-xs text-neutral-500">Model: gpt-4.1-mini</div>
      </header>

      <main className="flex-1 flex items-center">
        <Chat />
      </main>
    </div>
  );
}