"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchSessionDetail } from "../../api/adminApi";
import { useSocket } from "../../hooks/useSocket";
const toCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildCsv = (headers, rows) => {
  const lines = [];
  if (headers?.length) {
    lines.push(headers.map(toCsvValue).join(","));
  }
  rows.forEach((row) => {
    lines.push(row.map(toCsvValue).join(","));
  });
  return lines.join("\r\n");
};

const formatAnswerSwitches = (switches) => {
  if (!Array.isArray(switches) || switches.length === 0) return "";
  return switches
    .map((entry) => `${entry.from ?? "-"} -> ${entry.to ?? "-"}`)
    .join(" | ");
};

const formatSelectionTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);
  return date.toLocaleString();
};

const formatSwitchTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);
  return date.toLocaleString();
};

const SessionDetail = () => {
  const clickWindowSeconds = Math.round(
    (Number(process.env.NEXT_PUBLIC_CLICK_WINDOW_MS) || 60000) / 1000,
  );
  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return String(value);
    return date.toLocaleString();
  };
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [navigationTransitions, setNavigationTransitions] = useState([]);

  const load = async () => {
    try {
      const { data } = await fetchSessionDetail(id);
      setSession(data.session);
      setResponses(data.responses);
      setNavigationTransitions(data.navigationTransitions || []);
    } catch (error) {
      console.error("Failed to load session details", error);
    }
  };

  const exportSessionToCsv = async () => {
    if (!session) return;

    const summaryHeaders = ["Field", "Value"];
    const summaryRows = [
      ["Session ID", session.id],
      ["Student", `${session.student_id} - ${session.name}`],
      ["Exam", session.exam_title],
      ["Started", formatDateTime(session.started_at)],
      ["Submitted", formatDateTime(session.submitted_at)],
      ["Status", session.submitted_at ? "Submitted" : "Active"],
      ["Session Violations", session.violation_count || 0],
      ["Total Clicks", session.total_clicks || 0],
      ["Avg Stress", Math.round(Number(session.avg_stress_level || 0))],
      ["Final Stress Level", Math.round(Number(session.stress_level || 0))],
      ["Feedback", session.feedback || "-"],
      ["Score", `${session.score_obtained ?? 0} / ${session.score_total ?? 0}`],
      ["Click Window (sec)", clickWindowSeconds],
    ];

    const responseHeaders = [
      "Question",
      "Student Answer",
      "Correct Answer",
      "Is Correct",
      "Question Avg Stress",
      "Question Violations",
      "Total Switches",
      "Answer Switches",
      "Question Clicks",
      "Header Clicks",
      "Stress Bar Clicks",
      "Nav Clicks (Prev)",
      "Nav Clicks (Next)",
      "Other Clicks",
    ];

    const responseRows = responses.map((r) => [
      r.text,
      r.answer || "-",
      r.correct_answer || "-",
      r.is_correct ? "Yes" : "No",
      Math.round(Number(r.avg_stress_level || 0)),
      r.violation_count || 0,
      r.total_switches || 0,
      formatAnswerSwitches(r.answer_switches),
      r.question_clicks || 0,
      r.header_clicks || 0,
      r.stress_clicks || 0,
      r.prev_clicks || 0,
      r.next_clicks || 0,
      r.other_clicks || 0,
    ]);

    const navigationHeaders = [
      "From Question #",
      "To Question #",
      "Direction",
      "Count",
    ];
    const navigationRows = navigationTransitions.map((row) => [
      row.from_question_number ?? row.from_question_id ?? "",
      row.to_question_number ?? row.to_question_id ?? "",
      row.direction,
      row.count,
    ]);

    const csv = [
      "Summary",
      buildCsv(summaryHeaders, summaryRows),
      "",
      "Responses",
      buildCsv(responseHeaders, responseRows),
      "",
      "Navigation",
      buildCsv(navigationHeaders, navigationRows),
    ].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `session_${session.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (id) {
      load();
    }
  }, [id]);

  const handlers = useMemo(
    () => ({
      click_update: (payload) => {
        if (String(payload.sessionId) === String(id)) {
          load();
        }
      },
      click_window: (payload) => {
        if (String(payload.sessionId) === String(id)) {
          load();
        }
      },
      stress_update: (payload) => {
        if (String(payload.sessionId) === String(id)) {
          load();
        }
      },
      answer_saved: (payload) => {
        if (String(payload.sessionId) === String(id)) {
          load();
        }
      },
      navigation: (payload) => {
        if (String(payload.sessionId) === String(id)) {
          load();
        }
      },
      exam_submitted: (payload) => {
        if (String(payload.sessionId) === String(id)) {
          load();
        }
      },
    }),
    [id],
  );

  useSocket(handlers);

  if (!session) {
    return (
      <div className="container">
        <div className="card">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>Session Detail</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn export-btn" type="button" onClick={exportSessionToCsv}>
            ↓ Export CSV
          </button>
          <Link href="/admin/sessions" className="btn secondary">
            ← Back to Sessions
          </Link>
        </div>
      </div>
      <div className="card">
        <div className="grid two">
          <div>
            <strong>Student:</strong> {session.student_id} - {session.name}
          </div>
          <div>
            <strong>Exam:</strong> {session.exam_title}
          </div>
          <div>
            <strong>Clicks:</strong> {session.total_clicks}
          </div>
          <div>
            <strong>Avg Stress:</strong>{" "}
            {Math.round(Number(session.avg_stress_level || 0))}
          </div>
          <div>
            <strong>Violations:</strong>{" "}
            {session.violation_count > 0 ? (
              <span className="badge">{session.violation_count} violations</span>
            ) : (
              "-"
            )}
          </div>
          <div>
            <strong>Started:</strong> {formatDateTime(session.started_at)}
          </div>
          <div>
            <strong>Submitted:</strong> {formatDateTime(session.submitted_at)}
          </div>
          <div>
            <strong>Score:</strong> {session.score_obtained ?? 0} /{" "}
            {session.score_total ?? 0}
          </div>
          <div>
            <strong>Latest Answer:</strong> {session.latest_answer || "-"}
          </div>
          <div>
            <strong>Latest Question:</strong> {session.latest_question_text || "-"}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>📊 Responses</h3>
          {session.violation_count > 0 && (
            <span className="badge">{session.violation_count} violations</span>
          )}
        </div>
        <div className="grid">
          {responses.map((r) => (
            <div
              key={r.id}
              className="card"
              style={{ background: "var(--card-2)" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "15px" }}>
                    <strong>Q:</strong> {r.text}
                  </p>
                  <div style={{ marginTop: "10px" }}>
                    <strong>A:</strong> {r.answer || "-"}
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--muted)" }}>
                    <strong>Correct answer:</strong> {r.correct_answer || "-"}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: "180px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      alignItems: "flex-end",
                    }}
                  >
                    <div className="badge">{r.click_count} total clicks</div>
                    {r.violation_count > 0 && (
                      <span className="badge">
                        {r.violation_count} violations
                      </span>
                    )}
                    <span
                      className="badge"
                      style={{
                        background: r.is_correct
                          ? "var(--green-dim)"
                          : "var(--danger-dim)",
                        color: r.is_correct ? "#6ee7b7" : "#fca5a5",
                        borderColor: r.is_correct
                          ? "rgba(16, 185, 129, 0.4)"
                          : "rgba(239, 68, 68, 0.4)",
                      }}
                    >
                      {r.is_correct ? "✓ Correct" : "✗ Wrong"}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "12px",
                      textAlign: "right",
                      display: "grid",
                      gap: "6px",
                    }}
                  >
                    <div>
                      <strong>Prev:</strong> {r.prev_clicks || 0} |{" "}
                      <strong>Next:</strong> {r.next_clicks || 0}
                    </div>
                    <div>
                      <strong>Stress:</strong>{" "}
                      {Math.round(Number(r.avg_stress_level || 0))}
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "11px",
                  color: "var(--muted)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "6px 12px",
                }}
              >
                <span>Header: {r.header_clicks}</span>
                <span>Stress Bar: {r.stress_clicks}</span>
                <span>Panel: {r.panel_clicks || 0}</span>
                <span>Question: {r.question_clicks}</span>
                <span>Navigation: {r.footer_clicks}</span>
                <span>Other: {r.other_clicks}</span>
              </div>
              {r.type === "mcq" && (
                <div style={{ marginTop: "16px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "12px", marginBottom: "6px" }}>
                        <strong>Switches</strong> (total {r.total_switches || 0})
                      </div>
                      {r.answer_switches?.length ? (
                        <div className="table-wrap compact">
                          <table className="table compact-time">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.answer_switches.map((entry, idx) => (
                                <tr key={`${r.id}-switch-${idx}`}>
                                  <td>{idx + 1}</td>
                                  <td>{entry.from ?? "-"}</td>
                                  <td>{entry.to ?? "-"}</td>
                                  <td>{formatSwitchTime(entry.at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ color: "var(--muted)" }}>-</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", marginBottom: "6px" }}>
                        <strong>Answer selections</strong>
                      </div>
                      {r.answer_selections?.length ? (
                        <div className="table-wrap compact">
                          <table className="table compact-time">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Option</th>
                                <th>Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.answer_selections.map((entry, idx) => (
                                <tr key={`${r.id}-selection-${idx}`}>
                                  <td>{idx + 1}</td>
                                  <td>{entry.answer}</td>
                                  <td>{formatSelectionTime(entry.at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ color: "var(--muted)" }}>-</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>🗺 Question Navigation</h3>
        </div>
        {navigationTransitions.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>
            No navigation transitions recorded yet.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>From #</th>
                  <th>To #</th>
                  <th>Direction</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {navigationTransitions.map((row, idx) => (
                  <tr
                    key={`${row.from_question_id}-${row.to_question_id}-${row.direction}-${idx}`}
                  >
                    <td>{row.from_question_number ?? row.from_question_id ?? "-"}</td>
                    <td>{row.to_question_number ?? row.to_question_id ?? "-"}</td>
                    <td>{row.direction}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetail;
