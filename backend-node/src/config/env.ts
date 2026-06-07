export const config = {
  port: parseInt(process.env.PORT || "3001"),
  nodeEnv: process.env.NODE_ENV || "development",

  jwt: {
    secret: process.env.JWT_SECRET || "ProFitJwtSecretKeyMustBeAtLeastSixtyFourCharactersLongForHS512",
    expirationMs: parseInt(process.env.JWT_EXPIRATION_MS || "86400000"),
    rememberExpirationMs: parseInt(process.env.JWT_REMEMBER_EXPIRATION_MS || "604800000"),
    cookieName: "admin_token",
  },

  bootstrap: {
    admin: {
      enabled: process.env.BOOTSTRAP_ADMIN_ENABLED !== "false",
      fullName: process.env.BOOTSTRAP_ADMIN_FULL_NAME || "Administrator",
      email: process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@profit.com",
      phone: process.env.BOOTSTRAP_ADMIN_PHONE || "0123456789",
      password: process.env.BOOTSTRAP_ADMIN_PASSWORD || "Admin@123",
    },
    customer: {
      enabled: process.env.BOOTSTRAP_CUSTOMER_ENABLED !== "false",
      fullName: process.env.BOOTSTRAP_CUSTOMER_FULL_NAME || "Khach Hang Test",
      email: process.env.BOOTSTRAP_CUSTOMER_EMAIL || "khachhang@gmail.com",
      phone: process.env.BOOTSTRAP_CUSTOMER_PHONE || "0987654321",
      password: process.env.BOOTSTRAP_CUSTOMER_PASSWORD || "Customer@123",
    },
  },

  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE || "",
    hashSecret: process.env.VNPAY_HASH_SECRET || "",
    paymentUrl: process.env.VNPAY_PAYMENT_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:3001/api/v1/payment/vnpay-return",
    ipnUrl: process.env.VNPAY_IPN_URL || "http://localhost:3001/api/v1/payment/vnpay-ipn",
  },

  frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:5173",

  email: {
    smtp: {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    },
    from: process.env.EMAIL_FROM || "noreply@profit.com",
  },
};
