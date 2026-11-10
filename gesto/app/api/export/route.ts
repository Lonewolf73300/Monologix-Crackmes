import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, decrypt, logError } from "@/lib/db";
import type { Emp } from "@/lib/documents";
import type { RosterInput } from "@/lib/roster";

// Export RGPD : toutes les données du commerce, en clair, au format JSON (patron uniquement).
export async function GET() {
  const u = await currentUser();
  if (!u || u.role !== "patron" || !u.company_id) return new NextResponse("Non autorisé", { status: 401 });
  try {
    const c = u.company_id;
    const q = async (sql: string) => (await db.prepare(sql).all(c)) as Record<string, unknown>[];
    const company = (await db.prepare("SELECT name,type,dept,nb_sal,season,pains,objective,consigne,faq FROM companies WHERE id=?").get(c)) as Record<string, unknown>;
    const employees = ((await q("SELECT id,enc,created FROM employees WHERE company_id=? ORDER BY id")) as { id: number; enc: string; created: string }[]).map((e) => ({ id: e.id, created: e.created, ...decrypt<Emp>(e.enc) }));
    const data = {
      exporte_le: new Date().toISOString(),
      compte: { email: u.email, prenom: u.first_name },
      commerce: company,
      salaries: employees,
      documents: await q("SELECT id,employee_id,kind,status,version,created,validated_at FROM documents WHERE company_id=? ORDER BY id"),
      echeances: await q("SELECT id,title,due,remind_days,done,employee_id FROM deadlines WHERE company_id=? ORDER BY due"),
      journal: await q("SELECT at,actor,action,doc_id,version FROM journal WHERE company_id=? ORDER BY id"),
      rappels_envoyes: await q("SELECT at,subject,status FROM notifications WHERE company_id=? ORDER BY id"),
      pointages: await q("SELECT employee_id,at,kind FROM punches WHERE company_id=? ORDER BY id"),
      equipe: ((await q("SELECT id,enc,user_id,employee_id,created FROM roster WHERE company_id=? ORDER BY id")) as { id: number; enc: string; user_id: number | null; employee_id: number | null; created: string }[]).map((r) => ({ id: r.id, created: r.created, user_id: r.user_id, employee_id: r.employee_id, ...decrypt<RosterInput>(r.enc) })),
      consignes: await q("SELECT id,body,created FROM directives WHERE company_id=? ORDER BY id"),
      retours: await q("SELECT kind,body,author,created,directive_id FROM staff_messages WHERE company_id=? ORDER BY id"),
    };
    return new NextResponse(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="gesto-export-${new Date().toISOString().slice(0, 10)}.json"` } });
  } catch (e) { logError("export", e); return new NextResponse("Export impossible, réessaie.", { status: 500 }); }
}
