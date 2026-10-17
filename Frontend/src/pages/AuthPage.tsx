import React, { useState, FormEvent, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Mail, Lock, User, Eye, EyeOff, Sun, Moon, Loader2 } from "lucide-react";

// Base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

type AuthMode = "signin" | "signup";

export default function Auth() {
const [mode] = useState<AuthMode>("signin");
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Initialize theme from system preference or localStorage
  useEffect(() => {
    const isDarkMode =
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(isDarkMode);
    if (isDarkMode) document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newDark);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Clear error on input change
  };

  // --- Traditional Email/Password Auth ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = mode === "signin" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "signin"
          ? { email: formData.email, password: formData.password }
          : { name: formData.name, email: formData.email, password: formData.password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Authentication failed");
      }

      // Store token and user profile in localStorage
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user_profile", JSON.stringify(data.user));
      }

      // Redirect to dashboard or account page
      window.location.href = "/account";
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Google OAuth Auth ---
  const handleGoogleSuccess = async (tokenResponse: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: tokenResponse.access_token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }

      // Store token and user profile in localStorage
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user_profile", JSON.stringify(data.user));
      }

      // Redirect to dashboard or account page
      window.location.href = "/account";
    } catch (err: any) {
      setError(err.message || "Google authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Google login failed. Please try again."),
    flow: "implicit", // Returns credential (ID token) directly
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Decorative Background Orbs */}
      <div className="absolute w-[520px] h-[520px] -top-40 -left-40 rounded-full bg-gradient-to-br from-orange-300 to-red-200 dark:from-orange-900/40 dark:to-red-900/20 blur-[90px] opacity-40 pointer-events-none z-0" />
      <div className="absolute w-[600px] h-[600px] -bottom-40 -right-40 rounded-full bg-gradient-to-br from-blue-300 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-900/20 blur-[90px] opacity-40 pointer-events-none z-0" />
      <div className="absolute w-[420px] h-[420px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-300 to-pink-200 dark:from-purple-900/30 dark:to-pink-900/20 blur-[90px] opacity-30 pointer-events-none z-0" />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 z-50 apple-glass rounded-full p-2.5 transition-transform hover:scale-105 active:scale-95"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-[var(--text-primary)]" />
        ) : (
          <Moon className="w-5 h-5 text-[var(--text-primary)]" />
        )}
      </button>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] mt-1.5">
            {mode === "signin"
              ? "Sign in to continue to your dashboard"
              : "Join us and start your journey today"}
          </p>
        </div>

        {/* Glass Form Container */}
        <div className="apple-glass rounded-3xl p-7 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Google Auth Button */}
            <button
              type="button"
              onClick={() => googleLogin()}
              disabled={isLoading}
              className="google-btn w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[var(--text-secondary)]/20" />
              <span className="text-[12px] uppercase tracking-wider text-[var(--text-secondary)] font-medium">
                or
              </span>
              <div className="flex-1 h-px bg-[var(--text-secondary)]/20" />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[13px] rounded-xl px-4 py-3 text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            {/* Name Field (Sign Up Only) */}
            {mode === "signup" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[13px] font-medium text-[var(--text-secondary)]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                  <input
                    type="text"
                    name="name"
                    required={mode === "signup"}
                    value={formData.name}
                    onChange={handleChange}
                    className="apple-input w-full rounded-xl pl-11 pr-4 py-3 text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/60"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[var(--text-secondary)]">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="apple-input w-full rounded-xl pl-11 pr-4 py-3 text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/60"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                {mode === "signin" && (
                  <a
                    href="/forgot-password"
                    className="text-[13px] text-[#0071e3] hover:text-[#0077ed] font-medium transition-colors"
                  >
                    Forgot?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="apple-input w-full rounded-xl pl-11 pr-11 py-3 text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/60"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="apple-btn-primary w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[15px] font-semibold mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[12px] text-[var(--text-secondary)] mt-8">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline hover:text-[var(--text-primary)] transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-[var(--text-primary)] transition-colors">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}