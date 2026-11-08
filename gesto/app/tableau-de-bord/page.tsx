import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { pushConfigured } from "@/lib/push";
import { mediaUrls } from "@/lib/media";
import { KIND_LABEL, missingInfo, type Emp, type Kind } from "@/lib/documents";
import { toggleDeadline, validateDoc } from "../actions";
import { Avatar, Logo } from "../brand";
import { Banner } from "../banner";
import { Chip, Icon, type ChipTone, type IconName } from "../icons";
import ProfileMenu from "../ProfileMenu";
import FocusList, { type Row } from "./FocusList";

const SHORT: Record<string, string> = { convention: "la convention collective", essai: "la période d'essai", motif: "le motif du CDD" };
type Act = { label: string; icon: IconName; href?: string; deadlineId?: number };
type Item = { key: string; tone: "rouge" | "orange" | "bleu"; title: string; sub: string; now: string; href: string; primary: Act; secondary?: Act };
const joinFr = (a: string[]) => (a.length > 1 ? `${a.slice(0, -1).join(", ")} et ${a[a.length - 1]}` : a[0] ?? "");

export default async function Page() {
  const u = await requirePatron();
  const co = (await db.prepare("SELECT name FROM companies WHERE id=?").get(u.company_id)) as { name: string };
  const media = await mediaUrls(u.company_id);
  const n = async (sql: string, ...p: unknown[]) => ((await db.prepare(sql).get(u.company_id, ...p)) as { n: number }).n;
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const emps = await n("SELECT COUNT(*) n FROM employees WHERE company_id=?");
  const newEmps = await n("SELECT COUNT(*) n FROM employees WHERE company_id=? AND created>=?", weekAgo);
  const toReview = await n("SELECT COUNT(*) n FROM documents WHERE company_id=? AND status='a_relire'");
  const open = await n("SELECT COUNT(*) n FROM deadlines WHERE company_id=? AND done=0");
  const devices = await n("SELECT COUNT(*) n FROM push_subs WHERE company_id=?");
  const late = (await db.prepare("SELECT id,title,due FROM deadlines WHERE company_id=? AND done=0 AND due<? ORDER BY due").all(u.company_id, today)) as { id: number; title: string; due: string }[];
  const soon = (await db.prepare("SELECT id,title,due FROM deadlines WHERE company_id=? AND done=0 AND due>=? AND due<=? ORDER BY due").all(u.company_id, today, in7)) as { id: number; title: string; due: string }[];
  const next = (await db.prepare("SELECT due FROM deadlines WHERE company_id=? AND done=0 AND due>=? ORDER BY due LIMIT 1").get(u.company_id, today)) as { due: string } | undefined;
  const pending = (await db.prepare("SELECT d.id,d.kind,e.enc FROM documents d JOIN employees e ON e.id=d.employee_id WHERE d.company_id=? AND d.status='a_relire' ORDER BY d.id").all(u.company_id)) as { id: number; kind: Kind; enc: string }[];
  const blocked = pending.filter((d) => d.kind === "contrat").map((d) => ({ id: d.id, e: decrypt<Emp>(d.enc) })).map((x) => ({ ...x, miss: missingInfo(x.e) })).filter((x) => x.miss.length);
  const recent = (await db.prepare("SELECT d.id,d.kind,d.status,d.version,d.created,e.enc FROM documents d JOIN employees e ON e.id=d.employee_id WHERE d.company_id=? ORDER BY d.id DESC LIMIT 4").all(u.company_id)) as { id: number; kind: Kind; status: string; version: number; created: string; enc: string }[];

  const fr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const days = (d: string) => Math.round((Date.parse(d) - Date.parse(today)) / 864e5);
  const rel = (d: string) => { const k = days(d); return k < 0 ? `en retard de ${-k} j` : k === 0 ? "aujourd'hui" : `dans ${k} j`; };
  const ago = (iso: string) => { const k = Math.floor((Date.parse(today) - Date.parse(iso.slice(0, 10))) / 864e5); return k <= 0 ? "Créé aujourd'hui" : k === 1 ? "Créé hier" : `Il y a ${k} jours`; };
  const dl = (d: { id: number; title: string; due: string }, tone: "rouge" | "orange"): Item => ({
    key: `d${d.id}`, tone, title: d.title, sub: `Échéance le ${fr(d.due)} · ${rel(d.due)}`, now: d.title, href: `/echeances?id=${d.id}`,
    primary: { label: "C'est fait", icon: "check", deadlineId: d.id }, secondary: { label: "Voir le dossier", icon: "eye", href: `/echeances?id=${d.id}` },
  });
  const items: Item[] = [
    ...late.map((d) => dl(d, "rouge")),
    ...(blocked.length ? [{
      key: "b", tone: "rouge", title: blocked.length > 1 ? `${blocked.length} contrats bloqués : informations manquantes` : "Contrat bloqué : informations manquantes",
      sub: blocked.map((b) => `${b.e.name} — il manque ${joinFr(b.miss.map((m) => SHORT[m.key]))}`).join(" · "),
      now: `Compléter le contrat de ${blocked[0].e.name}`, href: "/documents",
      primary: { label: "Compléter le contrat", icon: "check", href: "/documents" }, secondary: { label: "Voir l'aperçu", icon: "eye", href: `/api/documents/${blocked[0].id}?apercu=1` },
    } as Item] : []),
    ...soon.map((d) => dl(d, "orange")),
    ...(toReview ? [{
      key: "r", tone: "orange", title: `${toReview} document${toReview > 1 ? "s" : ""} en attente de validation`, sub: "Rien n'est utilisable avant ta validation.",
      now: "Relire et valider les documents", href: "/documents",
      primary: { label: "Relire et valider", icon: "check", href: "/documents" }, secondary: { label: "Voir l'aperçu", icon: "eye", href: `/api/documents/${pending[0].id}?apercu=1` },
    } as Item] : []),
    ...(pushConfigured() && devices === 0 ? [{
      key: "p", tone: "bleu", title: "Active les notifications sur ton téléphone", sub: "Pour recevoir tes rappels à l'heure, même écran verrouillé.",
      now: "Activer les rappels sur ce téléphone", href: "/echeances", primary: { label: "Activer les rappels", icon: "bell", href: "/echeances" },
    } as Item] : []),
  ];
  const first = items[0];
  const urgent = items.filter((i) => i.tone === "rouge").length;
  const LBL: Record<string, string> = { rouge: "Urgent", orange: "À traiter", bleu: "À savoir" };
  const ICO: Record<string, IconName> = { rouge: "alert", orange: "clipboard", bleu: "info" };
  const rows: Row[] = first
    ? [{ key: "now", tone: "vert", label: "Quoi faire maintenant", title: first.now, href: first.href, icon: "play" }, ...items.slice(1).map((i): Row => ({ key: i.key, tone: i.tone, label: LBL[i.tone], title: i.title, href: i.href, icon: ICO[i.tone] }))]
    : [{ key: "ok", tone: "vert", label: "Tout est à jour", title: "Rien d'urgent : bon service !", icon: "checkCircle" }];
  const who = u.first_name || "";
  const hello = <>Bonjour{who ? ` ${who}` : ""} <span aria-hidden>👋</span></>;
  const alerts = late.length + soon.length;
  const nextTxt = next ? (days(next.due) === 0 ? "Aujourd'hui" : `${days(next.due)} j`) : "Aucune";

  const Bell = ({ glass }: { glass?: boolean }) => (
    <Link href="/echeances" aria-label={`Échéances à traiter : ${alerts}`} className={`relative flex h-12 w-12 items-center justify-center rounded-full ${glass ? "bg-black/45 text-white backdrop-blur hover:bg-black/55" : "text-[#0f172a] hover:bg-slate-100"}`}>
      <Icon name="bell" className="h-7 w-7" />{alerts > 0 && <span className="absolute right-0.5 top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white ring-2 ring-white">{alerts}</span>}
    </Link>);
  const ActBtn = ({ a, primary }: { a: Act; primary?: boolean }) => {
    const cls = primary ? "btn-primary flex-1 py-3.5 text-[17px]" : "btn-ghost flex-1 py-3.5 text-[17px]";
    const inner = <><Icon name={a.icon} className="h-5 w-5" />{a.label}</>;
    if (a.deadlineId) return <form action={toggleDeadline} className="flex flex-1"><input type="hidden" name="id" value={a.deadlineId} /><button className={`${cls} w-full`}>{inner}</button></form>;
    return a.href!.startsWith("/api/") ? <a href={a.href} className={cls}>{inner}</a> : <Link href={a.href!} className={cls}>{inner}</Link>;
  };
  const RING: Record<string, string> = { rouge: "bg-red-500", orange: "bg-amber-500", bleu: "bg-blue-600", vert: "bg-green-600" };
  const WASH: Record<string, string> = { rouge: "from-red-50/90 via-white", orange: "from-amber-50/90 via-white", bleu: "from-blue-50/90 via-white", vert: "from-green-50 via-white" };
  const tone = first?.tone ?? "vert";

  return (
    <main className="mx-auto max-w-[1240px] lg:px-0">
      {/* ===== Maquette 1 — en-tête mobile ===== */}
      <header className="px-5 pt-5 lg:hidden">
        <div className="flex items-center justify-between"><Logo /><div className="flex items-center gap-2"><Bell /><ProfileMenu variant="icon" name={who || co.name} company={co.name} email={u.email} photo={media.profil} /></div></div>
        <div className="mt-4 flex items-center gap-4">
          <Avatar name={co.name} src={media.profil} size={84} />
          <div className="min-w-0"><h1 className="text-[28px] font-bold leading-tight tracking-tight">{hello}</h1><p className="truncate text-[17px] text-zinc-500">Propriétaire · {co.name}</p></div>
        </div>
      </header>

      {/* ===== Maquette 3 — bannière ordinateur ===== */}
      <section className="relative hidden h-[300px] overflow-hidden bg-night text-white lg:block">
        <Banner src={media.banniere} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/5" />
        <div className="absolute right-8 top-5 flex items-center gap-3"><Bell glass /><ProfileMenu variant="pill" name={who || u.email.split("@")[0]} company={co.name} email={u.email} photo={media.profil} /></div>
        <div className="relative px-12 pt-24"><h1 className="text-[58px] font-bold leading-none tracking-tight">{hello}</h1><p className="mt-5 max-w-xl text-[22px] leading-snug text-white/90">Gérez vos salariés, vos documents et vos échéances, tout en un seul endroit.</p></div>
      </section>
      <div className="relative z-10 -mt-12 hidden grid-cols-3 gap-4 px-10 lg:grid">
        {([["/salaries/nouveau", "Embaucher", "un salarié", "userPlus", true], ["/documents", "Gérer", "mes documents", "calendar", false], ["/echeances", "Suivre", "mes échéances", "bars", false]] as const).map(([h, a, b, ic, gold]) => (
          <Link key={h} href={h} className={`group flex min-w-0 items-center gap-4 rounded-2xl px-6 py-5 shadow-lift transition hover:-translate-y-0.5 ${gold ? "border border-[#f4d58b] bg-gradient-to-br from-[#f6d68a] to-[#e2ad4c]" : "border border-white bg-white/95"}`}>
            <Icon name={ic === "bars" ? "clock" : ic} className="h-10 w-10 shrink-0 text-[#1f2430]" />
            <span className="min-w-0 flex-1 text-[18px] leading-snug text-[#1f2430]"><b className="block">{a}</b><span className="block whitespace-nowrap">{b}</span></span>
            <Icon name="arrowRight" className="h-6 w-6 shrink-0 text-[#1f2430] transition group-hover:translate-x-1" />
          </Link>))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 px-4 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
        <div className="min-w-0 space-y-5">
          {/* Maquette 3 — chiffres */}
          <div className="hidden grid-cols-3 gap-4 lg:grid">
            {([["users", `${emps}`, emps > 1 ? "Salariés" : "Salarié", newEmps], ["calendar", `${open}`, open > 1 ? "Échéances" : "Échéance", 0], ["checkCircle", `${toReview}`, "À relire", 0]] as const).map(([ic, v, l, badge]) => (
              <div key={l} className="card relative flex min-w-0 items-center gap-4 px-5 py-5">
                <Icon name={ic} className="h-10 w-10 shrink-0 text-[#1f2430]" />
                <div className="min-w-0"><p className="text-[36px] font-bold leading-none">{v}</p><p className="mt-1 truncate text-[15px] text-zinc-400">{l}</p></div>
                {badge > 0 && <span className="absolute right-4 top-4 rounded-lg bg-green-100 px-2 py-0.5 text-sm font-bold text-green-700" title="Cette semaine">+{badge}</span>}
              </div>))}
          </div>

          {/* Maquette 1 — carte décision */}
          <section className={`relative overflow-hidden rounded-[22px] border border-line bg-gradient-to-br ${WASH[tone]} to-white p-5 shadow-card lg:p-7`}>
            <div className="pointer-events-none absolute -right-6 -top-6 hidden h-44 w-44 items-center justify-center rounded-full bg-green-100/60 sm:flex"><Icon name="clipboard" className="h-24 w-24 -rotate-12 text-green-600/80" /></div>
            <div className="relative flex gap-4 sm:pr-40">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lift ${RING[tone]}`}><Icon name={first ? (tone === "bleu" ? "info" : tone === "orange" ? "clock" : "alert") : "check"} className="h-7 w-7" /></span>
              <div className="min-w-0">
                <h2 className="text-[24px] font-bold leading-tight tracking-tight lg:text-[28px]">{first ? first.title : "Tout est à jour"}</h2>
                <p className="mt-1.5 text-[17px] text-zinc-400">{first ? first.sub : "Aucune échéance dans les 7 jours, aucun document en attente."}</p>
              </div>
            </div>
            <div className="relative mt-5 flex flex-col gap-3 sm:flex-row">
              {first ? <><ActBtn a={first.primary} primary />{first.secondary && <ActBtn a={first.secondary} />}</> : <Link href="/salaries/nouveau" className="btn-primary flex-1 py-3.5 text-[17px]"><Icon name="plus" className="h-5 w-5" />Nouveau salarié</Link>}
            </div>
          </section>

          {/* Maquette 1 — Gesto Now */}
          <section className="card rounded-[22px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Icon name="bolt" className="h-5 w-5" filled /></span><h2 className="text-[22px] font-bold tracking-tight">Gesto Now</h2><span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-sm font-semibold text-green-700"><span className="h-2 w-2 rounded-full bg-green-600" />Aujourd&apos;hui</span></div>
              <p className="hidden items-center gap-1.5 truncate text-zinc-400 sm:flex"><Icon name="pin" className="h-5 w-5" />{co.name}</p>
            </div>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-stretch">
              <div className="flex items-center gap-4 rounded-2xl bg-blue-50 px-5 py-4 sm:w-[40%]">
                <Icon name="cloche" className="h-12 w-12 shrink-0 text-blue-700" />
                <div><p className="text-[17px] text-[#1f2430]">Prochaine échéance</p><p className="text-[38px] font-bold leading-none text-blue-800">{nextTxt}</p></div>
              </div>
              <div className="grid min-w-0 flex-1 grid-cols-4 divide-x divide-line">
                {([["checkCircle", emps ? "vert" : "gris", "Équipe", `${emps} salarié${emps > 1 ? "s" : ""}`], ["clipboard", "orange", `${toReview} à relire`, "documents"], ["alert", urgent ? "rouge" : "vert", urgent ? `${urgent} urgent${urgent > 1 ? "s" : ""}` : "Urgent", urgent ? "à traiter" : "aucun"], ["bell", "bleu", "Rappels", devices ? "activés" : "à activer"]] as [IconName, ChipTone, string, string][]).map(([ic, t, a, b]) => (
                  <div key={a + b} className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-center">
                    <Icon name={ic} className={`h-8 w-8 ${t === "vert" ? "text-green-600" : t === "orange" ? "text-amber-500" : t === "rouge" ? "text-red-600" : t === "bleu" ? "text-blue-600" : "text-slate-400"}`} />
                    <p className="text-[13px] font-bold leading-tight sm:text-[15px]">{a}</p><p className="text-xs leading-tight text-zinc-400 sm:text-sm">{b}</p>
                  </div>))}
              </div>
            </div>
          </section>

          {/* Maquette 1 — Mode Focus */}
          <FocusList rows={rows} />

          {/* Maquette 3 — derniers documents */}
          {recent.length > 0 && (
            <section className="card rounded-[22px] p-5 lg:p-6">
              <div className="flex items-center justify-between"><h2 className="text-[22px] font-bold tracking-tight">Derniers documents</h2><Link href="/documents" className="flex items-center gap-1.5 shrink-0 font-semibold text-[#a8761f]"><span className="sm:hidden">Tout voir</span><span className="hidden sm:inline">Voir tous les documents</span> <Icon name="arrowRight" className="h-5 w-5" /></Link></div>
              <ul className="mt-4 space-y-2">{recent.map((r) => { const e = decrypt<Emp>(r.enc); const bl = r.kind === "contrat" && r.status !== "valide" && missingInfo(e).length > 0; return (
                <li key={r.id} className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <Avatar name={e.name} size={52} />
                  <div className="min-w-0 flex-1"><p className="truncate text-[17px] font-bold">{e.name}</p><p className="truncate text-zinc-400">{KIND_LABEL[r.kind]}<span className="2xl:hidden"> · {ago(r.created).toLowerCase()}</span></p></div>
                  <p className="hidden shrink-0 whitespace-nowrap text-zinc-400 2xl:block">{ago(r.created)}</p>
                  <a href={`/api/documents/${r.id}?apercu=1`} aria-label="Relire le document" title="Relire" className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-white text-[#1f2430] shadow-card hover:border-zinc-600"><Icon name="eye" className="h-6 w-6" /></a>
                  {r.status === "valide" ? <span title="Validé" className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700"><Icon name="check" className="h-6 w-6" /></span>
                    : bl ? <Link href="/documents" aria-label="Compléter le contrat" title="Informations manquantes" className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600"><Icon name="alert" className="h-6 w-6" /></Link>
                    : <form action={validateDoc}><input type="hidden" name="id" value={r.id} /><button aria-label="J'ai relu, je valide" title="J'ai relu, je valide" className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-b from-[#3cbf5c] to-[#259b45] text-white shadow-green"><Icon name="check" className="h-6 w-6" /></button></form>}
                </li>); })}</ul>
            </section>)}
        </div>

        {/* Maquette 3 — panneau sombre or (Mon cours) */}
        <aside>
          <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-b from-[#1b2130] to-[#11151d] p-7 text-white shadow-lift lg:sticky lg:top-6">
            <Banner src={media.banniere} className="absolute inset-x-0 bottom-0 h-56 w-full opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1b2130] via-[#1b2130]/90 to-transparent" />
            <div className="relative">
              <div className="flex items-start gap-3"><Icon name="crown" className="mt-1 h-8 w-8 text-gold" /><p className="text-[26px] font-bold leading-tight">Mon cours Gesto<br /><span className="text-gold">Chapitre 1</span></p></div>
              <ul className="mt-6 space-y-3.5 text-[17px] text-white/90">
                {["La DPAE avant l'arrivée", "Le contrat écrit", "Horaires et registre", "Mutuelle et médecine du travail", "Gratuit, sans carte"].map((x) => <li key={x} className="flex items-center gap-3"><Icon name="check" className="h-5 w-5 text-gold" />{x}</li>)}
              </ul>
              <Link href="/cours/chapitre-1" className="btn-gold mt-8 w-full py-4 text-[17px]">Lire le chapitre <Icon name="arrowRight" className="h-5 w-5" /></Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
