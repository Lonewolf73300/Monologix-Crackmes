import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, now } from "@/lib/db";

export async function POST(req: NextRequest) {
  const u = await currentUser();
  if (!u || u.role !== "patron" || !u.company_id) return new NextResponse("Non autorisé", { status: 401 });
  const b = await req.json().catch(() => null) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null;
  if (!b?.endpoint || !b.keys?.p256dh || !b.keys?.auth || !/^https:\/\//.test(b.endpoint)) return new NextResponse("Abonnement invalide", { status: 400 });
  await db.prepare("INSERT INTO push_subs(user_id,company_id,endpoint,p256dh,auth,created) VALUES(?,?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, company_id=excluded.company_id, p256dh=excluded.p256dh, auth=excluded.auth")
    .run(u.id, u.company_id, b.endpoint, b.keys.p256dh, b.keys.auth, now());
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest) {
  const u = await currentUser();
  if (!u || !u.company_id) return new NextResponse("Non autorisé", { status: 401 });
  const b = await req.json().catch(() => null) as { endpoint?: string } | null;
  if (b?.endpoint) await db.prepare("DELETE FROM push_subs WHERE endpoint=? AND company_id=?").run(b.endpoint, u.company_id);
  return NextResponse.json({ ok: true });
}
