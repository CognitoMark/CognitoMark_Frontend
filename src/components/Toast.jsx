"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);

  const addToast = useCallback((message, type = "info", title = "") => {
    const id = Date.now() + "-" + Math.random();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showAlert = useCallback((message, title = "Notice", type = "error") => {
    setModal({ message, title, type });
  }, []);

  const success = (msg, title = "Success") => addToast(msg, "success", title);
  const error = (msg, title = "Error") => {
    addToast(msg, "error", title);
    showAlert(msg, title, "error");
  };
  const info = (msg, title = "Info") => addToast(msg, "info", title);
  const warning = (msg, title = "Warning") => addToast(msg, "warning", title);

  return (
    <ToastContext.Provider value={{ success, error, info, warning, showAlert }}>
      {children}

      {/* Global Modals (Popups) */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div className="modal-header" style={{ 
              borderColor: modal.type === "error" ? "rgba(248, 81, 73, 0.2)" : "var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              {modal.type === "error" && <span style={{ color: "var(--danger)", fontSize: "1.2rem" }}>⚠</span>}
              <h3>{modal.title}</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text)", fontSize: "0.95rem", fontWeight: "500", marginBottom: "8px" }}>
                {modal.message}
              </p>
              {modal.type === "error" && (
                <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                  Please review the information above and try again. If the problem persists, contact support.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className={`btn ${modal.type === "error" ? "danger" : "secondary"}`}
                onClick={() => setModal(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              <div className="toast-message">{t.message}</div>
            </div>
            <button className="toast-close" onClick={() => removeToast(t.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useNotify must be used within a ToastProvider");
  }
  return context;
};
