"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/ProtectedRoute";

const AdminLayout = ({ children }) => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isLoginPage = pathname === "/admin";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div
        className={`admin-layout ${!isSidebarOpen ? "sidebar-collapsed" : ""}`}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="admin-content">{children}</main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminLayout;
