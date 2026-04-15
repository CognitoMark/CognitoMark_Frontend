"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { studentLogin } from "../../api/studentApi";
import { storage } from "../../utils/storage";

const StudentLogin = () => {
  const router = useRouter();
  const [form, setForm] = useState({ studentId: "", name: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await studentLogin(form);
      storage.set("student", data.student);
      storage.set("exams", data.exams);
      if (data.student?.id) {
        localStorage.setItem("studentDbId", String(data.student.id));
      }
      router.push("/start");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
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
            <label className="form-label">Student ID</label>
            <input
              className="input"
              name="studentId"
              placeholder="e.g. STU-2024-001"
              value={form.studentId}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="input"
              name="name"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          {error && (
            <div className="notice danger" style={{ textAlign: "center" }}>
              {error}
            </div>
          )}
          <button
            className="btn"
            type="submit"
            style={{ fontSize: "1rem", padding: "13px", marginTop: "4px" }}
          >
            Access Exam Portal →
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;
