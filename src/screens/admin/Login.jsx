"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { adminLogin } from "../../api/adminApi";
import { storage } from "../../utils/storage";
import { useNotify } from "../../components/Toast";

const AdminLogin = () => {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const notify = useNotify();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await adminLogin(form);
      storage.set("adminToken", data.token);
      notify.success("Logged in successfully!");
      router.push("/admin/dashboard");
    } catch (err) {
      notify.error(err?.errorMessage || err?.response?.data?.error || error?.errorMessage || error?.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="centered-page">
      <div className="login-card">
        <div
          className="card-icon"
          style={{
            background: "linear-gradient(135deg, #1e1b4b, #4c1d95)",
            boxShadow: "0 8px 24px rgba(109, 40, 217, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image src="/favicon.png" alt="CognitoMark" width={48} height={48} style={{ borderRadius: "12px" }} />
        </div>
        <h2>Admin Control Panel</h2>
        <p className="subtitle">Secure access for exam administrators</p>

        <form onSubmit={handleSubmit} className="grid" style={{ gap: "1.25rem" }}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              className="input"
              name="username"
              placeholder="Admin username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                className="input"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                style={{ paddingRight: "44px" }}
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
              </div>
            </div>
          <button
            className="btn"
            type="submit"
            style={{ fontSize: "1rem", padding: "13px", marginTop: "4px" }}
          >
            Sign In →
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
