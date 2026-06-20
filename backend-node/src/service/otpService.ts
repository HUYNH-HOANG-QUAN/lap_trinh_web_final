import { AppDataSource } from "../config/database";
import { Otp, OtpAction } from "../entity/Otp";
import { sendOtpEmail } from "./emailService";

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendRegisterOtp(
  email: string
): Promise<{ success: boolean; message: string }> {
  const otpRepo = AppDataSource.getRepository(Otp);

  const existing = await otpRepo.findOne({
    where: { email, action: OtpAction.REGISTER, isUsed: false },
    order: { createdAt: "DESC" },
  });

  if (existing && existing.expiresAt > new Date()) {
    const remaining = Math.ceil((existing.expiresAt.getTime() - Date.now()) / 1000);
    return {
      success: false,
      message: `Vui lòng đợi ${remaining} giây trước khi gửi lại mã.`,
    };
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const otp = otpRepo.create({
    email,
    otpCode: code,
    action: OtpAction.REGISTER,
    expiresAt,
    attempts: 0,
    isUsed: false,
  });

  try {
    await sendOtpEmail(email, code);
    await otpRepo.save(otp);
    return { success: true, message: "Mã OTP đã được gửi đến email của bạn." };
  } catch (error: any) {
    console.error("[OTP] Failed to send email:", error);
    return {
      success: false,
      message: "Không thể gửi email. Vui lòng kiểm tra lại địa chỉ email.",
    };
  }
}

export async function verifyRegisterOtp(
  email: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  const otpRepo = AppDataSource.getRepository(Otp);

  const otp = await otpRepo.findOne({
    where: { email, action: OtpAction.REGISTER, isUsed: false },
    order: { createdAt: "DESC" },
  });

  if (!otp) {
    return { success: false, message: "Mã OTP không tồn tại. Vui lòng yêu cầu mã mới." };
  }

  if (otp.expiresAt < new Date()) {
    await otpRepo.delete(otp.id);
    return { success: false, message: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới." };
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await otpRepo.delete(otp.id);
    return { success: false, message: "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới." };
  }

  if (otp.otpCode !== code.trim()) {
    otp.attempts += 1;
    await otpRepo.save(otp);
    const left = MAX_ATTEMPTS - otp.attempts;
    return { success: false, message: `Mã OTP không đúng. Còn ${left} lần thử.` };
  }

  otp.isUsed = true;
  await otpRepo.save(otp);
  return { success: true, message: "Xác minh OTP thành công." };
}
