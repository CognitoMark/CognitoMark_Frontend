import api from "./client";

export const studentLogin = (payload) => api.post("/api/students/login", payload);
export const startExam = (examId, payload) =>
  api.post(`/api/students/exams/${examId}/start`, payload);
