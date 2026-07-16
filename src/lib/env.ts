import { z } from "zod";

// يفشل التطبيق فورًا لو أي سر ناقص أو ضعيف، بدل ما يشتغل بإعدادات غير آمنة بصمت
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET لازم يكون 32 حرف على الأقل"),
  CODE_PEPPER: z.string().min(32, "CODE_PEPPER لازم يكون 32 حرف على الأقل"),
  DEVICE_PEPPER: z.string().min(32, "DEVICE_PEPPER لازم يكون 32 حرف على الأقل"),
  ENCRYPTION_KEY: z.string().min(1),
  CSRF_SECRET: z.string().min(32, "CSRF_SECRET لازم يكون 32 حرف على الأقل"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development")
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CODE_PEPPER: process.env.CODE_PEPPER,
  DEVICE_PEPPER: process.env.DEVICE_PEPPER,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  CSRF_SECRET: process.env.CSRF_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV
});

export const isProd = env.NODE_ENV === "production";
