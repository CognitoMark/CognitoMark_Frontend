"use client";

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="centered-page">
          <div className="card shadow" style={{ maxWidth: "450px", textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⚠️</div>
            <h2 style={{ marginBottom: "12px" }}>Something went wrong</h2>
            <p style={{ color: "var(--muted)", marginBottom: "24px", fontSize: "0.95rem" }}>
              An unexpected error occurred in the application. Please try refreshing the page.
            </p>
            <button 
              className="btn primary" 
              onClick={() => window.location.reload()}
              style={{ padding: "10px 24px" }}
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === "development" && (
              <pre style={{ marginTop: "24px", textAlign: "left", background: "#f8f9fa", padding: "12px", borderRadius: "8px", overflow: "auto", fontSize: "0.8rem", color: "#d73a49" }}>
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
