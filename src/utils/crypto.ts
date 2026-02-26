import argon2 from "argon2";
import crypto from "crypto";

export async function hashValue(raw: string): Promise<string> {
  return argon2.hash(raw, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyHash(raw: string, hashed: string): Promise<boolean> {
  return argon2.verify(hashed, raw);
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 150);
}

export function sha256(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
