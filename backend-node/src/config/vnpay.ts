import crypto from "crypto";

export function hmacSHA512(data: string, key: string): string {
  return crypto.createHmac("sha512", key).update(data).digest("hex");
}

export function hmacSHA256(data: string, key: string): string {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

export function md5(message: string): string {
  return crypto.createHash("md5").update(message).digest("hex");
}

export function sha256(message: string): string {
  return crypto.createHash("sha256").update(message).digest("hex");
}

export function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") {
      sorted[key] = value;
    }
  }
  return sorted;
}

export function buildQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

export function extractOrderCodeFromTxnRef(txnRef: string): string {
  if (!txnRef) return txnRef;

  let i = txnRef.length - 1;
  while (i >= 0 && /\d/.test(txnRef[i])) {
    i--;
  }

  const orderCodeNoHyphen = txnRef.substring(0, i + 1);

  if (orderCodeNoHyphen.length === 10 && orderCodeNoHyphen.startsWith("ORD")) {
    return orderCodeNoHyphen.substring(0, 3) + "-" + orderCodeNoHyphen.substring(3);
  }

  return txnRef;
}
