"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchSessionDetail, fetchSessions, fetchSessionsDetailsBulk } from "../../api/adminApi";
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

const EXPORT_HEADERS = [
  "Record Type",
  "Session ID",
  "Student ID",
  "Student Name",
  "Exam ID",
  "Exam Title",
  "Session Started At",
  "Session Submitted At",
  "Session Created At",
  "Session Updated At",
  "Session Feedback",
  "Session Total Clicks",
  "Session Avg Stress",
  "Session Overall Stress",
  "Session Violations",
  "Score Total",
  "Score Obtained",
  "Click Window Config Sec",
  "Click Window Start",
  "Click Window End",
  "Question ID",
  "Question Text",
  "To Question ID",
  "To Question Text",
  "From Question Number",
  "To Question Number",
  "Direction",
  "Answer",
  "Is Correct",
  "Response Created At",
  "Response Updated At",
  "Total Switches",
  "Answer Switches",
  "Click Count",
  "Header Clicks",
  "Integrity Clicks",
  "Stress Clicks",
  "Panel Clicks",
  "Question Clicks",
  "Footer Clicks",
  "Other Clicks",
  "Stress Level",
  "Event ID",
  "Event Type",
  "Event Created At",
  "Event Updated At",
  "Event Value",
];

const EXPORT_DATETIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const formatExportDateTime = (value, emptyValue = "-") => {
  if (!value) return emptyValue;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);
  return EXPORT_DATETIME_FORMATTER.format(date);
};

const toRoundedNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : fallback;
};

const toNumberOr = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toNumberOrBlank = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : "";
};

const toEventValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return typeof value === "string" ? value : JSON.stringify(value);
};

