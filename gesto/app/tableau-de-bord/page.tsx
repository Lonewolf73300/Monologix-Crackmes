import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "../actions";
import { suggestions } from "@/lib/rules";

export default async function Page() {
  const u = await requirePatron();
  const co = await db.prepare("SELECT * FROM companies WHERE id=?").get(u.company_id) as { name: string; type: string; nb_sal: string; pains: string; invite_code: string };
  const n = async (sql: string) => ((await db.prepare(sql).get(u.company_id)) as { n: number }).n;
  const emps = await n("SELECT COUNT(*) n FROM employees WHERE company_id=?");
  const docs = await n("SELECT COUNT(*) n FROM documents WHERE company_id=? AND status='a_relire'");
  const dl = await n("SELECT COUNT(*) n FROM deadlines WHERE company_id=? AND done=0");
  const tiles = [
    { href: "/salaries", t: "Mes employés", v: `${emps} salarié${emps > 1 ? "s" : ""}` },
    { href: "/documents", t: "Mes documents", v: docs ? `${docs} à relire` : "Aucun en attente" },
    { href: "/echeances", t: "Mes échéances", v: `${dl} à venir` },
    { href: "/cours/chapitre-1", t: "Mon cours", v: "Chapitre 1" },
  ];
  const sugg = suggestions({ type: co.type, nb_sal: co.nb_sal, pains: JSON.parse(co.pains || "[]") });
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-bold">{co.name}</h1>
        <form action={logout}><button className="text-sm text-zinc-500 underline">Déconnexion</button></form></div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {tiles.map((t) => <Link key={t.t} href={t.href} className="rounded-2xl border border-line bg-panel p-6 hover:border-accent"><p className="text-xl font-semibold">{t.t}</p><p className="mt-2 text-sm text-zinc-400">{t.v}</p></Link>)}
      </div>
      {emps === 0 && <Link href="/salaries/nouveau" className="mt-6 block rounded-xl bg-accent px-6 py-4 text-center text-lg font-semibold text-black">+ Nouveau salarié</Link>}
      {sugg.length > 0 && <section className="mt-8"><h2 className="font-semibold">Suggéré pour toi</h2><ul className="mt-2 space-y-1 text-sm text-zinc-400">{sugg.map((s) => <li key={s.title}>• {s.title} <span className="text-zinc-600">({s.why})</span></li>)}</ul></section>}
    </main>
  );
}
