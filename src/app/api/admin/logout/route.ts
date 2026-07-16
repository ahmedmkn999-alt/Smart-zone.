import { NextResponse } from "next/server";
import { getAdminSession, endAdminSession } from "@/lib/auth";
import { requireCsrf } from "@/lib/apiHelpers";
import { writeAuditLog } from "@/lib/audit";

export async function POST() {
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const admin = await getAdminSession();
  await endAdminSession();
  if (admin) await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "ADMIN_LOGOUT" });

  return NextResponse.json({ ok: true });
}
