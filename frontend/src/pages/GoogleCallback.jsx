// =====================================================
// pages/GoogleCallback.jsx – Xử lý callback sau khi đăng nhập Google
// =====================================================

import { useEffect } from "react";

const GoogleCallback = ({ onLogin, navigate }) => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email") || "";
    const fullName = params.get("fullName") || email.split("@")[0];
    const role = params.get("role") || "CUSTOMER";

    if (token) {
      localStorage.setItem("token", token);
      const userData = {
        email,
        role: role.toLowerCase(),
        token,
        name: fullName,
        phone: "",
      };
      localStorage.setItem("user", JSON.stringify(userData));
      onLogin(userData);
      navigate("home");
    } else {
      const error = params.get("google_error") || "Đăng nhập Google thất bại.";
      navigate("login");
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0f",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48, height: 48,
          border: "3px solid rgba(255,92,0,0.2)",
          borderTopColor: "#ff5c00",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px",
        }} />
        <p style={{ color: "#888", fontFamily: "'Nunito', sans-serif", fontSize: 16 }}>
          Đang đăng nhập với Google...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default GoogleCallback;
