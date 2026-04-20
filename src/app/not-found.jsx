import Link from "next/link";

const NotFound = () => (
  <div className="centered-page">
    <div className="card shadow" style={{ maxWidth: "450px", textAlign: "center", padding: "40px" }}>
      <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "var(--primary)", marginBottom: "16px", opacity: 0.8 }}>
        404
      </div>
      <h2 style={{ marginBottom: "12px" }}>Page Not Found</h2>
      <p style={{ color: "var(--muted)", marginBottom: "28px", fontSize: "0.95rem" }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/" className="btn primary" style={{ padding: "10px 28px" }}>
        Return to Home
      </Link>
    </div>
  </div>
);

export default NotFound;
