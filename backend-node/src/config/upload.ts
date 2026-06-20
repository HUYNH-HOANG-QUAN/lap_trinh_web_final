import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");
const PRODUCT_UPLOAD_DIR = path.join(UPLOADS_ROOT, "products");

if (!fs.existsSync(PRODUCT_UPLOAD_DIR)) {
  fs.mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PRODUCT_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    const uniqueName = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(new Error("Chỉ chấp nhận file ảnh (jpg, png, webp, gif)."));
    return;
  }
  cb(null, true);
};

export const productImageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Trả về URL public tương đối để lưu vào DB.
 * - local dev: /uploads/products/<file>
 * - FE đã có proxy /uploads -> backend nên có thể dùng trực tiếp
 */
export function toPublicImageUrl(filename: string): string {
  return `/uploads/products/${filename}`;
}
