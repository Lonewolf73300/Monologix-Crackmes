import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { pushConfigured } from "@/lib/push";
import { KIND_LABEL, missingInfo, type Emp, type Kind } from "@/lib/documents";
import { logout, validateDoc } from "../actions";
import { Tile, type Tone } from "../tile";
import { Avatar, Logo } from "../brand";
import { Banner } from "../banner";
import { Chip, Icon, type IconName } from "../icons";

const TZ = "Europe/Paris";
const SHORT: Record<string, string> = { convention: "convention collective", essai: "période d'essai", motif: "motif du CDD" };
type Item = { key: string; tone: Tone; label: string; title: string; sub?: string; href: string; cta: string };

export default async function Page() {
  const u = await requirePatron();
  const co = (await db.prepare("SELECT name FROM companies WHERE id=?").get(u.company_id)) as { name: string };
  const n = async (sql: string, ...p: unknown[]) => ((await db.prepare(sql).get(u.company_id, ...p)) as { n: number }).n;
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const emps = await n("SELECT COUNT(*) n FROM employees WHERE company_id=?");
  const toReview = await n("SELECT COUNT(*) n FROM documents WHERE company_id=? AND status='a_relire'");
  const open = await n("SELECT COUNT(*) n FROM deadlines WHERE company_id=? AND done=0");
  const late = (await db.prepare("SELECT id,title,due FROM deadlines WHERE company_id=? AND done=0 AND due<? ORDER BY due").all(u.company_id, today)) as { id: number; title: string; due: string }[];
  const soon = (await db.prepare("SELECT id,title,due FROM deadlines WHERE company_id=? AND done=0 AND due>=? AND due<=? ORDER BY due").all(u.company_id, today, in7)) as { id: number; title: string; due: string }[];
  const next = (await db.prepare("SELECT due FROM deadlines WHERE company_id=? AND done=0 AND due>=? ORDER BY due LIMIT 1").get(u.company_id, today)) as { due: string } | undefined;
  const contracts = (await db.prepare("SELECT e.enc FROM documents d JOIN employees e ON e.id=d.employee_id WHERE d.company_id=? AND d.kind='contrat' AND d.status='a_relire'").all(u.company_id)) as { enc: string }[];
  const blocked = contracts.map((c) => decrypt<Emp>(c.enc)).map((e) => ({ name: e.name, miss: missingInfo(e) })).filter((x) => x.miss.length);
  const devices = await n("SELECT COUNT(*) n FROM push_subs WHERE company_id=?");
  const recent = (await db.prepare("SELECT d.id,d.kind,d.status,d.version,d.created,e.enc FROM documents d JOIN employees e ON e.id=d.employee_id WHERE d.company_id=? ORDER BY d.id DESC LIMIT 4").all(u.company_id)) as { id: number; kind: Kind; status: string; version: number; created: string; enc: string }[];

  const fr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  const days = (d: string) => Math.round((Date.parse(d) - Date.parse(today)) / 864e5);
  const rel = (d: string) => { const k = days(d); return k < 0 ? `en retard de ${-k} j` : k === 0 ? "aujourd'hui" : `dans ${k} j`; };
  const items: Item[] = [
    ...late.map((d): Item => ({ key: `l${d.id}`, tone: "rouge", label: "En retard", title: d.title, sub: `${fr(d.due)} · ${rel(d.due)}`, href: `/echeances?id=${d.id}`, cta: "Ouvrir le dossier" })),
    ...(blocked.length ? [{ key: "b", tone: "rouge", label: "Contrat bloqué", title: `${blocked.length} contrat${blocked.length > 1 ? "s" : ""} : informations manquantes`, sub: blocked.map((b) => `${b.name} — ${b.miss.map((m) => SHORT[m.key]).join(", ")}`).join(" · "), href: "/documents", cta: "Compléter" } as Item] : []),
    ...soon.map((d): Item => ({ key: `s${d.id}`, tone: "orange", label: "Échéance", title: d.title, sub: `${fr(d.due)} · ${rel(d.due)}`, href: `/echeances?id=${d.id}`, cta: "Ouvrir le dossier" })),
    ...(toReview ? [{ key: "r", tone: "orange", label: "À relire", title: `${toReview} document${toReview > 1 ? "s" : ""} en attente de validation`, sub: "Rien n'est utilisable avant ta validation.", href: "/documents", cta: "Relire" } as Item] : []),
    ...(pushConfigured() && devices === 0 ? [{ key: "p", tone: "bleu", label: "Rappels", title: "Active les notifications sur ton téléphone", sub: "Pour recevoir tes rappels même écran verrouillé.", href: "/echeances", cta: "Activer" } as Item] : []),
  ];
  const [first, ...rest] = items;
  const urgent = items.filter((i) => i.tone === "rouge").length;
  const dateLong = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
  const BIG: Record<Tone, { ring: string; icon: IconName; wash: string }> = {
    rouge: { ring: "bg-red-500", icon: "alert", wash: "from-red-50" }, orange: { ring: "bg-amber-500", icon: "clock", wash: "from-amber-50" },
    vert: { ring: "bg-green-500", icon: "check", wash: "from-green-50" }, bleu: { ring: "bg-blue-500", icon: "info", wash: "from-blue-50" },
  };
  const hero = first ? BIG[first.tone] : BIG.vert;

  return (
    <main className="mx-auto max-w-6xl px-4 pt-4 lg:px-8 lg:pt-8">
      {/* Bannière */}
      <section className="relative overflow-hidden rounded-3xl bg-night text-white shadow-lift">
        <Banner className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
        <div className="relative flex min-h-[270px] flex-col justify-between p-5 pb-16 lg:min-h-[280px] lg:p-8 lg:pb-16">
          <div className="flex items-center justify-between">
            <span className="lg:hidden"><Logo light /></span>
            <p className="hidden text-sm font-medium text-white/75 first-letter:uppercase lg:block">{dateLong}</p>
            <div className="flex items-center gap-2">
              <Link href="/echeances" aria-label={`Échéances à traiter : ${late.length + soon.length}`} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25">
                <Icon name="bell" />{late.length + soon.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold">{late.length + soon.length}</span>}
              </Link>
              <form action={logout} className="lg:hidden"><button aria-label="Déconnexion" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur"><Icon name="logout" className="h-[18px] w-[18px]" /></button></form>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <Avatar name={co.name} size={56} dark />
            <div>
              <h1 className="text-3xl font-bold tracking-tight lg:text-[44px] lg:leading-tight">Bonjour</h1>
              <p className="text-white/80"><span className="hidden sm:inline">Propriétaire · </span>{co.name}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Raccourcis */}
      <div className="relative -mt-10 grid grid-cols-3 gap-3 px-2 lg:px-6">
        {([["/salaries/nouveau", "Nouveau salarié", "Contrat en 30 s", "userPlus", true], ["/documents", "Mes documents", toReview ? `${toReview} à relire` : "À jour", "file", false], ["/echeances", "Mes échéances", `${open} ouverte${open > 1 ? "s" : ""}`, "calendar", false]] as const).map(([h, t, d, ic, gold]) => (
          <Link key={h} href={h} className={`group flex flex-col items-start gap-3 rounded-2xl p-3.5 shadow-lift transition hover:-translate-y-0.5 lg:flex-row lg:items-center lg:p-5 ${gold ? "bg-gradient-to-br from-[#f3cd73] to-[#dba443] text-[#1f1a10]" : "bg-white"}`}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl lg:h-12 lg:w-12 ${gold ? "bg-white/35" : "bg-slate-100 text-slate-700"}`}><Icon name={ic} className="h-5 w-5 lg:h-6 lg:w-6" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold leading-tight lg:text-base">{t}</span><span className={`hidden text-sm lg:block ${gold ? "text-[#1f1a10]/70" : "text-zinc-500"}`}>{d}</span></span>
            <Icon name="arrowRight" className="hidden h-5 w-5 opacity-60 transition group-hover:translate-x-0.5 lg:block" />
          </Link>))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Priorité */}
          <section className={`card relative overflow-hidden bg-gradient-to-br ${hero.wash} to-white p-5 lg:p-6`}>
            <Icon name="clipboard" className="pointer-events-none absolute -right-4 -top-4 h-36 w-36 text-slate-900/[.04]" />
            <div className="relative flex gap-4">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lift ${hero.ring}`}><Icon name={hero.icon} className="h-6 w-6" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{first ? first.label : "Tout est à jour"}</p>
                <h2 className="mt-1 text-xl font-bold leading-snug tracking-tight lg:text-2xl">{first ? first.title : "Rien d'urgent aujourd'hui"}</h2>
                <p className="mt-1 text-zinc-500">{first ? first.sub : "Aucune échéance dans les 7 jours, aucun document en attente."}</p>
                <Link href={first ? first.href : "/salaries/nouveau"} className="btn-primary mt-4">{first ? <><Icon name="check" className="h-5 w-5" />{first.cta}</> : <><Icon name="plus" className="h-5 w-5" />Nouveau salarié</>}</Link>
              </div>
            </div>
          </section>

          {/* Coup d'œil */}
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Chip name="bolt" tone="bleu" size="sm" /><h2 className="text-lg font-bold">En un coup d&apos;œil</h2></div>
              <p className="hidden items-center gap-1 text-sm text-zinc-500 sm:flex"><Icon name="pin" className="h-4 w-4" />{co.name}</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-4">
              <div className="col-span-3 flex items-center gap-4 rounded-2xl bg-blue-50 p-4 md:col-span-1 md:flex-col md:items-start md:gap-1">
                <Icon name="calendar" className="h-8 w-8 text-blue-600" />
                <div><p className="text-sm text-zinc-500">Prochaine échéance</p><p className="text-2xl font-bold text-blue-700">{next ? (days(next.due) === 0 ? "Aujourd'hui" : `J-${days(next.due)}`) : "Aucune"}</p></div>
              </div>
              {([["users", "vert", `${emps}`, emps > 1 ? "salariés" : "salarié"], ["clipboard", "orange", `${toReview}`, "à relire"], ["alert", urgent ? "rouge" : "gris", `${urgent}`, urgent > 1 ? "urgents" : "urgent"]] as const).map(([ic, tone, v, l]) => (
                <div key={l} className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-line py-3 text-center">
                  <Chip name={ic} tone={tone} size="sm" /><p className="text-xl font-bold leading-none">{v}</p><p className="text-xs text-zinc-500">{l}</p>
                </div>))}
            </div>
          </section>

          {/* À faire */}
          {rest.length > 0 && (
            <section className="card p-5">
              <div className="flex items-center gap-3"><Chip name="target" tone="vert" size="sm" /><h2 className="text-lg font-bold">Ensuite</h2></div>
              <div className="mt-4 space-y-2.5">{rest.map((i) => <Tile key={i.key} tone={i.tone} label={i.label} title={i.title} meta={i.sub && i.key[0] !== "r" && i.key !== "p" ? i.sub : undefined} href={i.href} action={i.cta} />)}</div>
            </section>)}

          {/* Derniers documents */}
          {recent.length > 0 && (
            <section className="card p-5">
              <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Derniers documents</h2><Link href="/documents" className="flex items-center gap-1 text-sm font-semibold text-[#a8761f]">Tout voir <Icon name="arrowRight" className="h-4 w-4" /></Link></div>
              <ul className="mt-3 divide-y divide-line">{recent.map((r) => { const e = decrypt<Emp>(r.enc); const blockedDoc = r.kind === "contrat" && missingInfo(e).length > 0; return (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <Avatar name={e.name} size={40} />
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{e.name}</p><p className="truncate text-sm text-zinc-500">{KIND_LABEL[r.kind]} · v{r.version}</p></div>
                  <span className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline ${r.status === "valide" ? "bg-green-50 text-green-700" : blockedDoc ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>{r.status === "valide" ? "Validé" : blockedDoc ? "Incomplet" : "À relire"}</span>
                  <a href={`/api/documents/${r.id}?apercu=1`} aria-label="Relire le document" title="Relire" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-zinc-400 hover:border-zinc-600"><Icon name="eye" /></a>
                  {r.status === "valide" ? <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600" title="Validé"><Icon name="check" /></span>
                    : blockedDoc ? <Link href="/documents" aria-label="Compléter le document" title="Compléter" className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><Icon name="alert" /></Link>
                    : <form action={validateDoc}><input type="hidden" name="id" value={r.id} /><button aria-label="Valider après relecture" title="J'ai relu, je valide" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-[#25b157] to-[#1a8b43] text-white shadow-green"><Icon name="check" /></button></form>}
                </li>); })}</ul>
            </section>)}
        </div>

        {/* Cours */}
        <aside>
          <section className="relative overflow-hidden rounded-2xl bg-night p-6 text-white shadow-lift lg:sticky lg:top-8">
            <Banner className="absolute inset-x-0 bottom-0 h-40 w-full opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-b from-night via-night/95 to-night/40" />
            <div className="relative">
              <div className="flex items-center gap-3"><Chip name="book" tone="or" size="sm" /><p className="text-lg font-bold">Mon cours <span className="text-gold">Gesto</span></p></div>
              <p className="mt-4 text-sm text-white/60">Chapitre 1 · gratuit</p>
              <p className="text-xl font-bold leading-snug">Embaucher sans oublier la paperasse</p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/85">
                {["La DPAE avant l'arrivée", "Le contrat écrit", "Horaires et registre du personnel", "Mutuelle et médecine du travail"].map((x) => <li key={x} className="flex items-center gap-2.5"><Icon name="check" className="h-4 w-4 text-gold" />{x}</li>)}
              </ul>
              <Link href="/cours/chapitre-1" className="btn-gold mt-6 w-full">Lire le chapitre <Icon name="arrowRight" className="h-4 w-4" /></Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
