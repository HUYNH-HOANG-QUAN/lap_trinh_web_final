// =====================================================
// pages/VerifyOtpPage.jsx – Bước 2: Nhập OTP + đặt mật khẩu
// =====================================================

import { useState, useEffect, useRef } from "react";
import { apiVerifyRegisterOtp } from "../utils/api";

const VerifyOtpPage = ({ navigate, params }) => {
  const [tempData, setTempData] = useState(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 phút
  const inputRefs = useRef([]);

  useEffect(() => {
    const saved = sessionStorage.getItem("pendingRegister");
    if (!saved) {
      navigate("register");
      return;
    }
    const data = JSON.parse(saved);
    setTempData(data);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (idx, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value.slice(-1);
    setOtp(newOtp);
    if (value && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || "";
    setOtp(newOtp);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
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

  const handleSubmit = async () => {
    setError("");
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số mã xác minh."); return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu."); return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự."); return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp."); return;
    }

    setLoading(true);
    try {
      await apiVerifyRegisterOtp(tempData, otpCode, password, confirm);
      sessionStorage.removeItem("pendingRegister");
      navigate("login");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const isOtpComplete = otp.every((c) => c !== "");

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

        <div style={{ textAlign: "center", marginBottom: 24 }}>
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
            Xác minh tài khoản
          </p>
        </div>

        {/* Thông báo + đếm ngược */}
        <div style={{
          background: "rgba(255,92,0,0.06)",
          border: "1px solid rgba(255,92,0,0.15)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 24,
          textAlign: "center",
        }}>
          <p style={{ color: "var(--gray)", fontSize: 13, margin: "0 0 6px", lineHeight: 1.6 }}>
            Nếu tài khoản của bạn có tồn tại, bạn sẽ nhận được email từ chúng tôi.
          </p>
          {countdown > 0 ? (
            <p style={{ color: "var(--primary)", fontSize: 12, fontWeight: 700, margin: 0 }}>
              Mã có hiệu lực trong {formatTime(countdown)}
            </p>
          ) : (
            <p style={{ color: "#ef4444", fontSize: 12, fontWeight: 700, margin: 0 }}>
              Mã đã hết hạn. Vui lòng đăng ký lại.
            </p>
          )}
        </div>

        {/* Email hiển thị */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          padding: "10px 16px",
          marginBottom: 20,
          textAlign: "center",
        }}>
          <span style={{ color: "var(--gray)", fontSize: 13 }}>Mã xác minh đã gửi đến: </span>
          <span style={{ color: "var(--white)", fontSize: 13, fontWeight: 700 }}>{tempData?.email}</span>
        </div>

        {/* Ô nhập OTP */}
        <div style={{ marginBottom: 20 }}>
          <label className="form-label" style={{ display: "block", marginBottom: 12, fontSize: 13, fontWeight: 700 }}>
            Nhập mã OTP <span style={{ color: "var(--primary)" }}>*</span>
          </label>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={handleOtpPaste}
                style={{
                  width: 48,
                  height: 52,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 2,
                  borderRadius: "var(--radius-lg)",
                  border: isOtpComplete
                    ? "1px solid rgba(34,197,94,0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(7, 9, 15, 0.6)",
                  color: "var(--white)",
                  outline: "none",
                  transition: "all 0.25s",
                  boxShadow: isOtpComplete ? "0 0 0 3px rgba(34,197,94,0.1)" : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Mật khẩu */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: "block", marginBottom: 10 }}>
            Mật khẩu <span style={{ color: "var(--primary)" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle(false), paddingRight: 48, width: "100%", boxSizing: "border-box" }}
              onFocus={() => {}}
              onBlur={() => {}}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "var(--gray)", fontSize: 18, cursor: "pointer",
              }}>
              {showPass ? "👁" : "👁‍🗨"}
            </button>
          </div>
        </div>

        {/* Xác nhận mật khẩu */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: "block", marginBottom: 10 }}>
            Xác nhận mật khẩu <span style={{ color: "var(--primary)" }}>*</span>
          </label>
          <input
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 18px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(7, 9, 15, 0.5)",
              color: "var(--white)",
              fontSize: 15,
              fontFamily: "'Nunito', sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Password strength */}
        {password.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 8, fontWeight: 700 }}>
              Độ mạnh mật khẩu:
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { threshold: 1, color: "#ef4444" },
                { threshold: 3, color: "#f59e0b" },
                { threshold: 5, color: "#3b82f6" },
                { threshold: 7, color: "var(--green)" },
              ].map(({ threshold, color }) => (
                <div key={threshold} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: password.length >= threshold ? color : "rgba(255,255,255,0.06)",
                  transition: "background 0.4s",
                  boxShadow: password.length >= threshold ? `0 0 8px ${color}` : "none",
                }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--gray-dark)", marginTop: 6 }}>
              {password.length < 4 ? "Yếu" : password.length < 6 ? "Trung bình" : password.length < 8 ? "Khá mạnh" : "Mạnh"}
            </div>
          </div>
        )}

        {error && (
          <div className="auth-error" style={{ margin: "16px 0" }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          className="btn-primary"
          style={{ width: "100%", padding: "16px 0", fontSize: 16, marginTop: 8 }}
          onClick={handleSubmit}
          disabled={loading || countdown === 0}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span className="spinning" style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%" }} />
              Đang xác minh...
            </span>
          ) : "Hoàn tất đăng ký"}
        </button>

        <div className="auth-divider"><span>hoặc</span></div>

        <div style={{ textAlign: "center", fontSize: 14, color: "var(--gray)" }}>
          Chưa nhận được mã?{" "}
          <span
            style={{ color: "var(--primary)", fontWeight: 800, cursor: "pointer" }}
            onClick={() => navigate("register")}
          >
            Đăng ký lại
          </span>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
