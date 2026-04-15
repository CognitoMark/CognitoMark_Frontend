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
      "Student",
      "Exam",
      "Started",
      "Ended",
      "Submitted",
      "Avg Stress",
      "Total Clicks",
      "Question Text",
      "Answer",
      "Question Stress",
      "Response Clicks",
      "Response Header",
      "Response Stress Bar",
      "Response Question",
      "Response Prev",
      "Response Next",
      "Response Other",
    ];

    const rows = detailResults.flatMap(({ session, responses }) => {
      const baseRow = [
        session.id,
        session.student_id,
        session.exam_title,
        formatDateTime(session.started_at),
        formatDateTime(session.submitted_at),
        session.submitted_at ? "Yes" : "No",
        Math.round(Number(session.avg_stress_level || 0)),
        session.total_clicks,
      ];

      const emptyBaseRow = new Array(baseRow.length).fill("");

      if (!responses.length) {
        return [[
          ...baseRow,
          "-",
          "-",
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
        ]];
      }

      return responses.map((r, index) => [
        ...(index === 0 ? baseRow : emptyBaseRow),
        r.text,
        r.answer || "-",
        Math.round(Number(r.avg_stress_level || 0)),
        r.click_count,
        r.header_clicks,
        r.stress_clicks,
        r.question_clicks,
        r.prev_clicks || 0,
        r.next_clicks || 0,
        r.other_clicks,
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
