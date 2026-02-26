import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().min(1),
  SPARROW_TOKEN: z.string().min(1),
  SPARROW_FROM: z.string().min(1),
  STORAGE_PROVIDER: z.enum(["MINIO", "AWS_S3"]).default("MINIO"),
  STORAGE_BUCKET: z.string().default("consultease"),
  STORAGE_SIGNED_URL_EXPIRES_SECONDS: z.coerce.number().default(1200),
  STORAGE_SIGNED_URL_MAX_EXPIRES_SECONDS: z.coerce.number().default(3600),
  STORAGE_MAX_FILE_SIZE_BYTES: z.coerce.number().default(15 * 1024 * 1024),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_USE_SSL: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration");
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
