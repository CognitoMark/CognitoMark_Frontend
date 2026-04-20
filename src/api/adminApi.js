import api from "./client";

export const adminLogin = (payload) => api.post("/api/admin/login", payload);
export const fetchDashboard = () => api.get("/api/admin/dashboard/live");
export const fetchExams = () => api.get("/api/admin/exams");
export const createExam = (payload) => api.post("/api/admin/exams", payload);
export const deleteExam = (id) => api.delete(`/api/admin/exams/${id}`);
export const fetchQuestions = (examId) =>
  api.get(`/api/admin/exams/${examId}/questions`);
export const updateQuestionOrder = (examId, orderedIds) =>
  api.put(`/api/admin/exams/${examId}/questions/order`, { orderedIds });
export const createQuestion = (payload) => api.post("/api/admin/questions", payload);
export const deleteQuestion = (id) => api.delete(`/api/admin/questions/${id}`);
export const fetchStudents = () => api.get("/api/admin/students");
export const deleteStudent = (id) => api.delete(`/api/admin/students/${id}`);
export const fetchSessions = () => api.get("/api/admin/sessions");
export const fetchSessionDetail = (id) => api.get(`/api/admin/sessions/${id}`);
export const fetchSessionsDetailsBulk = (sessionIds) => api.post("/api/admin/sessions/bulk-details", { sessionIds });
export const resetDatabase = (payload) => api.post("/api/admin/reset", payload);
export const changeAdminPassword = (payload) => api.post("/api/admin/password", payload);
