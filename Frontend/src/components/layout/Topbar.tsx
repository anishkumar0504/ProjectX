import React, { useEffect, useState } from "react";
import { Moon, Sun, FileSpreadsheet } from "lucide-react"; // ✅ Removed Sparkles

interface TopbarProps {
  currentStep: number;
  templateName?: string;
  onFillSampleData?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  templateName,
}) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true; // Default to sleek dark mode
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3 pb-2 transition-all">
      <div className="max-w-[1440px] mx-auto apple-glass rounded-2xl sm:rounded-full px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm sm:text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
              ProjectX
            </h1>
            {/* <span className="hidden sm:inline-block text-[11px] font-medium tracking-wide px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-black/5 dark:border-white/10">
              Pro Studio
            </span> */}
            {templateName && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden md:inline">
                / {templateName}
              </span>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 active:scale-[0.96] transition-all border border-black/5 dark:border-white/10"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-300 ios-vibrant-icon" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700 ios-vibrant-icon" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
