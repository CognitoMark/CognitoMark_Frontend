"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";

const AdminLayout = ({ children }) => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isLoginPage = pathname === "/admin";

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") setIsMobileOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div className="admin-layout">
        {/* Mobile overlay */}
        {isMobileOpen && (
          <div
            className="sidebar-overlay active"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile hamburger — floats top-left, only visible on mobile via CSS */}
        <button
          onClick={() => setIsMobileOpen((p) => !p)}
          aria-label="Toggle sidebar"
          style={{
            position: "fixed",
            top: "10px",
            left: "14px",
            zIndex: 201,
            width: "36px",
            height: "36px",
            display: "none", /* shown via @media in CSS */
            alignItems: "center",
            justifyContent: "center",
            background: "var(--card-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
          className="admin-mobile-hamburger"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((p) => !p)}
          isMobileOpen={isMobileOpen}
        />

        <main className="admin-content">{children}</main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminLayout;
