import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { extras } from "@/lib/flags";
import { missingInfo, type Emp } from "@/lib/documents";
import { saveConsigne } from "../actions";
import { Avatar } from "../brand";
import { Icon } from "../icons";
import { PageHeader, Pill } from "../kit";

const fr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
export default async function Page({ searchParams }: { searchParams: Promise<{ supprime?: string }> }) {
  const u = await requirePatron();
  const q = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const rows = (await db.prepare("SELECT id,enc,user_id FROM employees WHERE company_id=? ORDER BY id DESC").all(u.company_id)) as { id: number; enc: string; user_id: number | null }[];
  const docs = (await db.prepare("SELECT employee_id,status FROM documents WHERE company_id=?").all(u.company_id)) as { employee_id: number; status: string }[];
  const co = (await db.prepare("SELECT invite_code,consigne,faq FROM companies WHERE id=?").get(u.company_id)) as { invite_code: string; consigne: string; faq: string };
  const faq = (JSON.parse(co.faq) as { q: string; a: string }[]).map((x) => `${x.q} | ${x.a}`).join("\n");
  return (
    <main className="mx-auto max-w-4xl px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
      <PageHeader icon="users" title="Mon équipe" sub={`${rows.length} salarié${rows.length > 1 ? "s" : ""}`} action={<Link href="/salaries/nouveau" className="btn-primary"><Icon name="userPlus" className="h-5 w-5" />Nouveau salarié</Link>} />
      {q.supprime && <p className="mt-5 rounded-xl border border-line bg-white p-3 text-sm">Fiche supprimée : les documents, échéances et pointages de ce salarié ont été effacés.</p>}
      <ul className="mt-6 space-y-3">{rows.map((r) => {
        const e = decrypt<Emp>(r.enc);
        const mine = docs.filter((d) => d.employee_id === r.id); const ok = mine.filter((d) => d.status === "valide").length;
        const blocked = missingInfo(e).length > 0;
        return (
          <li key={r.id}><Link href={`/salaries/${r.id}`} className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
            <Avatar name={e.name} size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold">{e.name}</p>
              <p className="truncate text-zinc-500">{e.post} · {e.contractType}{e.contractType === "CDD" && e.end ? ` jusqu'au ${fr(e.end)}` : ""} · {e.hours} h</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill tone={ok === mine.length && mine.length ? "vert" : "orange"}>{ok}/{mine.length} documents validés</Pill>
                {blocked && <Pill tone="rouge">Contrat incomplet</Pill>}
                <Pill tone="gris">{e.start > today ? `Arrive le ${fr(e.start)}` : `Depuis le ${fr(e.start)}`}</Pill>
                {extras && <Pill tone={r.user_id ? "bleu" : "gris"}>{r.user_id ? "Espace employé activé" : "Invitation en attente"}</Pill>}
              </div>
            </div>
            <Icon name="chevronRight" className="h-6 w-6 shrink-0 text-zinc-400" />
          </Link></li>);
      })}
        {!rows.length && <li className="card p-8 text-center"><p className="text-lg font-bold">Aucun salarié pour l&apos;instant</p><p className="mt-1 text-zinc-500">Six questions, et le contrat, la fiche horaire et la checklist DPAE sont prêts.</p><Link href="/salaries/nouveau" className="btn-primary mt-5">Créer le premier salarié</Link></li>}
      </ul>
      {extras && (
        <section className="card mt-8 p-5 lg:p-6">
          <h2 className="text-xl font-bold">Espace employé</h2>
          <p className="mt-1 text-zinc-500">Donne ce code à tes salariés : ils vont sur <Link className="font-medium text-accent underline" href="/rejoindre">/rejoindre</Link>. Code : <span className="font-mono text-lg font-bold text-accent">{co.invite_code}</span></p>
          <form action={saveConsigne} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-zinc-300">Consigne du jour<textarea name="consigne" defaultValue={co.consigne} rows={2} placeholder="Ex : ouverture 11h30, terrasse fermée" className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>
            <label className="block text-sm font-medium text-zinc-300">Questions fréquentes <span className="font-normal text-zinc-500">(une par ligne : question | réponse)</span><textarea name="faq" defaultValue={faq} rows={4} placeholder="Où sont les tabliers ? | Vestiaire, casier 3" className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>
            <button className="btn-primary">Enregistrer</button>
          </form>
        </section>)}
    </main>
  );
}
