import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entity/User";

export async function getProfile(req: Request, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({
    where: { email: (req as any).user?.email, deletedAt: null as any },
  });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
  });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({
    where: { email: (req as any).user?.email, deletedAt: null as any },
  });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const { fullName, phone, passwordHash } = req.body;
  if (fullName?.trim()) user.fullName = fullName.trim();
  if (phone?.trim()) user.phone = phone.trim();
  if (passwordHash?.trim()) {
    const bcryptjs = await import("bcryptjs");
    user.passwordHash = await bcryptjs.hash(passwordHash, 10);
  }

  await userRepo.save(user);
  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
  });
}
