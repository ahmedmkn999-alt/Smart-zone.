import { createHmac, timingSafeEqual } from "crypto";
import { env } from "./env";

/*
 * "Signed URL" هنا معناها: توكن قصير العمر مرتبط بـ (lessonId + studentId)
 * وموقّع بمفتاح السيرفر، مش رابط الفيديو الفعلي نفسه بيتغيّر. الفايدة إن أي
 * رابط بيسربه طالب لغيره هيبطل خلال ساعتين ومربوط بجلسته هو بس وقت ما اتولد.
 *
 * ملحوظة صريحة: ده طبقة حماية على مستوى تطبيقنا احنا، مش تشفير فيديو حقيقي
 * (HLS مقسّم ومشفّر). التشفير الحقيقي على مستوى البيتات لازم ياخده سيرفر
 * فيديو متخصص (Mux, Cloudflare Stream, bunny.net Stream...) — الفيديو لو
 * مستضاف على يوتيوب/فيميو مثلاً، إحنا مش بنتحكم في التشفير بتاعه أصلاً.
 */

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // ساعتين

export function signVideoToken(lessonId: string, studentId: string): string {
  const expires = Date.now() + TOKEN_TTL_MS;
  const payload = `${lessonId}.${studentId}.${expires}`;
  const sig = createHmac("sha256", env.CODE_PEPPER).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyVideoToken(
  token: string,
  lessonId: string,
  studentId: string
): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 4) return false;
    const [tLesson, tStudent, tExpires, sig] = parts;

    if (tLesson !== lessonId || tStudent !== studentId) return false;
    if (Number(tExpires) < Date.now()) return false;

    const payload = `${tLesson}.${tStudent}.${tExpires}`;
    const expected = createHmac("sha256", env.CODE_PEPPER).update(payload).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
