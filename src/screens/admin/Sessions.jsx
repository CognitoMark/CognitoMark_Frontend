"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchSessionDetail, fetchSessions } from "../../api/adminApi";
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

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const clickWindowSeconds = Math.round(
    (Number(process.env.NEXT_PUBLIC_CLICK_WINDOW_MS) || 60000) / 1000,
  );
  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return String(value);
    return date.toLocaleString();
  };

  const exportToCsv = async () => {
    if (!sessions.length) return;

    const detailResults = await Promise.all(
      sessions.map(async (session) => {
        try {
          const { data } = await fetchSessionDetail(session.id);
          return { session: data.session, responses: data.responses || [] };
        } catch (error) {
          return { session, responses: [] };
        }
      }),
    );

    const headers = [
      "Session ID",
      "Student ID",
      "Student Name",
      "Exam Title",
      "Started At",
      "Ended At",
      "Status",
      "Session Violations",
      "Session Total Clicks",
      "Session Avg Stress",
      "End of Exam Stress",
      "Session Feedback",
      "Score Obtained",
      "Score Total",
      "Question Text",
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

    const rows = detailResults.flatMap(({ session, responses }) => {
      const baseRow = [
        session.id,
        session.student_id,
        session.name || "-",
        session.exam_title,
        formatDateTime(session.started_at),
        formatDateTime(session.submitted_at),
        session.submitted_at ? "Submitted" : "Active",
        session.violation_count || 0,
        session.total_clicks || 0,
        Math.round(Number(session.avg_stress_level || 0)),
        Math.round(Number(session.stress_level || 0)),
        session.feedback || "-",
        session.score_obtained ?? 0,
        session.score_total ?? 0,
      ];

      const emptyBaseRow = new Array(baseRow.length).fill("");

      if (!responses.length) {
        return [[
          ...baseRow,
          ...new Array(headers.length - baseRow.length).fill("-")
        ]];
      }

      return responses.map((r, index) => [
        ...(index === 0 ? baseRow : emptyBaseRow),
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
    });

    const csv = [
      buildCsv(["Click Window (sec)", clickWindowSeconds], []),
      "",
      buildCsv(headers, rows),
    ].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sessions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const load = async () => {
    try {
      const { data } = await fetchSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to load sessions", error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlers = useMemo(
    () => ({
      student_started: () => load(),
      exam_submitted: () => load(),
      session_deleted: () => load(),
      click_update: () => load(),
      click_window: () => load(),
      stress_update: () => load(),
      answer_saved: () => load(),
      navigation: () => load(),
    }),
    [],
  );

  useSocket(handlers);

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Sessions</h2>
          <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
            All exam sessions — click a row to see details
          </p>
        </div>
        <button
          className="btn export-btn"
          type="button"
          onClick={exportToCsv}
          disabled={!sessions.length}
        >
          ↓ Export CSV
        </button>
      </div>
      <div className="card">
        {sessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--muted)",
            }}
          >
            No exam sessions yet.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Exam</th>
                <th>Total Clicks</th>
                <th>Avg Stress</th>
                <th>Violations</th>
                <th>Started</th>
                <th>Ended</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  className="row-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    window.location.href = `/admin/session/${s.id}`;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      window.location.href = `/admin/session/${s.id}`;
                    }
                  }}
                >
                  <td>{s.student_id}</td>
                  <td>{s.exam_title}</td>
                  <td>{s.total_clicks}</td>
                  <td>{Math.round(Number(s.avg_stress_level || 0))}</td>
                  <td>
                    {s.violation_count > 0 ? (
                      <span className="badge">
                        {s.violation_count} violations
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{formatDateTime(s.started_at)}</td>
                  <td>{formatDateTime(s.submitted_at)}</td>
                  <td>{s.submitted_at ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Sessions;
