"use client";

import React, { useEffect, useRef } from "react";

const PasswordModal = ({
  isOpen,
  title,
  message,
  password,
  onPasswordChange,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  error,
  pending = false,
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          {message && <p>{message}</p>}
          <div className="form-group">
            <label htmlFor="admin-password" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
              Admin Password
            </label>
            <input
              id="admin-password"
              name="adminPassword"
              ref={inputRef}
              className="input"
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              disabled={pending}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="notice" style={{ color: "var(--danger)", marginTop: "12px" }}>
              {error}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn secondary" onClick={onCancel} disabled={pending}>
            {cancelText}
          </button>
          <button className="btn danger" onClick={onConfirm} disabled={pending}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
