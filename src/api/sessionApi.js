import api from "./client";

export const saveResponse = (sessionId, payload) =>
  api.post(`/api/sessions/${sessionId}/response`, payload);

export const logAnswerSelection = (sessionId, payload) =>
  api.post(`/api/sessions/${sessionId}/answer-selection`, payload);

export const updateClicks = (sessionId, payload) =>
  api.post(`/api/sessions/${sessionId}/clicks`, payload);

export const logClickFrequency = (sessionId, payload) =>
  api.post(`/api/sessions/${sessionId}/click-frequency`, payload);

export const logNavigation = (sessionId, payload) =>
  api.post(`/api/sessions/${sessionId}/navigation`, payload);

export const fetchClickSeries = (sessionId) =>
  api.get(`/api/sessions/${sessionId}/click-series`);

export const updateStress = (sessionId, payload) =>
  api.post(`/api/sessions/${sessionId}/stress`, payload);

export const submitExam = (sessionId, payload) =>
  api.post(`/api/sessions/${sessionId}/submit`, payload);

export const logViolation = (sessionId, payload) =>
  api.post(`/api/sessions/${sessionId}/violation`, payload);
