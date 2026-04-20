"use client";

import { useEffect, useMemo, useState } from "react";
import { createExam, deleteExam, fetchExams } from "../../api/adminApi";
import ConfirmModal from "../../components/ConfirmModal";
import { useSocket } from "../../hooks/useSocket";
import { useNotify } from "../../components/Toast";

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [title, setTitle] = useState("");
  const notify = useNotify();
  const [deletingId, setDeletingId] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, id: null });

  const load = async () => {
    try {
      const { data } = await fetchExams();
      setExams(data);
    } catch (err) {
      notify.error(err?.errorMessage || err?.response?.data?.error || error?.errorMessage || error?.response?.data?.error || "Failed to load exams.");
    }
  };

  useEffect(() => { load(); }, []);

  const handlers = useMemo(() => ({
    exam_created: () => load(),
    exam_deleted: () => load(),
  }), []);

  useSocket(handlers);

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await createExam({ title });
      setTitle("");
      notify.success("Exam created successfully!");
      load();
    } catch (err) {
      notify.error(err?.errorMessage || err?.response?.data?.error || error?.errorMessage || error?.response?.data?.error || "Failed to create exam.");
    }
  };

  const handleConfirmDelete = async () => {
    const { id } = modal;
    setModal({ isOpen: false, id: null });
    if (deletingId) return;
    try {
      setDeletingId(id);
      await deleteExam(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
      notify.success("Exam deleted successfully!");
    } catch (err) {
      notify.error(err?.errorMessage || err?.response?.data?.error || error?.errorMessage || error?.response?.data?.error || "Failed to delete exam.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container">

      {/* ── Page header ── */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Exams</h2>
        <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
          Create and manage exam papers
        </p>
      </div>

      {/* ── Create new exam ── */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          New Exam
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label htmlFor="exam-title" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>Exam Title</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              id="exam-title"
              name="title"
              className="input"
              placeholder="Enter exam title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              style={{ flex: 1 }}
            />
            <button className="btn" onClick={handleCreate} disabled={!title.trim()}>
              + Create Exam
            </button>
          </div>
        </div>
      </div>

      {/* ── Exams list ── */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
            All Exams
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            {exams.length} {exams.length === 1 ? "exam" : "exams"}
          </span>
        </div>

        {exams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: "0.875rem" }}>
            No exams yet. Create one above.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Created</th>
                <th style={{ width: "80px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, i) => (
                <tr key={exam.id}>
                  <td style={{ color: "var(--muted)", width: "40px" }}>{i + 1}</td>
                  <td style={{ fontWeight: 500, color: "var(--text)" }}>{exam.title}</td>
                  <td>{exam.created_at ? new Date(exam.created_at).toLocaleDateString() : "—"}</td>
                  <td>
                    <button
                      className="btn danger"
                      style={{ fontSize: "0.8rem", padding: "5px 12px" }}
                      onClick={() => setModal({ isOpen: true, id: exam.id })}
                      disabled={deletingId === exam.id}
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
        title="Delete Exam"
        message="This will permanently delete the exam and all associated questions, sessions, and telemetry data."
        onConfirm={handleConfirmDelete}
        onCancel={() => setModal({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default Exams;
