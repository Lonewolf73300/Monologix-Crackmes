import { notFound, redirect } from "next/navigation";
import { extras } from "@/lib/flags";
import { currentUser } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { logout, punch } from "../actions";
import { Logo } from "../brand";
import { Banner } from "../banner";
import { Chip, Icon } from "../icons";
import Clock from "./Clock";
import type { Emp } from "@/lib/documents";
import { mediaUrls } from "@/lib/media";

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
  const media = await mediaUrls(u.company_id!);
  const faq = JSON.parse(co.faq) as { q: string; a: string }[];
  const hhmm = last ? new Date(last.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "";
  const day = new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
  // Une seule action principale selon la situation.
  const state = !last || last.kind === "part" ? "hors" : last.kind === "pause" ? "pause" : "service";
  const main = state === "hors" ? { kind: "arrive", label: "J'arrive" } : state === "pause" ? { kind: "reprise", label: "Reprendre" } : { kind: "part", label: "Je pars" };
  const status = state === "service" ? { tone: "vert" as const, top: "En service", text: `Arrivé à ${hhmm}` } : state === "pause" ? { tone: "orange" as const, top: "En pause", text: `Depuis ${hhmm}` } : { tone: "gris" as const, top: "Pointage", text: last ? `Parti à ${hhmm}` : "Pas encore pointé" };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-ink lg:my-10 lg:min-h-0 lg:overflow-hidden lg:rounded-[2rem] lg:shadow-lift">
      <section className="relative h-60 overflow-hidden bg-night text-white">
        <Banner src={media.banniere} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-transparent" />
        <div className="relative flex items-start justify-between p-5">
          <div><Logo light /><p className="mt-1.5 flex items-center gap-1.5 pl-1 text-sm text-white/85"><Icon name="pin" className="h-4 w-4" />{co.name}</p></div>
          <form action={logout}><button aria-label="Quitter" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur"><Icon name="logout" className="h-[18px] w-[18px]" /></button></form>
        </div>
      </section>

      <section className="relative -mt-8 space-y-4 rounded-t-[2rem] bg-ink px-5 pb-8 pt-6">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 ring-4 ring-white"><Icon name="chefHat" className="h-8 w-8" /></span>
          <div><h1 className="text-[28px] font-bold leading-tight tracking-tight">Bonjour {e.name.split(" ")[0]} <span aria-hidden>👋</span></h1><p className="text-zinc-500">Prêt pour le service ?</p></div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="card flex flex-col items-center gap-1 px-2 py-3.5 text-center"><Icon name="calendar" className="h-6 w-6 text-zinc-400" /><p className="text-xs text-zinc-500">Aujourd&apos;hui</p><p className="text-sm font-bold first-letter:uppercase">{day}</p></div>
          <div className="card flex flex-col items-center gap-1 bg-blue-50 px-2 py-3.5 text-center"><Icon name="clock" className="h-6 w-6 text-blue-600" /><p className="text-2xl font-bold leading-none text-[#0f172a]">{state === "service" ? hhmm : <Clock />}</p><p className="text-xs text-zinc-500">{state === "service" ? "Prise de poste" : "Heure"}</p></div>
          <div className={`card flex flex-col items-center gap-1 px-2 py-3.5 text-center ${status.tone === "vert" ? "bg-green-50" : status.tone === "orange" ? "bg-amber-50" : ""}`}><Chip name={status.tone === "vert" ? "checkCircle" : status.tone === "orange" ? "pause" : "clock"} tone={status.tone} size="sm" /><p className="text-xs text-zinc-500">{status.top}</p><p className="text-sm font-bold">{status.text}</p></div>
        </div>

        <div className="card flex items-center gap-4 p-4"><Chip name="chefHat" tone="vert" /><div><p className="text-sm text-zinc-500">Poste</p><p className="text-lg font-bold">{e.post}</p></div></div>
        <div className="card flex items-center gap-4 p-4"><Chip name="info" tone="bleu" /><div className="min-w-0"><p className="text-sm text-zinc-500">Consigne du jour</p><p className="font-semibold">{co.consigne || "Pas de consigne aujourd'hui"}</p></div></div>

        <form action={punch} className="space-y-2.5 pt-1">
          <button name="kind" value={main.kind} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-b from-[#28b85b] to-[#1a8b43] py-5 text-2xl font-bold text-white shadow-green transition hover:brightness-105">
            <Icon name="play" filled className="h-6 w-6" />{main.label}
          </button>
          {state === "service" && <button name="kind" value="pause" className="btn-ghost w-full py-3.5"><Icon name="pause" className="h-5 w-5" />Pause</button>}
          <p className="text-center text-xs text-zinc-500">Pointage par simple bouton, sans géolocalisation.</p>
        </form>

        {faq.length > 0 && (
          <div className="space-y-2">
            <h2 className="eyebrow pt-2">Questions fréquentes</h2>
            {faq.map((x, i) => (
              <details key={i} className="card group p-4"><summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{x.q}<Icon name="chevronRight" className="h-5 w-5 text-zinc-400 transition-transform group-open:rotate-90" /></summary><p className="mt-2 text-sm text-zinc-500">{x.a}</p></details>))}
          </div>)}
      </section>
    </main>
  );
}
