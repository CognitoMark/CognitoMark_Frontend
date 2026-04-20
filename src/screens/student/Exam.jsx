"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { debounce } from "../../utils/debounce";
import { storage } from "../../utils/storage";
import {
  logAnswerSelection,
  logClickFrequency,
  logNavigation,
  logViolation,
  saveResponse,
  submitExam,
  updateStress,
} from "../../api/sessionApi";
import { useNotify } from "../../components/Toast";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

const hasAnswerValue = (value) => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return true;
};

const resolveViolationThreshold = () => {
  const rawValue = process.env.NEXT_PUBLIC_VIOLATION_THRESHOLD;
  const configured = Number(rawValue);
  return Number.isFinite(configured) && configured > 0 ? configured : 3;
};

const VIOLATION_THRESHOLD = resolveViolationThreshold();
const VIOLATION_WARNING =
  "A violation has been made! Tab switching or minimizing is not allowed during the exam.";

const resolveClickWindowMs = () => {
  const rawValue = process.env.NEXT_PUBLIC_CLICK_WINDOW_MS;
  const configured = Number(rawValue);
  return Number.isFinite(configured) && configured > 0 ? configured : 60000;
};

const CLICK_WINDOW_MS = resolveClickWindowMs();

const StudentExam = () => {
  const [sessionData, setSessionData] = useState(() => storage.get("session"));
  const [exam, setExam] = useState(() => storage.get("exam"));
  const [questions, setQuestions] = useState(
    () => storage.get("questions") || [],
  );
  const [sessionId, setSessionId] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("sessionId") : null,
  );

  const [answers, setAnswers] = useState({});
  const [stress, setStress] = useState(0);
  const [submitted, setSubmitted] = useState(() =>
    Boolean(storage.get("session")?.submitted_at),
  );
  const [status, setStatus] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [violationModal, setViolationModal] = useState({
    visible: false,
    message: "",
  });
  const [forcedExitModal, setForcedExitModal] = useState({
    visible: false,
    message: "",
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const notify = useNotify();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline) {
      notify.warning("You are currently offline. Your progress will be synced once connection is restored.", "Network Issue");
    } else if (isOnline && status === "Offline") {
      notify.success("Connection restored. Syncing your progress...", "Back Online");
      setStatus("");
    }
  }, [isOnline, notify]);

  const sectionClicksRef = useRef({
    header: 0,
    integrity: 0,
    stress: 0,
    panel: 0,
    question: 0,
    footer: 0,
    other: 0,
  });

  const router = useRouter();
  const redirectTimeoutRef = useRef(null);
  const enforcementActive = Boolean(sessionData?.id) && !submitted;
  const clickWindowStartRef = useRef(null);
  const clickCountRef = useRef(0);
  const clickQueueRef = useRef([]);
  const flushInProgressRef = useRef(false);
  const clickTimerRef = useRef(null);
  const enforcementStartRef = useRef(0);
  const hasFullscreenRef = useRef(false);
  const lastViolationTimeRef = useRef(0);
  const ENFORCEMENT_GRACE_MS = 1500;

  useEffect(
    () => () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    },
    [],
  );

  const clearSessionArtifacts = useCallback(() => {
    ["session", "exam", "questions", "student", "exams"].forEach((key) =>
      storage.remove(key),
    );
    ["studentDbId", "sessionId", "examId"].forEach((key) =>
      localStorage.removeItem(key),
    );
    setSessionData(null);
    setExam(null);
    setQuestions([]);
    setSessionId(null);
    setAnswers({});
    setStress(0);
    setViolationCount(0);
    setViolationModal({ visible: false, message: "" });
    setForcedExitModal({ visible: false, message: "" });
  }, []);

  const flushClickQueue = useCallback(async () => {
    if (!sessionData?.id || flushInProgressRef.current) {
      return;
    }
    flushInProgressRef.current = true;
    try {
      while (clickQueueRef.current.length > 0) {
        const payload = clickQueueRef.current[0];
        await logClickFrequency(sessionData.id, payload);
        clickQueueRef.current.shift();
      }
    } finally {
      flushInProgressRef.current = false;
    }
  }, [sessionData?.id]);

  const queueClickWindow = useCallback(
    async (windowStart, windowEnd, clickCount) => {
      const currentQuestion = questions[currentQuestionIndex];
      const sectionClicks = { ...sectionClicksRef.current };

      // Reset section clicks for the next window
      sectionClicksRef.current = {
        header: 0,
        integrity: 0,
        stress: 0,
        panel: 0,
        question: 0,
        footer: 0,
        other: 0,
      };

      const payload = {
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
        questionId: currentQuestion?.id,
        headerClicks: sectionClicks.header,
        integrityClicks: sectionClicks.integrity,
        stressClicks: sectionClicks.stress,
        panelClicks: sectionClicks.panel,
        stressLevel: stress,
        questionClicks: sectionClicks.question,
        footerClicks: sectionClicks.footer,
        otherClicks: sectionClicks.other,
        clickCount,
      };
      clickQueueRef.current.push(payload);
      await flushClickQueue();
      return clickQueueRef.current.length === 0;
    },
    [flushClickQueue, questions, currentQuestionIndex, stress],
  );

  const closeCurrentWindow = useCallback(
    async (forceEndTime) => {
      if (!clickWindowStartRef.current) {
        return true;
      }

      const windowStart = clickWindowStartRef.current;
      const windowEnd =
        forceEndTime || new Date(windowStart.getTime() + CLICK_WINDOW_MS);
      const clickCount = clickCountRef.current;

      clickCountRef.current = 0;
      clickWindowStartRef.current = windowEnd;

      return queueClickWindow(windowStart, windowEnd, clickCount);
    },
    [queueClickWindow],
  );

  const requestFullscreen = useCallback(() => {
    const element = document.documentElement;
    if (!document.fullscreenElement && element.requestFullscreen) {
      element.requestFullscreen().catch(() => {
        /* ignore */
      });
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {
        /* ignore */
      });
    }
  }, []);

  const finalizeClientExit = useCallback(
    async (message) => {
      setSubmitted(true);
      setStatus(message);
      if (clickTimerRef.current) {
        clearInterval(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      await closeCurrentWindow(new Date());
      clearSessionArtifacts();
      exitFullscreen();
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      router.replace("/");
    },
    [clearSessionArtifacts, closeCurrentWindow, exitFullscreen, router],
  );

  useEffect(() => {
    if (!sessionData?.id || !sessionId || (submitted && !forcedExitModal.visible)) {
      setStatus((prev) => prev || "Redirecting to login...");
      exitFullscreen();
      router.replace("/");
    }
  }, [sessionData, sessionId, submitted, forcedExitModal.visible, exitFullscreen, router]);

  useEffect(
    () => () => {
      exitFullscreen();
    },
    [exitFullscreen],
  );

  useEffect(() => {
    if (enforcementActive) {
      enforcementStartRef.current = Date.now();
      hasFullscreenRef.current = Boolean(
        typeof document !== "undefined" && document.fullscreenElement,
      );
      requestFullscreen();
    }
  }, [enforcementActive, requestFullscreen]);

  useEffect(() => {
    if (!enforcementActive) {
      if (clickTimerRef.current) {
        clearInterval(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      clickWindowStartRef.current = null;
      clickCountRef.current = 0;
      clickQueueRef.current = [];
      hasFullscreenRef.current = false;
      return undefined;
    }

    clickWindowStartRef.current = new Date();
    clickTimerRef.current = window.setInterval(() => {
      closeCurrentWindow().catch(() => {
        setStatus("Unable to sync click data. Retrying automatically.");
      });
    }, CLICK_WINDOW_MS);

    return () => {
      if (clickTimerRef.current) {
        clearInterval(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    };
  }, [enforcementActive, closeCurrentWindow]);

  const handleViolation = useCallback(
    async (type, message) => {
      const now = Date.now();
      if (!sessionData?.id || submitted || now - lastViolationTimeRef.current < 2000) {
        return;
      }
      lastViolationTimeRef.current = now;
      const currentQuestion = questions[currentQuestionIndex];
      setViolationModal({ visible: true, message });
      try {
        const { data } = await logViolation(sessionData.id, {
          type,
          questionId: currentQuestion?.id || null,
        });
        setViolationCount(data.violationCount);
        if (data.forcedSubmit) {
          const forcedMessage =
            data.message || "Exam auto-submitted due to repeated violations.";
          if (clickTimerRef.current) {
            clearInterval(clickTimerRef.current);
            clickTimerRef.current = null;
          }
          setSubmitted(true);
          setForcedExitModal({ visible: true, message: forcedMessage });
          setStatus(forcedMessage);
        }
      } catch (error) {
        setStatus(
          error?.errorMessage || error?.response?.data?.error ||
            "Violation detected. Please stay on the exam page.",
        );
      }
    },
    [sessionData?.id, submitted, finalizeClientExit, questions, currentQuestionIndex],
  );

  const handleClick = useCallback(
    (event) => {
      if (!sessionData?.id || submitted) return;

      requestFullscreen();
      clickCountRef.current += 1;

      // Identify which section was clicked
      const clickedSection =
        event.target.closest("[data-section]")?.dataset.section;
      if (
        clickedSection &&
        sectionClicksRef.current[clickedSection] !== undefined
      ) {
        sectionClicksRef.current[clickedSection] += 1;
      } else {
        sectionClicksRef.current.other += 1;
      }
    },
    [sessionData?.id, submitted, requestFullscreen],
  );

  useEffect(() => {
    if (!enforcementActive) {
      return undefined;
    }

    // Global click listener for accurate click counting
    const handleDocumentClick = (event) => {
      handleClick(event);
    };

    // Add global click listener to capture all clicks
    document.addEventListener("click", handleDocumentClick, true);

    const handleVisibility = () => {
      if (Date.now() - enforcementStartRef.current < ENFORCEMENT_GRACE_MS) {
        return;
      }
      if (document.visibilityState === "hidden") {
        handleViolation("MINIMIZE", VIOLATION_WARNING);
      }
    };

    const handleBlur = () => {
      if (Date.now() - enforcementStartRef.current < ENFORCEMENT_GRACE_MS) {
        return;
      }
      handleViolation("TAB_SWITCH", VIOLATION_WARNING);
    };
    const handleFocus = () => {
      // Intentionally do not dismiss the modal here so the student is FORCED 
      // to read the violation message and manually click 'Return to Exam'.
    };

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        hasFullscreenRef.current = true;
        return;
      }
      if (!hasFullscreenRef.current) {
        return;
      }
      if (Date.now() - enforcementStartRef.current < ENFORCEMENT_GRACE_MS) {
        return;
      }
      if (!document.fullscreenElement) {
        handleViolation(
          "FULLSCREEN_EXIT",
          "Fullscreen mode is required during the exam.",
        );
        if (enforcementActive) {
          requestFullscreen();
        }
      }
    };

    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;
      const altPressed = event.altKey;
      const blockedShortcut =
        (ctrlOrMeta && ["t", "w", "tab"].includes(key)) ||
        (altPressed && key === "tab") ||
        key === "f11";

      if (blockedShortcut) {
        event.preventDefault();
        event.stopPropagation();
        handleViolation(
          "TAB_SWITCH",
          "Keyboard shortcuts are disabled during the exam.",
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enforcementActive, handleViolation, handleClick]);

  const unansweredQuestions = useMemo(
    () => questions.filter((q) => !hasAnswerValue(answers[q.id])),
    [questions, answers],
  );

  const canSubmit =
    !!sessionData?.id &&
    !submitted &&
    questions.length > 0 &&
    unansweredQuestions.length === 0;

  const debouncedSave = useMemo(
    () =>
      debounce(async (questionId, answer) => {
        if (!sessionData?.id || submitted) return;
        setIsSaving(true);
        try {
          await saveResponse(sessionData.id, { questionId, answer });
        } catch (error) {
          notify.error("Failed to save your answer. Please check your connection.", "Save Error");
          setStatus("Save failed. We will retry automatically.");
        } finally {
          setIsSaving(false);
        }
      }, 500),
    [sessionData?.id, submitted, notify],
  );

  const handleAnswerChange = (questionId, value, questionType) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (questionType === "mcq" && sessionData?.id && !submitted) {
      logAnswerSelection(sessionData.id, { questionId, answer: value }).catch(
        () => {
          /* ignore selection logging errors */
        },
      );
    }
    debouncedSave(questionId, value);
  };

  const handleStress = (value) => {
    const numericValue = Number(value);
    setStress(numericValue);
    if (sessionData?.id && !submitted) {
      updateStress(sessionData.id, { stressLevel: numericValue });
    }
  };

  const stressLabel = useMemo(() => {
    if (stress <= 1) return "Low stress";
    if (stress >= 9) return "High stress";
    return "Moderate stress";
  }, [stress]);

  useEffect(() => {
    if (!sessionData?.id || submitted) {
      return;
    }
    setStress(0);
    updateStress(sessionData.id, { stressLevel: 0 });
  }, [currentQuestionIndex, sessionData?.id, submitted]);

  const handleSubmit = async () => {
    if (!sessionData?.id || submitted || !canSubmit) {
      if (!sessionData?.id && !submitted) {
        router.replace("/");
      }
      return;
    }

    try {
      const preparedResponses = questions
        .map((q) => ({ questionId: q.id, answer: answers[q.id] }))
        .filter(({ answer }) => hasAnswerValue(answer));

      const flushOk = await closeCurrentWindow(new Date());
      if (!flushOk) {
        notify.warning("Telemetry sync pending. Retrying...", "Sync Status");
      }

      setIsSaving(true);
      const { data } = await submitExam(sessionData.id, { 
        feedback: "", 
        responses: preparedResponses 
      });
      setIsSaving(false);

      const successMessage = data?.message || "Exam submitted successfully.";
      notify.success(successMessage, "Congratulations!");
      await finalizeClientExit(`${successMessage} Redirecting to login...`);
    } catch (error) {
      const message =
        error?.errorMessage || error?.response?.data?.error ||
        "Unable to submit exam. Please try again.";
      notify.error(message, "Submission Failed");
      setStatus(message);
    }
  };

  const logQuestionNavigation = (fromIndex, toIndex, directionOverride) => {
    const fromQuestion = questions[fromIndex];
    const toQuestion = questions[toIndex];
    if (!sessionData?.id || submitted || !fromQuestion?.id || !toQuestion?.id) {
      return;
    }

    const direction =
      directionOverride || (toIndex > fromIndex ? "next" : "previous");

    logNavigation(sessionData.id, {
      fromQuestionId: fromQuestion.id,
      toQuestionId: toQuestion.id,
      direction,
      fromQuestionNumber: fromIndex + 1,
      toQuestionNumber: toIndex + 1,
    }).catch(() => {
      /* ignore navigation logging errors */
    });
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      logQuestionNavigation(currentQuestionIndex, currentQuestionIndex + 1, "next");
      await closeCurrentWindow(new Date());
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = async () => {
    if (currentQuestionIndex > 0) {
      logQuestionNavigation(currentQuestionIndex, currentQuestionIndex - 1, "previous");
      await closeCurrentWindow(new Date());
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleJumpTo = async (targetIndex) => {
    if (
      submitted ||
      targetIndex === currentQuestionIndex ||
      targetIndex < 0 ||
      targetIndex >= questions.length
    ) {
      return;
    }

    logQuestionNavigation(currentQuestionIndex, targetIndex);
    await closeCurrentWindow(new Date());
    setCurrentQuestionIndex(targetIndex);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isQuestionAnswered = hasAnswerValue(answers[currentQuestion?.id]);

  if (!sessionData?.id || !sessionId || (submitted && !forcedExitModal.visible)) {
    return (
      <div style={{ padding: "24px 20px" }}>
        <div className="card">{status || "Redirecting to login..."}</div>
      </div>
    );
  }

  const violationPct = violationCount / VIOLATION_THRESHOLD;

  return (
    <div data-section="container" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - var(--navbar-h))" }}>

      {/* ── Top header bar ── */}
      <div className="exam-header" data-section="header">
        <div className="exam-title">{exam?.title || "Exam"}</div>
        <div className="exam-header-right">
          <div
            className={`exam-violations${
              violationPct >= 0.67
                ? " danger-level"
                : violationPct >= 0.34
                ? " warning-level"
                : ""
            }`}
          >
            ⚠ Violations: {violationCount}/{VIOLATION_THRESHOLD}
          </div>
          <div className="exam-notice">Stay fullscreen — do not switch tabs</div>
          {submitted && <span className="badge">Submitted</span>}
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="exam-body">

        {/* Left: Question navigator */}
        <nav className="question-nav" data-section="panel" aria-label="Question Navigator">
          <div className="question-nav-title">
            Questions &nbsp;
            <span style={{ color: "var(--text-secondary)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              ({questions.length} total)
            </span>
          </div>
          <div className="question-nav-grid">
            {questions.map((question, index) => {
              const isAnswered = hasAnswerValue(answers[question.id]);
              const isActive   = index === currentQuestionIndex;
              return (
                <button
                  key={question.id}
                  type="button"
                  className={`question-pill${isActive ? " active" : ""}${isAnswered ? " answered" : ""}`}
                  onClick={() => handleJumpTo(index)}
                  disabled={submitted}
                  aria-current={isActive ? "step" : undefined}
                  title={`Question ${index + 1}${isAnswered ? " (answered)" : ""}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="nav-legend">
            <div className="nav-legend-item">
              <div className="nav-legend-dot active" />
              Current
            </div>
            <div className="nav-legend-item">
              <div className="nav-legend-dot answered" />
              Answered
            </div>
            <div className="nav-legend-item">
              <div className="nav-legend-dot" />
              Unanswered
            </div>
          </div>
        </nav>

        {/* Right: Content area */}
        <div className="exam-main">

          {/* Difficulty slider */}
          <div className="difficulty-card" data-section="stress">
            <div className="difficulty-label">
              <span>How difficult is this question?</span>
              <span
                className={`difficulty-badge${
                  stress <= 1 ? "" : stress >= 9 ? " high" : " mid"
                }`}
              >
                {stressLabel} — {stress}/10
              </span>
            </div>
            <input
              id="difficulty-slider"
              className="stress-range"
              type="range"
              min="0"
              max="10"
              value={stress}
              onChange={(e) => handleStress(e.target.value)}
              disabled={submitted}
              aria-label="How difficult is this question?"
            />
            <div className="stress-scale">
              <span>Easy</span>
              <span>Moderate</span>
              <span>Hard</span>
            </div>
          </div>

          {/* Question card */}
          {currentQuestion && (
            <div className="question-card" data-section="question">

              <div className="question-number">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>

              <div className="question-text">{currentQuestion.text}</div>

              {/* MCQ or text answer */}
              {currentQuestion.type === "mcq" ? (
                <div
                  className={`mcq-options${
                    currentQuestion.options?.some((opt) => String(opt).trim().length > 28)
                      ? " single-column"
                      : ""
                  }`}
                >
                  {currentQuestion.options?.map((opt, idx) => {
                    const optionId = `option-${currentQuestion.id}-${idx}`;
                    return (
                      <label key={opt} htmlFor={optionId} className="mcq-option">
                        <input
                          id={optionId}
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={opt}
                          checked={answers[currentQuestion.id] === opt}
                          onChange={(e) =>
                            handleAnswerChange(currentQuestion.id, e.target.value, "mcq")
                          }
                          disabled={submitted}
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor={`answer-${currentQuestion.id}`} className="sr-only">Type your answer</label>
                  <textarea
                    id={`answer-${currentQuestion.id}`}
                    name={`answer-${currentQuestion.id}`}
                    className="input text-answer"
                    rows="4"
                    placeholder="Type your answer here…"
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, e.target.value, "text")
                    }
                    disabled={submitted}
                  />
                </div>
              )}

              {/* Navigation footer */}
              <div className="question-nav-buttons" data-section="footer">
                <div className="question-nav-hint">
                  {!submitted && !isQuestionAnswered
                    ? "⚠ Answer this question to proceed"
                    : isLastQuestion && canSubmit
                    ? "✓ All questions answered — ready to submit"
                    : ""}
                </div>
                <div className="question-nav-right">
                  <button
                    className="btn secondary"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0 || submitted}
                  >
                    ← Previous
                  </button>
                  {!isLastQuestion ? (
                    <button
                      className="btn"
                      onClick={handleNext}
                      disabled={!isQuestionAnswered || submitted}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      className="btn"
                      onClick={handleSubmit}
                      disabled={!canSubmit || submitted}
                      style={{ background: canSubmit ? "var(--green)" : undefined }}
                    >
                      Submit Exam
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status bar */}
          {status && (
            <div className="notice" style={{ fontSize: "0.85rem" }}>{status}</div>
          )}
        </div>
      </div>

      {/* ── Violation warning modal ── */}
      {violationModal.visible && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ color: "var(--amber)" }}>⚠ Integrity Warning</h3>
            </div>
            <div className="modal-body">
              <p>{violationModal.message}</p>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                Continued violations will result in automatic exam submission.
                ({violationCount}/{VIOLATION_THRESHOLD} violations recorded)
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn"
                onClick={() => {
                  setViolationModal({ visible: false, message: "" });
                  requestFullscreen();
                }}
              >
                Return to Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Forced exit modal ── */}
      {forcedExitModal.visible && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ color: "var(--danger)" }}>Session Terminated</h3>
            </div>
            <div className="modal-body">
              <p>{forcedExitModal.message}</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn"
                onClick={() => {
                  setForcedExitModal({ visible: false, message: "" });
                  finalizeClientExit(forcedExitModal.message);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExam;
