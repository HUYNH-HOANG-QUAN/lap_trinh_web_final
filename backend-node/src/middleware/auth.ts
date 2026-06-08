import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entity/User";
import { config } from "../config/env";

export interface JwtPayload {
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: {
    email: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "Vui long dang nhap" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = { email: payload.email, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized", message: "Token khong hop le" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden", message: "Yeu cau quyen Admin" });
    return;
  }
  next();
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = { email: payload.email, role: payload.role };
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.substring(7);
  }
  const cookie = req.cookies?.admin_token;
  if (cookie) return cookie;
  return undefined;
}

export async function loadUserFromRequest(req: AuthRequest): Promise<User | null> {
  if (!req.user) return null;
  return AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .where("user.email = :email")
    .andWhere("user.deletedAt IS NULL")
    .setParameter("email", req.user.email)
    .getOne();
}
