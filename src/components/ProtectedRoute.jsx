"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "../utils/storage";

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = storage.get("adminToken");
    if (!token) {
      router.replace("/admin");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
