import { NextRequest, NextResponse } from "next/server";
import { db, now, logError } from "@/lib/db";
import { sendMail } from "@/lib/mail";

// À appeler chaque jour (Vercel Cron) avec l'en-tête Authorization: Bearer $CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Non autorisé", { status: 401 });
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const due = db.prepare(`SELECT d.id,d.company_id,d.title,d.due,u.email FROM deadlines d JOIN companies c ON c.id=d.company_id JOIN users u ON u.id=c.owner_id
    WHERE d.done=0 AND date(d.due, '-' || d.remind_days || ' days') <= ? AND (d.last_reminded IS NULL OR d.last_reminded < ?) ORDER BY d.due`).all(today, today) as { id: number; company_id: number; title: string; due: string; email: string }[];
  const res = { envoyes: 0, non_envoyes: 0, plafonnes: 0 };
  for (const d of due) {
    try {
      const sent = (db.prepare("SELECT COUNT(*) n FROM notifications WHERE company_id=? AND at>? AND status='envoye'").get(d.company_id, weekAgo) as { n: number }).n;
      if (sent >= 2) { res.plafonnes++; continue; } // 2 notifications / semaine maximum
      const subject = `Gesto — échéance le ${new Date(d.due).toLocaleDateString("fr-FR")} : ${d.title}`;
      const status = await sendMail(d.email, subject, `${d.title}\nÉchéance : ${new Date(d.due).toLocaleDateString("fr-FR")}\n\nConnecte-toi à Gesto pour la marquer comme faite.`);
      db.prepare("INSERT INTO notifications(company_id,deadline_id,at,subject,status) VALUES(?,?,?,?,?)").run(d.company_id, d.id, now(), subject, status);
      if (status === "envoye") { db.prepare("UPDATE deadlines SET last_reminded=? WHERE id=?").run(today, d.id); res.envoyes++; } else res.non_envoyes++;
    } catch (e) { logError("rappels", e); }
  }
  return NextResponse.json(res);
}
