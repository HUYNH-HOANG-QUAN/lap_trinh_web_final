import nodemailer from "nodemailer";
import { config } from "../config/env";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: config.email.smtp.user,
    pass: config.email.smtp.password,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({
    from: `"ProFit Shop" <${config.email.smtp.user}>`,
    to,
    subject,
    html,
  });
}

export async function sendWelcomeEmail(to: string, fullName: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 32px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #ff5c00; margin: 0; font-size: 36px; letter-spacing: 2px;">
          Pro<span style="color: #fff;">Fit</span>
        </h1>
        <p style="color: #888; margin: 8px 0 0;">Chào mừng bạn đến với ProFit!</p>
      </div>
      <div style="background: #1a1a1a; border-radius: 12px; padding: 28px; border: 1px solid #2a2a2a;">
        <h2 style="color: #fff; margin: 0 0 16px;">Xin chào ${fullName}!</h2>
        <p style="color: #ccc; line-height: 1.7; margin: 0 0 20px;">
          Cảm ơn bạn đã đăng ký tài khoản tại <strong style="color: #ff5c00;">ProFit</strong>.
          Tài khoản của bạn đã được tạo thành công và sẵn sàng sử dụng.
        </p>
        <div style="background: rgba(255,92,0,0.08); border: 1px solid rgba(255,92,0,0.2); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #ff5c00; margin: 0; font-size: 14px; font-weight: bold;">
            Bây giờ bạn có thể:
          </p>
          <ul style="color: #ccc; margin: 10px 0 0; padding-left: 20px; line-height: 1.8;">
            <li>Mua sắm các sản phẩm supplement chất lượng</li>
            <li>Theo dõi đơn hàng dễ dàng</li>
            <li>Nhận ưu đãi và khuyến mãi độc quyền</li>
          </ul>
        </div>
        <p style="color: #888; font-size: 13px; margin: 0;">
          Nếu bạn có câu hỏi, liên hệ với chúng tôi qua email này.
        </p>
      </div>
      <div style="text-align: center; margin-top: 24px; color: #555; font-size: 12px;">
        &copy; 2024 ProFit Shop. All rights reserved.
      </div>
    </div>
  `;
  await sendEmail(to, "Chào mừng bạn đến với ProFit!", html);
}

export async function sendOtpEmail(to: string, otpCode: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 32px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #ff5c00; margin: 0; font-size: 36px; letter-spacing: 2px;">
          Pro<span style="color: #fff;">Fit</span>
        </h1>
        <p style="color: #888; margin: 8px 0 0;">Xác minh đăng ký tài khoản</p>
      </div>
      <div style="background: #1a1a1a; border-radius: 12px; padding: 28px; border: 1px solid #2a2a2a;">
        <h2 style="color: #fff; margin: 0 0 16px;">Mã xác minh của bạn</h2>
        <p style="color: #ccc; line-height: 1.7; margin: 0 0 24px;">
          Nhập mã bên dưới để hoàn tất đăng ký tài khoản ProFit:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background: rgba(255,92,0,0.1); border: 2px dashed rgba(255,92,0,0.4);
                      border-radius: 12px; padding: 20px 40px;">
            <span style="font-family: 'Courier New', monospace; font-size: 40px; font-weight: bold;
                         color: #ff5c00; letter-spacing: 8px;">${otpCode}</span>
          </div>
        </div>
        <p style="color: #888; font-size: 13px; line-height: 1.7; margin: 0 0 16px;">
          Mã có hiệu lực trong <strong style="color: #ff5c00;">5 phút</strong>.
          Không chia sẻ mã này với bất kỳ ai.
        </p>
        <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 14px; margin-top: 20px;">
          <p style="color: #ef4444; font-size: 13px; margin: 0;">
            <strong>Lưu ý bảo mật:</strong> ProFit không bao giờ hỏi mã OTP qua điện thoại hay tin nhắn.
          </p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 24px; color: #555; font-size: 12px;">
        &copy; 2024 ProFit Shop. All rights reserved.
      </div>
    </div>
  `;
  await sendEmail(to, "ProFit - Mã xác minh đăng ký tài khoản", html);
}

export async function sendResetPasswordEmail(to: string, fullName: string, resetLink: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 32px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #ff5c00; margin: 0; font-size: 36px; letter-spacing: 2px;">
          Pro<span style="color: #fff;">Fit</span>
        </h1>
        <p style="color: #888; margin: 8px 0 0;">Yêu cầu đặt lại mật khẩu</p>
      </div>
      <div style="background: #1a1a1a; border-radius: 12px; padding: 28px; border: 1px solid #2a2a2a;">
        <h2 style="color: #fff; margin: 0 0 16px;">Xin chào ${fullName},</h2>
        <p style="color: #ccc; line-height: 1.7; margin: 0 0 20px;">
          Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản ProFit của bạn.
          Nhấn vào nút bên dưới để đặt lại mật khẩu:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetLink}"
             style="display: inline-block; background: #ff5c00; color: #fff; text-decoration: none;
                    padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p style="color: #888; font-size: 13px; line-height: 1.7; margin: 0 0 16px;">
          Liên kết này sẽ hết hạn sau <strong style="color: #ff5c00;">60 phút</strong>.
        </p>
        <p style="color: #888; font-size: 13px; line-height: 1.7; margin: 0 0 16px;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        </p>
        <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 14px; margin-top: 20px;">
          <p style="color: #ef4444; font-size: 13px; margin: 0;">
            <strong>Lưu ý bảo mật:</strong> Không chia sẻ email này với ai. ProFit không bao giờ hỏi mật khẩu qua email.
          </p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 24px; color: #555; font-size: 12px;">
        &copy; 2024 ProFit Shop. All rights reserved.
      </div>
    </div>
  `;
  await sendEmail(to, "ProFit - Yêu cầu đặt lại mật khẩu", html);
}
