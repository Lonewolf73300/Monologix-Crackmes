import { notFound, redirect } from "next/navigation";
import { extras } from "@/lib/flags";
import { currentUser } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { logout, punch } from "../actions";
import { Tile } from "../tile";
import { Avatar, Hero, Logo, Toque } from "../brand";
import type { Emp } from "@/lib/documents";

export const dynamic = "force-dynamic";
const TZ = "Europe/Paris";
export default async function Page() {
  if (!extras) notFound();
  const u = await currentUser();
  if (!u) redirect("/connexion");
  if (u.role !== "salarie") redirect("/tableau-de-bord");
  const emp = (await db.prepare("SELECT id,enc FROM employees WHERE user_id=?").get(u.id)) as { id: number; enc: string };
  const e = decrypt<Emp>(emp.enc);
  const co = (await db.prepare("SELECT name,consigne,faq FROM companies WHERE id=?").get(u.company_id)) as { name: string; consigne: string; faq: string };
  const last = (await db.prepare("SELECT kind,at FROM punches WHERE employee_id=? ORDER BY id DESC LIMIT 1").get(emp.id)) as { kind: string; at: string } | undefined;
  const faq = JSON.parse(co.faq) as { q: string; a: string }[];
  const hhmm = last ? new Date(last.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "";
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
  // Une action principale selon la situation.
  const state = !last || last.kind === "part" ? "hors" : last.kind === "pause" ? "pause" : "service";
  const main = state === "hors" ? { kind: "arrive", label: "J'arrive" } : state === "pause" ? { kind: "reprise", label: "Reprendre" } : { kind: "part", label: "Je pars" };
  return (
    <main className="mx-auto max-w-md pb-6 md:max-w-xl">
      <section className="relative h-56 overflow-hidden md:rounded-3xl">
        <Hero className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent" />
        <div className="relative flex items-start justify-between p-5 text-white">
          <div><Logo light /><p className="mt-1 text-sm text-white/85">{co.name}</p></div>
          <form action={logout}><button className="text-sm text-white/85 underline">Quitter</button></form>
        </div>
      </section>
      <section className="relative -mt-8 space-y-4 rounded-t-3xl bg-ink px-5 pb-4 pt-6">
        <div className="flex items-center gap-4">
          <Avatar name={e.name} size={56} />
          <div><h1 className="text-3xl font-bold">Bonjour {e.name.split(" ")[0]} 👋</h1><p className="text-slate-500 first-letter:uppercase">{today}</p></div>
        </div>
        <div className="card flex items-center gap-4 p-4"><span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700"><Toque className="h-6 w-6" /></span><div><p className="text-sm text-slate-500">Poste</p><p className="text-lg font-bold">{e.post}</p></div></div>
        <Tile tone="bleu" label="Consigne du jour" title={co.consigne || "Pas de consigne aujourd'hui"} />
        {state === "service" && <Tile tone="vert" label="En service" title={`Arrivé à ${hhmm}`} />}
        {state === "pause" && <Tile tone="orange" label="En pause" title={`Depuis ${hhmm}`} />}
        {state === "hors" && <Tile tone="bleu" label="Pointage" title={last ? `Parti à ${hhmm}` : "Pas encore pointé"} />}
        <form action={punch} className="space-y-3">
          <button name="kind" value={main.kind} className="w-full rounded-2xl bg-gradient-to-b from-green-500 to-green-700 px-6 py-5 text-2xl font-bold text-white shadow-card">{main.label}</button>
          {state === "service" && <button name="kind" value="pause" className="w-full rounded-2xl border border-line bg-white px-6 py-4 text-lg font-semibold shadow-card">Pause</button>}
          <p className="text-xs text-slate-500">Pointage par simple bouton, sans géolocalisation.</p>
        </form>
        {faq.length > 0 && <div className="space-y-2"><h2 className="font-bold">Questions fréquentes</h2>{faq.map((x, i) => <details key={i} className="card p-4"><summary className="cursor-pointer font-medium">{x.q}</summary><p className="mt-2 text-sm text-slate-600">{x.a}</p></details>)}</div>}
      </section>
    </main>
  );
}
