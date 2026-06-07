import { v4 as uuidv4 } from "uuid";

export function generateOrderCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().replace(/-/g, "").substring(0, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}
