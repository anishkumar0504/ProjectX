/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google"; // ✅ Import the provider
import { SmoothScroll } from "./components/SmoothScroll";
import { ReportGenerator } from "./pages/ReportGenerator";
import Auth from "../src/pages/AuthPage"; 
import Subscribe from "../src/components/Payment/SubscribePage"; // ✅ New import for the Subscribe page

// ✅ Get your Google Client ID from the environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_FALLBACK_CLIENT_ID.apps.googleusercontent.com";

// 🔒 Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("auth_token");
  
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    // ✅ Wrap the entire routing tree in the GoogleOAuthProvider
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <SmoothScroll>
          <Routes>
            {/* 🌐 Public Route: Authentication */}
            <Route path="/auth" element={<Auth />} />

            {/* 🔒 Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ReportGenerator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <ReportGenerator />
                </ProtectedRoute>
              }
            />
            
            {/* 💳 Protected Route: Subscription Management */}
            <Route
              path="/subscribe"
              element={
                <ProtectedRoute>
                  <Subscribe />
                </ProtectedRoute>
              }
            />

            {/* ⚠️ Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SmoothScroll>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}