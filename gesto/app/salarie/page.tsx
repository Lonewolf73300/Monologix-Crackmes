import { notFound, redirect } from "next/navigation";
import { extras } from "@/lib/flags";
import { currentUser } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { logout, punch } from "../actions";
import { Tile } from "../tile";
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
    <main className="mx-auto max-w-md px-5 pb-10">
      <div className="flex items-start justify-between">
        <div><h1 className="text-3xl font-bold">Bonjour {e.name.split(" ")[0]} 👋</h1><p className="text-zinc-400 first-letter:uppercase">{today} · {co.name}</p></div>
        <form action={logout}><button className="text-sm text-zinc-500 underline">Quitter</button></form>
      </div>
      <div className="mt-5 space-y-3">
        <Tile tone="bleu" label="Consigne du jour" title={co.consigne || "Pas de consigne aujourd'hui"} />
        {state === "service" && <Tile tone="vert" label="En service" title={`Arrivé à ${hhmm}`} />}
        {state === "pause" && <Tile tone="orange" label="En pause" title={`Depuis ${hhmm}`} />}
        {state === "hors" && <Tile tone="bleu" label="Pointage" title={last ? `Parti à ${hhmm}` : "Pas encore pointé"} />}
      </div>
      <form action={punch} className="mt-5 space-y-3">
        <button name="kind" value={main.kind} className="w-full rounded-2xl bg-accent px-6 py-6 text-2xl font-bold text-black">{main.label}</button>
        {state === "service" && <button name="kind" value="pause" className="w-full rounded-2xl border border-line px-6 py-4 text-lg font-semibold">Pause</button>}
        <p className="text-xs text-zinc-500">Pointage par simple bouton, sans géolocalisation.</p>
      </form>
      {faq.length > 0 && <section className="mt-6 space-y-2"><h2 className="font-semibold">Questions fréquentes</h2>{faq.map((x, i) => <details key={i} className="rounded-xl border border-line bg-panel p-4"><summary className="cursor-pointer">{x.q}</summary><p className="mt-2 text-sm text-zinc-400">{x.a}</p></details>)}</section>}
    </main>
  );
}
