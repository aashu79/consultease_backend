import { hashValue, verifyHash } from "./crypto";

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOtp(otp: string): Promise<string> {
  return hashValue(otp);
}

export async function verifyOtp(otp: string, otpHash: string): Promise<boolean> {
  return verifyHash(otp, otpHash);
}
