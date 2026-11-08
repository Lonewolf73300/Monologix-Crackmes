import { notFound, redirect } from "next/navigation";
import { extras } from "@/lib/flags";
import { currentUser } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { logout, punch } from "../actions";
import { Contours, Logo } from "../brand";
import Clock from "./Clock";
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
  // Une seule action principale selon la situation.
  const state = !last || last.kind === "part" ? "hors" : last.kind === "pause" ? "pause" : "service";
  const main = state === "hors" ? { kind: "arrive", label: "J'arrive" } : state === "pause" ? { kind: "reprise", label: "Reprendre" } : { kind: "part", label: "Je pars" };
  const status = state === "service" ? { dot: "bg-[#4ade80]", text: `En service · Arrivé à ${hhmm}` } : state === "pause" ? { dot: "bg-[#fbbf24]", text: `En pause depuis ${hhmm}` } : { dot: "bg-white/40", text: last ? `Hors service · Parti à ${hhmm}` : "Pas encore pointé aujourd'hui" };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-ink md:my-8 md:min-h-0 md:overflow-hidden md:rounded-2xl md:border md:border-line">
      <section className="relative overflow-hidden bg-night px-6 pb-10 pt-6 text-white">
        <Contours className="absolute inset-0 h-full w-full" cx={560} cy={60} />
        <div className="relative flex items-center justify-between">
          <Logo light />
          <form action={logout}><button className="text-sm text-white/55 hover:text-white">Quitter</button></form>
        </div>
        <div className="relative mt-10">
          <p className="font-mono text-[11px] uppercase tracking-label text-white/45 first-letter:uppercase">{today} · {co.name}</p>
          <p className="mt-3 text-[84px] font-semibold leading-none tracking-[-0.05em]"><Clock /></p>
          <p className="mt-4 text-lg">Bonjour {e.name.split(" ")[0]}, <span className="text-white/55">{e.post}</span></p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/[.08] px-3 py-1.5 text-sm"><span className={`h-2 w-2 rounded-full ${status.dot}`} />{status.text}</p>
        </div>
      </section>

      <section className="space-y-6 px-6 py-6">
        <form action={punch} className="space-y-2.5">
          <button name="kind" value={main.kind} className="w-full rounded-lg bg-accent py-5 text-xl font-semibold text-white shadow-lift transition-colors hover:bg-[#184a37]">{main.label}</button>
          {state === "service" && <button name="kind" value="pause" className="btn-ghost w-full py-3.5">Pause</button>}
          <p className="text-center text-xs text-zinc-500">Pointage par simple bouton, sans géolocalisation.</p>
        </form>

        <div>
          <h2 className="eyebrow">Consigne du jour</h2>
          <blockquote className="mt-2 border-l-2 border-accent pl-4 text-lg leading-snug">{co.consigne || <span className="text-zinc-500">Pas de consigne aujourd&apos;hui.</span>}</blockquote>
        </div>

        {faq.length > 0 && (
          <div>
            <h2 className="eyebrow">Questions fréquentes</h2>
            <div className="card mt-2 divide-y divide-line">{faq.map((x, i) => (
              <details key={i} className="group px-4 py-3.5"><summary className="flex cursor-pointer list-none items-center justify-between font-medium">{x.q}<span aria-hidden className="text-zinc-500 transition-transform group-open:rotate-45">+</span></summary><p className="mt-2 text-sm text-zinc-400">{x.a}</p></details>))}</div>
          </div>)}
      </section>
    </main>
  );
}
