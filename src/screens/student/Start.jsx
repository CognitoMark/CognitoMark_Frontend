"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { startExam } from "../../api/studentApi";
import { storage } from "../../utils/storage";
import { useNotify } from "../../components/Toast";

const DOS = [
  "Stay on this browser tab and window at all times.",
  "Answer all questions before submitting.",
  "Use the difficulty slider to rate how hard each question felt.",
  "Use the question navigator on the left to jump between questions.",
  "Click \"Submit Exam\" only when you have answered all questions.",
];

const DONTS = [
  "Do not switch browser tabs or open new windows.",
  "Do not minimize the browser window.",
  "Do not press F11 to exit fullscreen mode.",
  "Do not use keyboard shortcuts like Ctrl+T, Ctrl+W, or Alt+Tab.",
  "Do not leave or refresh the page — your session will be lost.",
];

const StartExam = () => {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [selected, setSelected] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    const saved = storage.get("exams") || [];
    setExams(saved);
  }, []);

  const handleStart = async () => {
    try {
      const student = storage.get("student");
      if (!student) {
        router.push("/");
        return;
      }
      const { data } = await startExam(selected, {
        studentId: student.student_id,
      });
      storage.set("session", data.session);
      storage.set("exam", data.exam);
      storage.set("questions", data.questions);
      localStorage.setItem("sessionId", String(data.session.id));
      localStorage.setItem("examId", String(data.exam.id));
      router.push("/exam");
    } catch (err) {
      notify.error(err?.errorMessage || err?.response?.data?.error || "Unable to start exam", "Start Failed");
    }
  };

  const selectedExam = exams.find((e) => String(e.id) === selected);

  return (
    <div className="start-layout">

      {/* ── Left panel: Instructions ── */}
      <div className="start-left-panel">
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <Image src="/favicon.png" alt="CognitoMark" width={36} height={36} style={{ borderRadius: "8px", flexShrink: 0 }} />
            <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Exam Instructions</h2>
          </div>
          <p style={{ color: "var(--muted)", marginBottom: "32px", fontSize: "0.9rem" }}>
            Read all instructions carefully before starting your exam.
          </p>

          {/* DO section */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--green)",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <span>✔</span> Please Do
            </div>
            <div style={{ display: "grid", gap: "10px" }}>
              {DOS.map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  padding: "12px 16px",
                  background: "rgba(63, 185, 80, 0.06)",
                  border: "1px solid rgba(63, 185, 80, 0.2)",
                  borderRadius: "var(--r-md)",
                }}>
                  <span style={{ color: "var(--green)", fontWeight: 700, marginTop: "1px", flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DON'T section */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--danger)",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <span>✖</span> Do Not
            </div>
            <div style={{ display: "grid", gap: "10px" }}>
              {DONTS.map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  padding: "12px 16px",
                  background: "rgba(248, 81, 73, 0.06)",
                  border: "1px solid rgba(248, 81, 73, 0.2)",
                  borderRadius: "var(--r-md)",
                }}>
                  <span style={{ color: "var(--danger)", fontWeight: 700, marginTop: "1px", flexShrink: 0 }}>✕</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>

      {/* ── Right panel: Exam Picker ── */}
      <div className="start-right-panel">
        <div className="login-card" style={{ width: "100%", padding: "36px" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "6px" }}>Ready to begin?</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "28px" }}>
            Select your exam and confirm that you have read the instructions.
          </p>

          {/* Exam selector */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="exam-picker-trigger" style={{
              display: "block",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: "6px",
            }}>
              Select Exam
            </label>
            <button
              id="exam-picker-trigger"
              type="button"
              onClick={() => setPickerOpen(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                color: selectedExam ? "var(--text)" : "var(--muted)",
                fontSize: "0.875rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span>{selectedExam ? selectedExam.title : "Choose an exam…"}</span>
              <span style={{ opacity: 0.5, fontSize: "0.75rem" }}>▾</span>
            </button>
          </div>

          {/* Violation notice */}
          <div style={{
            padding: "12px 14px",
            background: "rgba(210, 153, 34, 0.08)",
            border: "1px solid rgba(210, 153, 34, 0.3)",
            borderRadius: "var(--r-md)",
            fontSize: "0.825rem",
            color: "var(--amber)",
            lineHeight: 1.6,
            marginBottom: "16px",
          }}>
            <strong>⚠ Violation policy:</strong> Switching tabs, minimizing, or exiting fullscreen is recorded as a violation. After <strong>3 violations</strong>, your exam is automatically submitted.
          </div>

          {/* Agreement checkbox */}
          <label htmlFor="agreement-checkbox" style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "14px 16px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            cursor: "pointer",
            marginBottom: "20px",
          }}>
            <input
              id="agreement-checkbox"
              name="agreed"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: "2px", accentColor: "var(--primary)", flexShrink: 0, width: "15px", height: "15px" }}
            />
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              I have read and understood the instructions and agree to comply with the exam rules.
            </span>
          </label>

          <button
            className="btn"
            onClick={handleStart}
            disabled={!selected || !agreed}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "0.95rem",
              fontWeight: 600,
            }}
          >
            Start Exam →
          </button>

          {(!selected || !agreed) && (
            <p style={{
              textAlign: "center",
              fontSize: "0.8rem",
              color: "var(--muted)",
              marginTop: "10px",
            }}>
              {!selected ? "Select an exam to continue" : "Please confirm you have read the instructions"}
            </p>
          )}
        </div>
      </div>

      {/* Exam picker modal */}
      {pickerOpen && (
        <div className="modal-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Exam</h3>
            </div>
            <div className="modal-body">
              {exams.length === 0 ? (
                <p style={{ textAlign: "center" }}>No exams available at this time.</p>
              ) : (
                <div className="exam-picker">
                  {exams.map((exam) => (
                    <button
                      key={exam.id}
                      type="button"
                      className={`exam-option${String(exam.id) === selected ? " selected" : ""}`}
                      onClick={() => {
                        setSelected(String(exam.id));
                        setPickerOpen(false);
                      }}
                    >
                      {exam.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn secondary" type="button" onClick={() => setPickerOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartExam;
