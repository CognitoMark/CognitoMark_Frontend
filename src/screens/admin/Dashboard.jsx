"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchDashboard, resetDatabase } from "../../api/adminApi";
import MetricCard from "../../components/MetricCard";
import PasswordModal from "../../components/PasswordModal";
import { useSocket } from "../../hooks/useSocket";
import { useNotify } from "../../components/Toast";

const AdminDashboard = () => {
  const notify = useNotify();
  const clickWindowSeconds = Math.round(
    (Number(process.env.NEXT_PUBLIC_CLICK_WINDOW_MS) || 60000) / 1000,
  );
  const [metrics, setMetrics] = useState({ activeStudents: 0, submittedStudents: 0 });
  const [sessions, setSessions] = useState([]);
  const [clickSeries, setClickSeries] = useState([]);
  const [feed, setFeed] = useState([]);
  const [resetModal, setResetModal] = useState({ open: false, password: "", error: "", pending: false });

  const pushFeed = (message) =>
    setFeed((prev) => [{ id: Date.now() + "-" + Math.random().toString(36).substring(2, 9), message }, ...prev].slice(0, 30));

  const refresh = async () => {
    try {
      const { data } = await fetchDashboard();
      setMetrics(data.metrics);
      setSessions(data.sessions);
      setClickSeries(data.clickSeries || []);
    } catch (err) {
      console.error("Dashboard refresh failed:", err);
      notify.error("Failed to sync dashboard data. Check your connection.", "Sync Error");
    }
  };

  const confirmReset = async () => {
    if (!resetModal.password) {
      setResetModal((p) => ({ ...p, error: "Password is required." }));
      return;
    }
    setResetModal((p) => ({ ...p, pending: true, error: "" }));
    try {
      await resetDatabase({ password: resetModal.password });
      pushFeed("Database reset completed");
      setResetModal({ open: false, password: "", error: "", pending: false });
      refresh();
    } catch (err) {
      setResetModal((p) => ({ ...p, pending: false, error: err?.errorMessage || err?.response?.data?.error || "Failed to reset database" }));
    }
  };

  useEffect(() => { refresh(); }, []);

  const handlers = useMemo(() => ({
    student_started: (p) => { pushFeed(`Student ${p.studentId} started ${p.examTitle}`); refresh(); },
    student_created: (p) => { pushFeed(`Student ${p.student?.student_id || ""} registered`); refresh(); },
    student_deleted: (p) => { pushFeed(`Student ${p.studentId} deleted`); refresh(); },
    session_deleted: ()  => { pushFeed("Session deleted"); refresh(); },
    exam_created:    ()  => { pushFeed("Exam created"); refresh(); },
    exam_deleted:    ()  => { pushFeed("Exam deleted"); refresh(); },
    question_created:()  => { pushFeed("Question added"); refresh(); },
    question_deleted:()  => { pushFeed("Question deleted"); refresh(); },
    click_update:    (p) => { pushFeed(`Clicks updated — session ${p.sessionId}`); refresh(); },
    click_window:    (p) => { pushFeed(`Click window — session ${p.sessionId} (${p.clickCount} clicks)`); refresh(); },
    stress_update:   (p) => { pushFeed(`Stress updated — session ${p.sessionId}`); refresh(); },
    answer_saved:    (p) => { pushFeed(`Answer saved — session ${p.sessionId}`); refresh(); },
    navigation:      (p) => { pushFeed(`Navigation ${p.direction} — session ${p.sessionId}`); refresh(); },
    exam_submitted:  (p) => { pushFeed(`Exam submitted — session ${p.sessionId}`); refresh(); },
  }), []);

  useSocket(handlers);

  return (
    <div className="container">

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Live Dashboard</h2>
          <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
            Real-time exam monitoring
          </p>
        </div>
        <button
          className="btn danger"
          onClick={() => setResetModal({ open: true, password: "", error: "", pending: false })}
          style={{ fontSize: "0.8rem", padding: "7px 14px" }}
        >
          Reset Database
        </button>
      </div>

      {/* ── Metric cards ── */}
      <div className="dashboard-metrics" style={{ marginBottom: "20px" }}>
        <MetricCard label="Active Students" value={metrics.activeStudents} icon="🟢" />
        <MetricCard label="Submitted" value={metrics.submittedStudents} icon="✅" />
      </div>

      {/* ── Two-column section: feed + sessions ── */}
      <div className="dashboard-main-grid">

        {/* Activity feed */}
        <div className="card" style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>Activity Feed</span>
            <span style={{ fontSize: "0.7rem", background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(63,185,80,0.3)", borderRadius: "99px", padding: "1px 8px", fontWeight: 600 }}>
              LIVE
            </span>
          </div>
          <div className="feed">
            {feed.map((f) => (
              <div key={f.id} className="feed-item">{f.message}</div>
            ))}
            {!feed.length && <div className="feed-item" style={{ textAlign: "center" }}>No events yet</div>}
          </div>
        </div>

        {/* Active sessions table */}
        <div className="card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>
            Active Sessions
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Student</th>
                  <th>Exam</th>
                  <th>Clicks</th>
                  <th>Avg Stress</th>
                  <th>Violations</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "var(--muted)", padding: "24px 0" }}>No sessions yet</td></tr>
                )}
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td><Link href={`/admin/session/${s.id}`}>#{s.id}</Link></td>
                    <td>{s.student_id}{s.name ? ` — ${s.name}` : ""}</td>
                    <td>{s.exam_title}</td>
                    <td>{s.total_clicks}</td>
                    <td>{Number(s.avg_stress_level || 0).toFixed(1)}</td>
                    <td>
                      {s.violation_count > 0
                        ? <span className="badge">{s.violation_count}</span>
                        : <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                    <td>
                      {s.submitted_at
                        ? <span className="badge success">Submitted</span>
                        : <span className="badge info">Active</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Click windows table ── */}
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>
          Recent Click Windows &nbsp;
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 400 }}>
            (window = {clickWindowSeconds}s)
          </span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Exam</th>
                <th>Question #</th>
                <th>Window Start</th>
                <th>Window End</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {clickSeries.map((row, idx) => (
                <tr key={`${row.session_id}-${row.window_start}-${idx}`}>
                  <td>{row.student_id}</td>
                  <td>{row.exam_title}</td>
                  <td>{row.question_number ?? "—"}</td>
                  <td>{new Date(row.window_start).toLocaleTimeString()}</td>
                  <td>{new Date(row.window_end).toLocaleTimeString()}</td>
                  <td>{row.click_count}</td>
                </tr>
              ))}
              {!clickSeries.length && (
                <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--muted)", padding: "24px 0" }}>No click windows yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PasswordModal
        isOpen={resetModal.open}
        title="Reset Database"
        message="This will permanently delete all sessions, exams, questions, students, and telemetry data. Enter your admin password to confirm."
        password={resetModal.password}
        onPasswordChange={(v) => setResetModal((p) => ({ ...p, password: v, error: "" }))}
        onConfirm={confirmReset}
        onCancel={() => setResetModal({ open: false, password: "", error: "", pending: false })}
        confirmText={resetModal.pending ? "Resetting…" : "Reset"}
        error={resetModal.error}
        pending={resetModal.pending}
      />
    </div>
  );
};

export default AdminDashboard;
