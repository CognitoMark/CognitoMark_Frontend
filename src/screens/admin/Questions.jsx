"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createQuestion,
  deleteQuestion,
  fetchExams,
  fetchQuestions,
  updateQuestionOrder,
} from "../../api/adminApi";
import ConfirmModal from "../../components/ConfirmModal";
import { useSocket } from "../../hooks/useSocket";

const Questions = () => {
  const [exams, setExams] = useState([]);
  const [selected, setSelected] = useState("");
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState({ text: "", type: "mcq", options: "", correctAnswer: "" });
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, id: null });
  const [draggingId, setDraggingId] = useState(null);

  const loadExams = async () => {
    try { setError(""); const { data } = await fetchExams(); setExams(data); }
    catch (err) { setError(err?.response?.data?.error || "Failed to load exams."); }
  };

  const loadQuestions = async (examId) => {
    if (!examId) return;
    try { setError(""); const { data } = await fetchQuestions(examId); setQuestions(data); }
    catch (err) { setError(err?.response?.data?.error || "Failed to load questions."); }
  };

  useEffect(() => { loadExams(); }, []);
  useEffect(() => { loadQuestions(selected); }, [selected]);

  const handlers = useMemo(() => ({
    exam_created: () => loadExams(),
    exam_deleted: () => { loadExams(); if (selected) loadQuestions(selected); },
    question_created: (p) => { if (selected && String(p.examId) === String(selected)) loadQuestions(selected); },
    question_deleted: (p)  => { if (selected && String(p.examId) === String(selected)) loadQuestions(selected); },
    question_reordered: (p)=> { if (selected && String(p.examId) === String(selected)) loadQuestions(selected); },
  }), [selected]);

  useSocket(handlers);

  const handleCreate = async () => {
    if (!selected || !form.text.trim()) return;
    const options = form.type === "mcq"
      ? form.options.split(",").map((o) => o.trim()).filter(Boolean)
      : [];
    const trimmedAnswer = form.correctAnswer.trim();
    if (form.type === "mcq" && (!trimmedAnswer || !options.includes(trimmedAnswer))) {
      setError("Correct answer must match one of the MCQ options exactly.");
      return;
    }
    try {
      setError("");
      await createQuestion({ examId: Number(selected), text: form.text, type: form.type, options, correctAnswer: trimmedAnswer || undefined });
      setForm({ text: "", type: "mcq", options: "", correctAnswer: "" });
      loadQuestions(selected);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create question.");
    }
  };

  const handleConfirmDelete = async () => {
    const { id } = modal;
    setModal({ isOpen: false, id: null });
    if (deletingId) return;
    try {
      setError(""); setDeletingId(id);
      await deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete question.");
    } finally { setDeletingId(null); }
  };

  const persistOrder = async (next) => {
    if (!selected) return;
    try { await updateQuestionOrder(Number(selected), next.map((q) => q.id)); }
    catch (err) { setError(err?.response?.data?.error || "Failed to reorder."); loadQuestions(selected); }
  };

  const handleDrop = async (targetId) => {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); return; }
    const from = questions.findIndex((q) => q.id === draggingId);
    const to   = questions.findIndex((q) => q.id === targetId);
    if (from < 0 || to < 0) { setDraggingId(null); return; }
    const next = [...questions];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setQuestions(next);
    setDraggingId(null);
    await persistOrder(next);
  };

  return (
    <div className="container">

      {/* ── Page header ── */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Questions</h2>
        <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
          Add and manage questions for each exam
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="questions-layout">

        {/* Left: Add question form */}
        <div className="card" style={{ position: "sticky", top: "calc(var(--navbar-h) + 16px)" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "14px" }}>
            Add Question
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            <div>
              <label htmlFor="exam-select" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>Exam</label>
              <select id="exam-select" name="examId" className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
                <option value="">Select exam…</option>
                {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="question-text" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>Question Text</label>
              <textarea
                id="question-text"
                name="text"
                className="input"
                rows="3"
                placeholder="Enter the question…"
                value={form.text}
                onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
                style={{ resize: "vertical" }}
              />
            </div>

            <div>
              <label htmlFor="question-type" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>Type</label>
              <select id="question-type" name="type" className="input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, correctAnswer: "" }))}>
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="text">Text Answer</option>
              </select>
            </div>

            {form.type === "mcq" && (
              <div>
                <label htmlFor="question-options" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>Options <span style={{ fontWeight: 400 }}>(comma-separated)</span></label>
                <input id="question-options" name="options" className="input" placeholder="Option A, Option B, Option C…" value={form.options} onChange={(e) => setForm((p) => ({ ...p, options: e.target.value }))} />
              </div>
            )}

            <div>
              <label htmlFor="correct-answer" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>Correct Answer</label>
              {form.type === "mcq" ? (
                <select id="correct-answer" name="correctAnswer" className="input" value={form.correctAnswer} onChange={(e) => setForm((p) => ({ ...p, correctAnswer: e.target.value }))}>
                  <option value="">Select correct answer…</option>
                  {form.options.split(",").map((o) => o.trim()).filter(Boolean).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input id="correct-answer" name="correctAnswer" className="input" placeholder="Expected answer…" value={form.correctAnswer} onChange={(e) => setForm((p) => ({ ...p, correctAnswer: e.target.value }))} />
              )}
            </div>

            {error && <div className="notice danger" style={{ fontSize: "0.82rem" }}>{error}</div>}

            <button
              className="btn"
              onClick={handleCreate}
              disabled={!selected || !form.text.trim()}
              style={{ marginTop: "4px" }}
            >
              + Add Question
            </button>
          </div>
        </div>

        {/* Right: Questions list */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
              {selected ? `Questions` : "Select an exam to view questions"}
            </span>
            {selected && (
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                {questions.length} question{questions.length !== 1 ? "s" : ""} · Drag to reorder
              </span>
            )}
          </div>

          {!selected ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: "0.875rem" }}>
              Select an exam from the form on the left.
            </div>
          ) : questions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: "0.875rem" }}>
              No questions yet. Add one using the form.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "36px" }}></th>
                  <th style={{ width: "36px" }}>#</th>
                  <th>Question</th>
                  <th>Type</th>
                  <th>Answer</th>
                  <th style={{ width: "80px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr
                    key={q.id}
                    draggable
                    onDragStart={() => setDraggingId(q.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(q.id)}
                    style={{ background: draggingId === q.id ? "var(--primary-dim)" : undefined }}
                  >
                    <td style={{ color: "var(--muted)", cursor: "grab", textAlign: "center" }}>⠿</td>
                    <td style={{ color: "var(--muted)" }}>{i + 1}</td>
                    <td style={{ color: "var(--text)", maxWidth: "300px" }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={q.text}>
                        {q.text}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase",
                        padding: "2px 6px", borderRadius: "4px",
                        background: q.type === "mcq" ? "var(--primary-dim)" : "var(--accent-dim)",
                        color: q.type === "mcq" ? "#c4b5fd" : "var(--accent)",
                      }}>
                        {q.type}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", maxWidth: "120px" }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.correct_answer || "—"}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn danger"
                        style={{ fontSize: "0.8rem", padding: "5px 10px" }}
                        onClick={() => setModal({ isOpen: true, id: q.id })}
                        disabled={deletingId === q.id}
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
      </div>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Delete Question"
        message="This will permanently delete the question and all student responses associated with it."
        onConfirm={handleConfirmDelete}
        onCancel={() => setModal({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default Questions;
