"use client";

import { useState } from "react";
import { changeAdminPassword } from "../../api/adminApi";
import { useNotify } from "../../components/Toast";

const Settings = () => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { notify.error("New passwords do not match."); return; }
    if (form.newPassword.length < 4) { notify.error("New password must be at least 4 characters."); return; }
    setLoading(true);
    try {
      await changeAdminPassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      notify.success("Password changed successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      notify.error(err?.errorMessage || err?.response?.data?.error || error?.errorMessage || error?.response?.data?.error || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, placeholder, last }) => {
    const fieldId = `settings-${name}`;
    return (
      <div style={{ marginBottom: last ? 0 : "14px" }}>
        <label htmlFor={fieldId} style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px" }}>
          {label}
        </label>
        <input
          id={fieldId}
          className="input"
          type="password"
          name={name}
          placeholder={placeholder}
          value={form[name]}
          onChange={handleChange}
          autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
          required
        />
      </div>
    );
  };

  return (
    <div className="container">

      {/* ── Page header ── */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Settings</h2>
        <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
          Manage your admin account
        </p>
      </div>

      <div className="settings-layout">

        {/* Change password card */}
        <div className="card">
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>Change Password</div>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "2px" }}>
              You must provide your current password to set a new one.
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Field label="Current Password" name="currentPassword" placeholder="Enter current password" />
            <div style={{ borderTop: "1px solid var(--border)", margin: "16px 0" }} />
            <Field label="New Password" name="newPassword" placeholder="Enter new password" />
            <Field label="Confirm New Password" name="confirmPassword" placeholder="Re-enter new password" last />

            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{ marginTop: "16px", width: "100%" }}
            >
              {loading ? "Changing…" : "Change Password"}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div className="card" style={{ background: "var(--bg)" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: "12px" }}>
            Security Note
          </div>
          <ul style={{ listStyle: "none", display: "grid", gap: "10px" }}>
            {[
              "Your password is stored as a bcrypt hash — never in plain text.",
              "You must provide your current password to make any changes.",
              "Use a strong password with at least 8 characters.",
              "If you forget your password, an administrator must reset it via the server.",
            ].map((note, i) => (
              <li key={i} style={{ display: "flex", gap: "8px", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <span style={{ color: "var(--primary)", flexShrink: 0, marginTop: "1px" }}>•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
