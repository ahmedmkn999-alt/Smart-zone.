import { z } from "zod";

/*
 * Every API route parses its input through one of these before touching the
 * DB or business logic. Zod gives us both shape validation AND type inference
 * for free — `parse()` throws on anything unexpected, so malformed/forged
 * payloads never reach Prisma. Combined with Prisma's parameterized queries,
 * this is what actually stops injection-style attacks (SQL or otherwise) —
 * not a keyword blocklist.
 */

export const trackEnum = z.enum(["SCI", "MATH", "LIT"]);

// ── student auth ──
export const studentLoginSchema = z.object({
  code: z.string().trim().min(4).max(40),
  deviceFingerprint: z.string().trim().min(10).max(4000)
});

// ── admin auth ──
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200)
});

// ── codes (admin) ──
export const createStudentCodeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  track: trackEnum
});

export const createTrialCodeSchema = z.object({
  track: trackEnum,
  duration: z.enum(["1H", "1D"])
});

export const codeActionSchema = z.object({
  action: z.enum(["renew", "block", "unblock", "reset-device", "reset-violations", "delete"])
});

// ── FAQ (admin) ──
export const faqCreateSchema = z.object({
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(1).max(2000),
  order: z.number().int().min(0).optional()
});
export const faqUpdateSchema = faqCreateSchema.partial();

// ── support ──
export const supportCreateSchema = z.object({
  message: z.string().trim().min(1).max(2000)
});
export const supportReplySchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000)
});

// ── content hierarchy (admin) ──
export const subjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  track: trackEnum,
  imageUrl: z.string().url().optional().or(z.literal("")),
  order: z.number().int().min(0).optional()
});

export const teacherSchema = z.object({
  subjectId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  photoUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  order: z.number().int().min(0).optional()
});

export const courseSchema = z.object({
  teacherId: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  order: z.number().int().min(0).optional()
});

export const courseDaySchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  order: z.number().int().min(0).optional()
});

export const lessonSchema = z.object({
  dayId: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  videoUrl: z.string().url(),
  order: z.number().int().min(0).optional()
});
