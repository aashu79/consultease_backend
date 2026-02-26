import { z } from "zod";
import { strongPasswordRegex } from "./common.validation";

const websiteSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}, z.string().url().optional());

export const registerTenantSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    country: z.string().min(2),
    timezone: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    address: z.string().optional(),
    website: websiteSchema,
    ownerName: z.string().min(2),
    ownerEmail: z.string().email(),
    ownerPhone: z.string().optional(),
    ownerPassword: z.string().regex(strongPasswordRegex),
  }),
});
