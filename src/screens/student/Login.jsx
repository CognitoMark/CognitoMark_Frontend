"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { studentLogin } from "../../api/studentApi";
import { storage } from "../../utils/storage";
import { useNotify } from "../../components/Toast";

const StudentLogin = () => {
  const router = useRouter();
  const [form, setForm] = useState({ studentId: "", name: "" });
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const payload = {
        studentId: form.studentId.trim(),
        name: form.name.trim(),
      };
      const { data } = await studentLogin(payload);
      storage.set("student", data.student);
      storage.set("exams", data.exams);
      storage.set("studentToken", data.token);
      if (data.student?.id) {
        localStorage.setItem("studentDbId", String(data.student.id));
      }
      notify.success(`Welcome back, ${data.student.name}!`, "Login Successful");
      router.push("/start");
    } catch (err) {
      const msg = err?.errorMessage || err?.response?.data?.error || "Login failed";
      notify.error(msg, "Access Denied");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered-page">
      <div className="login-card">
        <div className="card-icon">
          <Image src="/favicon.png" alt="CognitoMark" width={48} height={48} style={{ borderRadius: "12px" }} />
        </div>
        <h2>Student Portal</h2>
        <p className="subtitle">Enter your credentials to access your exam</p>

        <form onSubmit={handleSubmit} className="grid" style={{ gap: "1.25rem" }}>
          <div className="form-group">
            <label htmlFor="studentId" className="form-label">Student ID</label>
            <input
              id="studentId"
              className="input"
              name="studentId"
              placeholder="e.g. STU-2024-001"
              value={form.studentId}
              onChange={handleChange}
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              className="input"
              name="name"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
              disabled={loading}
            />
          </div>
          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{ fontSize: "1rem", padding: "13px", marginTop: "4px" }}
          >
            {loading ? "Accessing…" : "Access Exam Portal →"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;
