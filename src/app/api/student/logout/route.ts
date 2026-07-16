import { NextResponse } from "next/server";
import { getStudentSession, endStudentSession } from "@/lib/auth";
import { requireCsrf } from "@/lib/apiHelpers";
import { writeAuditLog } from "@/lib/audit";

export async function POST() {
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const claims = await getStudentSession();
  await endStudentSession(claims?.sid);

  if (claims) {
    await writeAuditLog({ actorType: "student", actorId: claims.sub, action: "STUDENT_LOGOUT" });
  }

  return NextResponse.json({ ok: true });
}
