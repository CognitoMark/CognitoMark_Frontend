"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteStudent, fetchStudents } from "../../api/adminApi";
import ConfirmModal from "../../components/ConfirmModal";
import { useSocket } from "../../hooks/useSocket";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, id: null });
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setError("");
      const { data } = await fetchStudents();
      setStudents(data);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load students.");
    }
  };

  useEffect(() => { load(); }, []);

  const handlers = useMemo(() => ({
    student_created: () => load(),
    student_deleted: () => load(),
  }), []);

  useSocket(handlers);

  const handleConfirmDelete = async () => {
    const { id } = modal;
    setModal({ isOpen: false, id: null });
    if (deletingId) return;
    try {
      setError("");
      setDeletingId(id);
      await deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete student.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = students.filter((s) =>
    !search.trim() ||
    s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">

      {/* ── Page header ── */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Students</h2>
        <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
          Registered students and their records
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <label htmlFor="student-search" className="sr-only">Search Students</label>
        <input
          id="student-search"
          name="search"
          className="input"
          placeholder="Search by ID or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "280px" }}
        />
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--muted)" }}>
          {filtered.length} student{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Students table ── */}
      <div className="card">
        {error && <div className="notice danger" style={{ marginBottom: "12px" }}>{error}</div>}

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: "0.875rem" }}>
            {students.length === 0 ? "No students registered yet." : "No results match your search."}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Registered</th>
                <th style={{ width: "80px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500, color: "var(--text)" }}>{s.student_id}</td>
                  <td>{s.name}</td>
                  <td>{s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</td>
                  <td>
                    <button
                      className="btn danger"
                      style={{ fontSize: "0.8rem", padding: "5px 12px" }}
                      onClick={() => setModal({ isOpen: true, id: s.id })}
                      disabled={deletingId === s.id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Delete Student"
        message="This will permanently remove the student and all their exam sessions and responses."
        onConfirm={handleConfirmDelete}
        onCancel={() => setModal({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default Students;
