import { useState, useEffect } from "react";
import { apiForgotPassword, apiVerifyForgotPassword, apiResendOtp } from "../utils/api";

const ForgotPasswordModal = ({ onClose, onSwitch }) => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim()) { setError("Vui lòng nhập email."); return; }
    setLoading(true);
    setError("");
    try {
      await apiForgotPassword(email);
      setStep("otp");
      setCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    setError("");
    if (!otp.trim() || otp.length !== 6) {
      setError("Vui lòng nhập đầy đủ mã OTP 6 số."); return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự."); return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp."); return;
    }
    setLoading(true);
    try {
      await apiVerifyForgotPassword(email, otp, newPassword);
      setStep("success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiResendOtp(email);
      setOtp("");
      setCountdown(60);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "var(--card-bg)", borderRadius: 16,
        border: "1px solid #2a2a2a",
        padding: 32, width: "100%", maxWidth: 440,
        position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none", color: "var(--gray)",
          fontSize: 20, cursor: "pointer",
        }}>✕</button>

        {/* Step 1: Nhập email */}
        {step === "email" && (
          <>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "var(--white)", marginBottom: 8 }}>
              QUÊN MẬT KHẨU
            </h3>
            <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Nhập email đã đăng ký. Chúng tôi sẽ gửi mã xác minh OTP đến email của bạn.
            </p>
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <div className="auth-error"><span>⚠️</span> {error}</div>}
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", padding: "14px 0", marginTop: 8 }}
                disabled={loading}
              >
                {loading ? "Đang gửi..." : "Gửi mã xác minh"}
              </button>
            </form>
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--gray)", marginTop: 16 }}>
              Nhớ mật khẩu?{" "}
              <span style={{ color: "var(--primary)", cursor: "pointer", fontWeight: 700 }} onClick={onSwitch}>
                Đăng nhập ngay
              </span>
            </p>
          </>
        )}

        {/* Step 2: Nhập OTP + mật khẩu mới */}
        {step === "otp" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "var(--white)", marginBottom: 8 }}>
                XÁC MINH OTP
              </h3>
              <p style={{ color: "var(--gray)", fontSize: 14, lineHeight: 1.7 }}>
                Mã OTP đã gửi đến<br />
                <strong style={{ color: "var(--primary)" }}>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">Mã OTP (6 số)</label>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{ fontSize: 22, fontFamily: "'Courier New', monospace", textAlign: "center", letterSpacing: 6 }}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && <div className="auth-error"><span>⚠️</span> {error}</div>}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", padding: "14px 0", marginTop: 8 }}
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Đang xác minh..." : "Đặt lại mật khẩu"}
              </button>
            </form>

            <div style={{ textAlign: "center", fontSize: 13, color: "var(--gray)", marginTop: 16 }}>
              Không nhận được mã?{" "}
              {countdown > 0 ? (
                <span style={{ color: "var(--gray)" }}>Gửi lại sau {countdown}s</span>
              ) : (
                <span
                  style={{ color: "var(--primary)", cursor: "pointer", fontWeight: 700 }}
                  onClick={handleResend}
                >
                  Gửi lại mã
                </span>
              )}
            </div>
          </>
        )}

        {/* Step 3: Thành công */}
        {step === "success" && (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "var(--white)", marginBottom: 12 }}>
                ĐẶT LẠI THÀNH CÔNG!
              </h3>
              <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
                Mật khẩu của bạn đã được thay đổi thành công.<br />
                Vui lòng đăng nhập với mật khẩu mới.
              </p>
              <button
                className="btn-primary"
                style={{ width: "100%", padding: "14px 0" }}
                onClick={onSwitch}
              >
                Đăng nhập ngay
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
