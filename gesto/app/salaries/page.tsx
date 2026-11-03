import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { saveConsigne } from "../actions";
import { extras } from "@/lib/flags";
import type { Emp } from "@/lib/documents";

export default async function Page() {
  const u = await requirePatron();
  const rows = db.prepare("SELECT id,enc,user_id FROM employees WHERE company_id=? ORDER BY id DESC").all(u.company_id) as { id: number; enc: string; user_id: number | null }[];
  const co = db.prepare("SELECT invite_code,consigne,faq FROM companies WHERE id=?").get(u.company_id) as { invite_code: string; consigne: string; faq: string };
  const faq = (JSON.parse(co.faq) as { q: string; a: string }[]).map((x) => `${x.q} | ${x.a}`).join("\n");
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-bold">Mes employés</h1><Link href="/salaries/nouveau" className="rounded-xl bg-accent px-4 py-2 font-semibold text-black">+ Nouveau salarié</Link></div>
      <ul className="mt-6 space-y-2">{rows.map((r) => { const e = decrypt<Emp>(r.enc); return <li key={r.id} className="rounded-xl border border-line bg-panel p-4"><p className="font-semibold">{e.name}</p><p className="text-sm text-zinc-400">{e.post} · {e.contractType} · {e.hours} h · depuis le {new Date(e.start).toLocaleDateString("fr-FR")} · {r.user_id ? "espace activé" : "invitation en attente"}</p></li>; })}
        {!rows.length && <li className="text-zinc-500">Aucun salarié pour l&apos;instant.</li>}</ul>
      {extras && <section className="mt-10 rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-xl font-semibold">Espace employé</h2>
        <p className="mt-1 text-sm text-zinc-400">Donne ce code à tes salariés, ils vont sur <Link className="underline" href="/rejoindre">/rejoindre</Link> : <span className="font-mono text-accent">{co.invite_code}</span></p>
        <form action={saveConsigne} className="mt-4 space-y-3">
          <label className="block text-sm text-zinc-300">Consigne du jour<textarea name="consigne" defaultValue={co.consigne} rows={2} className="mt-1 w-full rounded-xl border border-line bg-ink px-4 py-3" /></label>
          <label className="block text-sm text-zinc-300">Questions fréquentes (une par ligne : question | réponse)<textarea name="faq" defaultValue={faq} rows={4} className="mt-1 w-full rounded-xl border border-line bg-ink px-4 py-3" /></label>
          <button className="rounded-xl bg-accent px-5 py-3 font-semibold text-black">Enregistrer</button>
        </form>
      </section>}
    </main>
  );
}
