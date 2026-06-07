import nodemailer from "nodemailer";
import { config } from "../config/env";

export const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: config.email.smtp.secure,
  auth: {
    user: config.email.smtp.auth.user,
    pass: config.email.smtp.auth.pass,
  },
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({
    from: `"ProFit" <${config.email.from}>`,
    to,
    subject,
    html,
  });
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #ff5c00; font-size: 32px; margin: 0;">Pro<span style="color: #1f2937;">Fit</span></h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Xác minh tài khoản của bạn</p>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px;">Mã xác minh</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Nhập mã dưới đây để hoàn tất đăng ký hoặc khôi phục mật khẩu:</p>
        <div style="background: #fff7ed; border: 2px dashed #ff5c00; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ff5c00; font-family: 'Courier New', monospace;">${otp}</span>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
        Nếu bạn không yêu cầu mã này, hãy bỏ qua email.
      </p>
    </div>
  `;

  await sendEmail(to, "[ProFit] Mã xác minh OTP của bạn", html);
}
