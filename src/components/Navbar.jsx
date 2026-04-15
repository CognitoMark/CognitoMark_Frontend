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

const Navbar = () => {
  const pathname  = usePathname();
  const isAdmin   = pathname?.startsWith("/admin");
  const pageTitle = BREADCRUMBS[pathname] ?? "";

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: isAdmin ? "flex-start" : "center",
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
      {/* Logo / brand - Centered on mobile/student pages if requested */}
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
        // If not admin, absolute position to ensure true center regardless of other elements
        position: (!isAdmin) ? "absolute" : "relative",
        left: (!isAdmin) ? "50%" : "auto",
        transform: (!isAdmin) ? "translateX(-50%)" : "none",
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
