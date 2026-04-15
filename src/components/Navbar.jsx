"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const BREADCRUMBS = {
  "/admin/dashboard": "Dashboard",
  "/admin/exams":     "Exams",
  "/admin/questions": "Questions",
  "/admin/students":  "Students",
  "/admin/sessions":  "Sessions",
  "/admin/settings":  "Settings",
};

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6"  x2="21" y2="6"  />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const Navbar = ({ onMobileMenuToggle }) => {
  const pathname  = usePathname();
  const isAdmin   = pathname?.startsWith("/admin") && pathname !== "/admin";
  const pageTitle = BREADCRUMBS[pathname] ?? "";

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      height: "var(--navbar-h)",
      background: "var(--bg)",
      borderBottom: "1px solid var(--border)",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      gap: "10px",
    }}>
      {/* Mobile hamburger — only when in admin section */}
      {isAdmin && onMobileMenuToggle && (
        <button
          className="nav-hamburger"
          onClick={onMobileMenuToggle}
          aria-label="Toggle navigation"
        >
          <HamburgerIcon />
        </button>
      )}

      {/* Logo / brand */}
      <Link href={isAdmin ? "/admin/dashboard" : "/"} style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontWeight: 700,
        fontSize: "1rem",
        color: "var(--primary)",
        textDecoration: "none",
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}>
        <Image src="/favicon.png" alt="CognitoMark" width={24} height={24} style={{ borderRadius: "6px" }} />
        CognitoMark
      </Link>

      {/* Breadcrumb */}
      {isAdmin && pageTitle && (
        <>
          <span style={{ color: "var(--border)", fontSize: "1.1rem", userSelect: "none" }}>/</span>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            {pageTitle}
          </span>
        </>
      )}

      {/* Right side */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
        {isAdmin && (
          <span style={{
            fontSize: "0.75rem",
            color: "var(--muted)",
            background: "var(--card-2)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "4px 10px",
            fontWeight: 500,
          }}>
            Admin
          </span>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
