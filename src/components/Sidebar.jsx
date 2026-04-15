"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { storage } from "../utils/storage";

const NAV = [
  { name: "Dashboard",  href: "/admin/dashboard", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  )},
  { name: "Exams",      href: "/admin/exams",     icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  )},
  { name: "Questions",  href: "/admin/questions",  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  )},
  { name: "Students",   href: "/admin/students",   icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { name: "Sessions",   href: "/admin/sessions",   icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  )},
  { name: "Settings",   href: "/admin/settings",   icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
];

const Sidebar = ({ isOpen, onToggle }) => {
  const pathname  = usePathname();
  const router    = useRouter();

  const handleLogout = () => {
    storage.remove("adminToken");
    router.push("/admin");
  };

  return (
    <aside style={{
      width: isOpen ? "220px" : "60px",
      background: "var(--bg)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      position: "sticky",
      top: "var(--navbar-h)",
      height: "calc(100vh - var(--navbar-h))",
      transition: "width 0.2s ease",
      flexShrink: 0,
      overflow: "hidden",
      zIndex: 10,
    }}>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        style={{
          position: "absolute",
          right: isOpen ? "12px" : "50%",
          transform: isOpen ? "none" : "translateX(50%)",
          top: "14px",
          width: "24px",
          height: "24px",
          background: "var(--card-2)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          color: "var(--muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          padding: 0,
          transition: "right 0.2s ease, transform 0.2s ease",
          zIndex: 1,
        }}
      >
        {isOpen ? "‹" : "›"}
      </button>

      {/* Nav section label */}
      {isOpen && (
        <div style={{
          padding: "14px 16px 6px",
          fontSize: "0.65rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--muted)",
          marginTop: "44px",
        }}>
          Navigation
        </div>
      )}

      {/* Links */}
      <nav style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        padding: isOpen ? "4px 8px" : "52px 6px 4px",
        overflowY: "auto",
        overflowX: "hidden",
        marginTop: isOpen ? 0 : 0,
      }}>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!isOpen ? item.name : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: isOpen ? "9px 12px" : "9px 0",
                justifyContent: isOpen ? "flex-start" : "center",
                borderRadius: "8px",
                color: active ? "#c4b5fd" : "var(--text-secondary)",
                background: active ? "var(--primary-dim)" : "transparent",
                border: `1px solid ${active ? "rgba(139,92,246,0.2)" : "transparent"}`,
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: active ? 600 : 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--card-2)"; e.currentTarget.style.color = "var(--text)"; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}}
            >
              <span style={{ flexShrink: 0, display: "flex" }}>{item.icon}</span>
              {isOpen && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: isOpen ? "10px 8px" : "10px 6px",
        borderTop: "1px solid var(--border)",
      }}>
        {/* Student portal link */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={!isOpen ? "Student Portal" : ""}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: isOpen ? "8px 12px" : "8px 0",
            justifyContent: isOpen ? "flex-start" : "center",
            borderRadius: "8px",
            color: "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "0.8rem",
            marginBottom: "4px",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--card-2)"; e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          {isOpen && <span>Student Portal</span>}
        </Link>
        {/* Logout */}
        <button
          onClick={handleLogout}
          title={!isOpen ? "Sign Out" : ""}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: isOpen ? "8px 12px" : "8px 0",
            justifyContent: isOpen ? "flex-start" : "center",
            width: "100%",
            borderRadius: "8px",
            background: "none",
            border: "none",
            color: "var(--danger)",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontFamily: "inherit",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-dim)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
