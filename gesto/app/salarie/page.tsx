import { notFound } from "next/navigation";
import { extras } from "@/lib/flags";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { logout, punch } from "../actions";
import type { Emp } from "@/lib/documents";

const LABEL: Record<string, string> = { arrive: "Arrivé", pause: "En pause", reprise: "Repris", part: "Parti" };
export default async function Page() {
  if (!extras) notFound();
  const u = await currentUser();
  if (!u) redirect("/connexion");
  if (u.role !== "salarie") redirect("/tableau-de-bord");
  const emp = await db.prepare("SELECT id,enc FROM employees WHERE user_id=?").get(u.id) as { id: number; enc: string };
  const e = decrypt<Emp>(emp.enc);
  const co = await db.prepare("SELECT name,consigne,faq FROM companies WHERE id=?").get(u.company_id) as { name: string; consigne: string; faq: string };
  const last = await db.prepare("SELECT kind,at FROM punches WHERE employee_id=? ORDER BY id DESC LIMIT 1").get(emp.id) as { kind: string; at: string } | undefined;
  const faq = JSON.parse(co.faq) as { q: string; a: string }[];
  const btn = "rounded-2xl px-4 py-6 text-xl font-semibold ";
  return (
    <main className="mx-auto max-w-md px-5 pb-10">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Bonjour {e.name.split(" ")[0]}</h1><form action={logout}><button className="text-sm text-zinc-500 underline">Quitter</button></form></div>
      <p className="text-sm text-zinc-500">{co.name}</p>
      <section className="mt-5 rounded-2xl border border-line bg-panel p-5"><h2 className="text-sm text-accent">Consigne du jour</h2><p className="mt-1">{co.consigne || "Pas de consigne aujourd'hui."}</p></section>
      <section className="mt-4 rounded-2xl border border-line bg-panel p-5">
        <p className="text-sm text-zinc-400">{last ? `${LABEL[last.kind]} à ${new Date(last.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "Pas encore pointé"}</p>
        <form action={punch} className="mt-3 grid grid-cols-2 gap-3">
          <button name="kind" value="arrive" className={btn + "bg-accent text-black"}>J&apos;arrive</button>
          <button name="kind" value="part" className={btn + "bg-zinc-200 text-black"}>Je pars</button>
          <button name="kind" value="pause" className={btn + "border border-line"}>Pause</button>
          <button name="kind" value="reprise" className={btn + "border border-line"}>Reprise</button>
        </form>
        <p className="mt-3 text-xs text-zinc-500">Pointage par simple bouton, sans géolocalisation.</p>
      </section>
      {faq.length > 0 && <section className="mt-4 space-y-2"><h2 className="font-semibold">Questions fréquentes</h2>{faq.map((x, i) => <details key={i} className="rounded-xl border border-line bg-panel p-4"><summary className="cursor-pointer">{x.q}</summary><p className="mt-2 text-sm text-zinc-400">{x.a}</p></details>)}</section>}
    </main>
  );
}
export const dynamic = "force-dynamic";
