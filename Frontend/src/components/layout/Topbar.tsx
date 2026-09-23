import React, { useEffect, useState, useRef } from "react";
import { 
  Moon, Sun, LogOut, CreditCard, ChevronDown, User, Plus, 
  Info, MessageSquare 
} from "lucide-react";
import { UpdatesModal } from "./UpdatesModal"; // Adjust path if needed

interface TopbarProps {
  currentStep: number;
  templateName?: string;
  onFillSampleData?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const Topbar: React.FC<TopbarProps> = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false); // New state
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Theme persistence
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

  // Fetch user session
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("sessionId");
        }
      } catch (err) {
        console.error("Session check failed:", err);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("sessionId");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    const handleCreditUpdate = () => fetchUser();
    window.addEventListener('credits-updated', handleCreditUpdate);

    return () => {
      window.removeEventListener('credits-updated', handleCreditUpdate);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const sessionId = localStorage.getItem("sessionId");
    try {
      if (sessionId) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-session-token": sessionId 
          },
          body: JSON.stringify({ sessionId }),
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("sessionId");
      setUser(null);
      setShowDropdown(false);
      window.location.href = "/auth";
    }
  };

  if (loading) {
    return <div className="h-14" />;
  }

  return (
    <>
      <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3 pb-2 transition-all">
        <div className="max-w-[1440px] mx-auto apple-glass rounded-2xl sm:rounded-full px-4 sm:px-6 h-14 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <img src="/logo.png" alt="ProjectX logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-sm sm:text-base font-semibold tracking-tight text-neutral-900 dark:text-white hidden sm:block">
              ProjectX
            </h1>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            
            {/* Dynamic Credits Button (Desktop only) */}
            {user && user.credits > 0 && (
              <a
                href="/subscribe"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-black/5 dark:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                    {user.credits}
                  </span>
                </div>
                <div className="w-px h-3 bg-neutral-300 dark:bg-neutral-600 mx-1" />
                <Plus className="w-3.5 h-3.5 text-neutral-500 group-hover:text-blue-500 transition-colors" />
              </a>
            )}

            {/* Action Buttons Group */}
            <div className="flex items-center gap-1.5">
              {/* 1. Future Updates Info Button */}
              <button
                type="button"
                onClick={() => setShowUpdatesModal(true)}
                aria-label="View future updates"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-600 dark:text-neutral-300 active:scale-[0.96] transition-all border border-black/5 dark:border-white/10"
                title="What's coming next?"
              >
                <Info className="w-4 h-4" />
              </button>

              {/* 2. Feedback / Report Button (Opens Email) */}
              <a
                href="mailto:0504anish@gmail.com?subject=ProjectX%20Feedback%20%2F%20Bug%20Report&body=Hi%20Anish,%0A%0A"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Send feedback or report an issue"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-600 dark:text-neutral-300 active:scale-[0.96] transition-all border border-black/5 dark:border-white/10"
                title="Send Feedback"
              >
                <MessageSquare className="w-4 h-4" />
              </a>

              {/* 3. Theme Switcher */}
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 active:scale-[0.96] transition-all border border-black/5 dark:border-white/10"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-neutral-700" />}
              </button>
            </div>

            {/* Profile Dropdown or Login Button */}
            {user ? (
              <div className="relative ml-1" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-600 dark:from-white dark:to-neutral-300 flex items-center justify-center text-white dark:text-black text-[10px] font-bold uppercase">
                    {user.name?.[0] || "U"}
                  </div>
                  <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 apple-glass rounded-xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="p-3 border-b border-black/5 dark:border-white/10">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                      
                      {/* Mobile-only credits display */}
                      <div className="sm:hidden mt-3 flex items-center justify-between p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          <CreditCard className="w-3.5 h-3.5" />
                          {user.credits ?? 0} Credits
                        </div>
                        <a href="/subscribe" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                          Add More
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2.5 flex items-center gap-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="/auth"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all ml-1"
              >
                <User className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 hidden sm:inline">Login</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Render the Modal */}
      <UpdatesModal 
        isOpen={showUpdatesModal} 
        onClose={() => setShowUpdatesModal(false)} 
      />
    </>
  );
};