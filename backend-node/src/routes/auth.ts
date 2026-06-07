import { Request, Response } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User, Role, UserStatus } from "../entity/User";
import { AuthRequest } from "../middleware/auth";
import { config } from "../config/env";
import { sendOtp, verifyOtp } from "../service/otpService";

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password, rememberMe } = req.body;

  if (!username?.trim() || !password?.trim()) {
    res.status(400).json({ message: "Vui long nhap day du thong tin dang nhap." });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo
    .createQueryBuilder("user")
    .where("user.email = :username", { username })
    .andWhere("user.deletedAt IS NULL")
    .getOne();

  if (!user) {
    res.status(401).json({ message: "Ten dang nhap hoac mat khau khong dung." });
    return;
  }

  if (user.status === UserStatus.LOCKED) {
    res.status(403).json({ message: "Tai khoan da bi khoa." });
    return;
  }

  const isValid = await bcryptjs.compare(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ message: "Ten dang nhap hoac mat khau khong dung." });
    return;
  }

  const expirationMs = rememberMe ? config.jwt.rememberExpirationMs : config.jwt.expirationMs;
  const token = jwt.sign(
    { email: user.email, role: `ROLE_${user.role}` },
    config.jwt.secret,
    { expiresIn: Math.floor(expirationMs / 1000) }
  );

  const cookieMaxAge = Math.floor(expirationMs / 1000);
  res.cookie(config.jwt.cookieName, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax" as const,
    maxAge: cookieMaxAge,
    path: "/",
  });

  res.json({
    token,
    username: user.email,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { fullName, email, phone, password, confirmPassword } = req.body;

  if (!fullName?.trim()) {
    res.status(400).json({ message: "Ho ten khong duoc trong." });
    return;
  }
  if (!email?.trim()) {
    res.status(400).json({ message: "Email khong duoc trong." });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    res.status(400).json({ message: "Email khong dung dinh dang." });
    return;
  }
  if (!password?.trim()) {
    res.status(400).json({ message: "Mat khau khong duoc trong." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: "Mat khau phai it nhat 6 ky tu." });
    return;
  }
  if (password !== confirmPassword) {
    res.status(400).json({ message: "Mat khau khong khop." });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);

  const existing = await userRepo
    .createQueryBuilder("user")
    .where("user.email = :email OR user.phone = :phone", { email: email.trim(), phone: phone?.trim() })
    .andWhere("user.deletedAt IS NULL")
    .getOne();

  if (existing) {
    res.status(400).json({ message: "Email hoac so dien thoai da ton tai." });
    return;
  }

  const result = await sendOtp(email.trim(), "register");
  if (!result.success) {
    res.status(429).json({ message: result.message });
    return;
  }

  res.json({ message: result.message, email: email.trim(), requireOtp: true });
}

export async function verifyRegister(req: Request, res: Response): Promise<void> {
  const { email, otp } = req.body;

  if (!email?.trim() || !otp?.trim()) {
    res.status(400).json({ message: "Email va ma OTP la bat buoc." });
    return;
  }

  const result = await verifyOtp(email.trim(), otp.trim());
  if (!result.success) {
    res.status(400).json({ message: result.message });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);
  const existing = await userRepo
    .createQueryBuilder("user")
    .where("user.email = :email", { email: email.trim() })
    .andWhere("user.deletedAt IS NULL")
    .getOne();

  if (existing) {
    res.status(400).json({ message: "Email da ton tai." });
    return;
  }

  res.json({ message: "Xac minh thanh cong. Vui long dang ky." });
}

export async function completeRegister(req: Request, res: Response): Promise<void> {
  const { fullName, email, phone, password, otp } = req.body;

  if (!fullName?.trim() || !email?.trim() || !password?.trim() || !otp?.trim()) {
    res.status(400).json({ message: "Thong tin khong day du." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: "Mat khau phai it nhat 6 ky tu." });
    return;
  }

  const verifyResult = await verifyOtp(email.trim(), otp.trim());
  if (!verifyResult.success) {
    res.status(400).json({ message: verifyResult.message });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);

  const existing = await userRepo
    .createQueryBuilder("user")
    .where("user.email = :email OR user.phone = :phone", { email: email.trim(), phone: phone?.trim() })
    .andWhere("user.deletedAt IS NULL")
    .getOne();

  if (existing) {
    res.status(400).json({ message: "Email hoac so dien thoai da ton tai." });
    return;
  }

  const user = new User();
  user.fullName = fullName.trim();
  user.email = email.trim();
  user.phone = phone?.trim() || undefined;
  user.role = Role.CUSTOMER;
  user.status = UserStatus.ACTIVE;
  user.emailVerifiedAt = new Date();
  user.passwordHash = await bcryptjs.hash(password, 10);

  await userRepo.save(user);
  res.json({ message: "Dang ky thanh cong." });
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.cookie(config.jwt.cookieName, "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  });
  res.json({ message: "Dang xuat thanh cong." });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  if (!email?.trim()) {
    res.status(400).json({ message: "Email khong duoc trong." });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email: email.trim() } as any });

  if (!user) {
    res.json({ message: "Neu email ton tai trong he thong, ban se nhan duoc ma xac minh.", demo: true });
    return;
  }

  const result = await sendOtp(email.trim(), "reset_password", user.id);
  if (!result.success) {
    res.status(429).json({ message: result.message });
    return;
  }

  res.json({ message: result.message, email: email.trim(), requireOtp: true });
}

export async function verifyForgotPassword(req: Request, res: Response): Promise<void> {
  const { email, otp, newPassword } = req.body;

  if (!email?.trim() || !otp?.trim() || !newPassword) {
    res.status(400).json({ message: "Thong tin khong day du." });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ message: "Mat khau phai it nhat 6 ky tu." });
    return;
  }

  const verifyResult = await verifyOtp(email.trim(), otp.trim());
  if (!verifyResult.success) {
    res.status(400).json({ message: verifyResult.message });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email: email.trim() } as any });

  if (!user) {
    res.status(400).json({ message: "Tai khoan khong ton tai." });
    return;
  }

  user.passwordHash = await bcryptjs.hash(newPassword, 10);
  await userRepo.save(user);

  res.json({ message: "Dat lai mat khau thanh cong!" });
}

export async function resendOtp(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  if (!email?.trim()) {
    res.status(400).json({ message: "Email khong duoc trong." });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email: email.trim() } as any });

  const action = user ? "reset_password" : "register";
  const userId = user?.id;

  const result = await sendOtp(email.trim(), action, userId);
  if (!result.success) {
    res.status(429).json({ message: result.message });
    return;
  }

  res.json({ message: result.message });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body;

  if (!token?.trim()) {
    res.status(400).json({ message: "Token khong hop le." });
    return;
  }
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ message: "Mat khau moi phai co it nhat 6 ky tu." });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { resetToken: token.trim() } });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    res.status(400).json({ message: "Token khong hop le hoac da het han." });
    return;
  }

  user.passwordHash = await bcryptjs.hash(newPassword, 10);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await userRepo.save(user);

  res.json({ message: "Dat lai mat khau thanh cong!" });
}