const buildExportRow = (baseRecord, overrides = {}) => {
  const row = Object.fromEntries(EXPORT_HEADERS.map((header) => [header, ""]));
  Object.assign(row, baseRecord, overrides);
  return EXPORT_HEADERS.map((header) => row[header]);
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

  const buildSessionBaseRecord = (session) => ({
    "Session ID": session.id ?? "",
    "Student ID": session.student_id ?? "",
    "Student Name": session.name ?? "",
    "Exam ID": session.exam_id ?? "",
    "Exam Title": session.exam_title ?? "",
    "Session Started At": formatExportDateTime(session.started_at, ""),
    "Session Submitted At": formatExportDateTime(session.submitted_at, "-"),
    "Session Created At": formatExportDateTime(
      session.created_at ?? session.started_at,
      "-",
    ),
    "Session Updated At": formatExportDateTime(session.updated_at, "-"),
    "Session Feedback": session.feedback ?? "",
    "Session Total Clicks": toNumberOr(session.total_clicks, 0),
    "Session Avg Stress": toRoundedNumber(session.avg_stress_level, 0),
    "Session Overall Stress": toRoundedNumber(session.stress_level, 0),
    "Session Violations": toNumberOr(session.violation_count, 0),
    "Score Total": toNumberOr(session.score_total, 0),
    "Score Obtained": toNumberOr(session.score_obtained, 0),
    "Click Window Config Sec": clickWindowSeconds,
  });

  const exportToCsv = async () => {
    if (!sessions.length) return;

    try {
      const sessionIds = sessions.map(s => s.id);
      const { data } = await fetchSessionsDetailsBulk(sessionIds);
      
      const detailResults = data.details.map((detail) => ({
        session: detail.session || sessionIds.find(id => id === detail.session?.id) || {},
        responses: detail.responses || [],
        navigationTransitions: detail.navigationTransitions || [],
        clickWindows: detail.clickWindows || [],
        telemetryEvents: detail.telemetryEvents || [],
      }));

      const rows = detailResults.flatMap(
      ({
        session,
        responses,
        navigationTransitions,
        clickWindows,
        telemetryEvents,
      }) => {
        const baseRecord = buildSessionBaseRecord(session);
        const questionTextById = responses.reduce((acc, response) => {
          if (Number.isFinite(Number(response.question_id)) && response.text) {
            acc[response.question_id] = response.text;
          }
          return acc;
        }, {});

        const sessionRows = [
          buildExportRow(baseRecord, { "Record Type": "SESSION_SUMMARY" }),
        ];

        clickWindows.forEach((windowRow) => {
          sessionRows.push(
            buildExportRow(baseRecord, {
              "Record Type": "CLICK_WINDOW",
              "Click Window Start": formatExportDateTime(
                windowRow.window_start,
                "",
              ),
              "Click Window End": formatExportDateTime(windowRow.window_end, ""),
              "Question ID": windowRow.question_id ?? "",
              "Question Text":
                windowRow.question_text ||
                questionTextById[windowRow.question_id] ||
                "",
              "Click Count": toNumberOr(windowRow.click_count, 0),
              "Header Clicks": toNumberOr(windowRow.header_clicks, 0),
              "Integrity Clicks": toNumberOr(windowRow.integrity_clicks, 0),
              "Stress Clicks": toNumberOr(windowRow.stress_clicks, 0),
              "Panel Clicks": toNumberOr(windowRow.panel_clicks, 0),
              "Question Clicks": toNumberOr(windowRow.question_clicks, 0),
              "Footer Clicks": toNumberOr(windowRow.footer_clicks, 0),
              "Other Clicks": toNumberOr(windowRow.other_clicks, 0),
              "Stress Level": toRoundedNumber(windowRow.stress_level, 0),
            }),
          );
        });

        responses.forEach((response) => {
          sessionRows.push(
            buildExportRow(baseRecord, {
              "Record Type": "RESPONSE",
              "Question ID": response.question_id ?? "",
              "Question Text": response.text ?? "",
              Answer: response.answer ?? "",
              "Is Correct":
                typeof response.is_correct === "boolean"
                  ? String(response.is_correct)
                  : "",
              "Response Created At": formatExportDateTime(response.created_at, ""),
              "Response Updated At": formatExportDateTime(response.updated_at, ""),
              "Total Switches": toNumberOr(response.total_switches, 0),
              "Answer Switches": formatAnswerSwitches(response.answer_switches),
              "Click Count": toNumberOr(response.click_count, 0),
              "Header Clicks": toNumberOr(response.header_clicks, 0),
              "Integrity Clicks": toNumberOr(response.integrity_clicks, 0),
              "Stress Clicks": toNumberOr(response.stress_clicks, 0),
              "Panel Clicks": toNumberOr(response.panel_clicks, 0),
              "Question Clicks": toNumberOr(response.question_clicks, 0),
              "Footer Clicks": toNumberOr(response.footer_clicks, 0),
              "Other Clicks": toNumberOr(response.other_clicks, 0),
              "Stress Level": toRoundedNumber(response.avg_stress_level, 0),
            }),
          );
        });

        navigationTransitions.forEach((transition) => {
          sessionRows.push(
            buildExportRow(baseRecord, {
              "Record Type": "NAVIGATION_SUMMARY",
              "Question ID": transition.from_question_id ?? "",
              "Question Text": transition.from_question_text ?? "",
              "To Question ID": transition.to_question_id ?? "",
              "To Question Text": transition.to_question_text ?? "",
              "From Question Number": transition.from_question_number ?? "",
              "To Question Number": transition.to_question_number ?? "",
              Direction: transition.direction ?? "",
              "Stress Level": toNumberOrBlank(transition.count),
            }),
          );
        });

        telemetryEvents.forEach((event) => {
          sessionRows.push(
            buildExportRow(baseRecord, {
              "Record Type": "TELEMETRY_EVENT",
              "Question ID": event.question_id ?? "",
              "Question Text": event.question_text ?? "",
              "To Question ID": event.to_question_id ?? "",
              "To Question Text": event.to_question_text ?? "",
              "From Question Number": event.from_question_number ?? "",
              "To Question Number": event.to_question_number ?? "",
              Direction: event.direction ?? "",
              "Event ID": event.id ?? "",
              "Event Type": event.type ?? "",
              "Event Created At": formatExportDateTime(event.created_at, ""),
              "Event Updated At": formatExportDateTime(event.updated_at, "-"),
              "Event Value": toEventValue(event.value),
            }),
          );
        });

        return sessionRows;
      },
    );

    const csv = buildCsv(EXPORT_HEADERS, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sessions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export sessions data", error);
    }
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
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Sessions</h2>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "0.8rem",
              color: "var(--muted)",
            }}
          >
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
