// =====================================================
// pages/RegisterPage.jsx – Bước 1: Nhập thông tin + gửi OTP
// =====================================================

import { useState } from "react";
import { apiRegister } from "../utils/api";

const RegisterPage = ({ onLogin, navigate }) => {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    const { fullName, email, phone } = form;

    if (!fullName?.trim()) {
      setError("Vui lòng nhập họ tên."); return;
    }
    if (!email?.trim()) {
      setError("Vui lòng nhập email."); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Email không đúng định dạng."); return;
    }

    setLoading(true);
    try {
      const data = await apiRegister(fullName, email, phone);
      sessionStorage.setItem("pendingRegister", JSON.stringify(data.tempData));
      navigate("verify-otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (focused) => ({
    width: "100%",
    padding: "14px 18px",
    borderRadius: "var(--radius-lg)",
    border: focused
      ? "1px solid rgba(255,92,0,0.5)"
      : "1px solid rgba(255,255,255,0.06)",
    background: "rgba(7, 9, 15, 0.5)",
    color: "var(--white)",
    fontSize: 15,
    fontFamily: "'Nunito', sans-serif",
    outline: "none",
    transition: "all 0.35s",
    boxShadow: focused ? "0 0 0 3px rgba(255,92,0,0.1)" : "none",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div style={{
        position: "absolute",
        width: 600, height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }} />

      <div className="auth-card" style={{ maxWidth: 520, position: "relative", zIndex: 1 }}>
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 3,
          background: "linear-gradient(90deg, var(--primary), rgba(139,92,246,0.8), var(--primary))",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
        }} />

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 36,
            color: "var(--primary)",
            letterSpacing: 3,
            textShadow: "0 0 20px rgba(255,92,0,0.3)",
            marginBottom: 8,
          }}>
            Pro<span style={{ color: "var(--white)" }}>Fit</span>
          </div>
          <p style={{ color: "var(--gray)", fontSize: 14, fontWeight: 600 }}>
            Nhập thông tin để nhận mã xác minh qua email
          </p>
        </div>

        {/* Họ tên + SĐT */}
        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 0 }}>
          <div className="form-group">
            <label className="form-label" style={{ display: "block", marginBottom: 10 }}>
              Họ và tên <span style={{ color: "var(--primary)" }}>*</span>
            </label>
            <FocusedInput name="fullName" placeholder="Nguyễn Văn A"
              value={form.fullName} onChange={handleChange} style={inputStyle} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: "block", marginBottom: 10 }}>
              Số điện thoại
            </label>
            <FocusedInput name="phone" placeholder="0901 234 567"
              value={form.phone} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* Email */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: "block", marginBottom: 10 }}>
            Email <span style={{ color: "var(--primary)" }}>*</span>
          </label>
          <FocusedInput type="email" name="email" placeholder="email@example.com"
            value={form.email} onChange={handleChange} style={inputStyle} />
        </div>

        {/* Thông báo */}
        <p style={{ fontSize: 12, color: "var(--gray)", margin: "16px 0 20px", lineHeight: 1.7 }}>
          Mã xác minh sẽ được gửi đến email của bạn. Mã có hiệu lực trong <strong style={{ color: "var(--primary)" }}>5 phút</strong>.
        </p>

        {error && (
          <div className="auth-error" style={{ marginBottom: 16 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          className="btn-primary"
          style={{ width: "100%", padding: "16px 0", fontSize: 16 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span className="spinning" style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%" }} />
              Đang gửi mã xác minh...
            </span>
          ) : "Gửi mã xác minh"}
        </button>

        <div className="auth-divider"><span>hoặc</span></div>

        <div style={{ textAlign: "center", fontSize: 14, color: "var(--gray)" }}>
          Đã có tài khoản?{" "}
          <span
            style={{ color: "var(--primary)", fontWeight: 800, cursor: "pointer" }}
            onClick={() => navigate("login")}
          >
            Đăng nhập ngay
          </span>
        </div>
      </div>
    </div>
  );
};

const FocusedInput = ({ style, ...props }) => {
  const [focused, setFocused] = useState(false);
  const resolvedStyle = typeof style === "function" ? style(focused) : { ...style };
  return (
    <input
      {...props}
      style={resolvedStyle}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

export default RegisterPage;
