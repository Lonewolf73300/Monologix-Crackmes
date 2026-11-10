import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { missingInfo, type Emp } from "@/lib/documents";
import type { RosterInput } from "@/lib/roster";
import { addRosterPerson, importRoster, saveConsigne } from "../actions";
import { Form, Field } from "../ui";
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
  const team = (await db.prepare("SELECT id,enc,invite_code,user_id,employee_id FROM roster WHERE company_id=? ORDER BY id DESC").all(u.company_id)) as { id: number; enc: string; invite_code: string; user_id: number | null; employee_id: number | null }[];
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
                <Pill tone={r.user_id ? "bleu" : "gris"}>{r.user_id ? "Compte équipe activé" : "Sans compte équipe"}</Pill>
              </div>
            </div>
            <Icon name="chevronRight" className="h-6 w-6 shrink-0 text-zinc-400" />
          </Link></li>);
      })}
        {!rows.length && <li className="card p-8 text-center"><p className="text-lg font-bold">Aucune fiche pour l&apos;instant</p><p className="mt-1 text-zinc-500">Aucune personne n&apos;est pré-enregistrée. Tu ajoutes ton équipe, puis tu complètes la fiche avant de préparer un contrat.</p><Link href="/salaries/nouveau" className="btn-primary mt-5">Créer la première fiche</Link></li>}
      </ul>

      <section className="card mt-8 p-5 lg:p-6">
        <h2 className="text-xl font-bold">Équipe à inviter</h2>
        <p className="mt-1 text-zinc-500">Ajoute les vraies personnes du restaurant, une par une ou avec un CSV (prénom, nom, rôle, email ou téléphone). Personne n&apos;est inventé ici. Aucun e-mail n&apos;est envoyé : tu transmets le code toi-même. Ils ouvrent <Link className="font-medium text-accent underline" href="/rejoindre">/rejoindre</Link> sur leur téléphone.</p>
        <p className="mt-3 text-sm text-zinc-500">Code du restaurant, si la fiche existe déjà : <span className="font-mono text-lg font-bold text-accent">{co.invite_code}</span></p>
        {!team.length && <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-zinc-500">L&apos;équipe est vide. Ajoute les gens quand tu as la liste.</p>}
        <ul className="mt-4 space-y-3">{team.map((r) => {
          const person = decrypt<RosterInput>(r.enc);
          const href = `/salaries/nouveau?prenom=${encodeURIComponent(person.firstName)}&nom=${encodeURIComponent(person.lastName)}&poste=${encodeURIComponent(person.role)}&roster=${r.id}`;
          return (
            <li key={r.id} className="rounded-xl border border-line p-4">
              <p className="text-lg font-bold">{person.firstName} {person.lastName}</p>
              <p className="text-sm text-zinc-500">{person.role} · {person.contact}</p>
              <p className="mt-2 text-sm">Code personnel : <code data-invite={r.invite_code} className="font-mono text-base font-bold text-accent">{r.invite_code}</code></p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone={r.user_id ? "bleu" : "gris"}>{r.user_id ? "Compte activé" : "Invitation non utilisée"}</Pill>
                {r.employee_id ? <Pill tone="vert">Fiche ouverte</Pill> : <Link href={href} className="btn-primary px-3 py-2 text-sm">Compléter la fiche</Link>}
              </div>
            </li>);
        })}</ul>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="font-bold">Ajouter une personne</h3>
            <div className="mt-3"><Form action={addRosterPerson} submit="Ajouter à l'équipe">
              <Field label="Prénom" name="first_name" required autoComplete="off" />
              <Field label="Nom" name="last_name" required autoComplete="off" />
              <Field label="Rôle" name="role" required placeholder="Ex. serveur, cuisine, plonge" />
              <Field label="Email ou téléphone" name="contact" required autoComplete="off" placeholder="Pour le retrouver, pas pour un envoi automatique" />
            </Form></div>
          </div>
          <div>
            <h3 className="font-bold">Importer un CSV</h3>
            <p className="mt-1 text-sm text-zinc-500">En-têtes : prenom, nom, role, et email ou telephone. Virgule ou point-virgule. 200 lignes maximum.</p>
            <Form action={importRoster} submit="Importer le CSV">
              <label className="block text-sm font-medium text-zinc-300">Coller le fichier<textarea name="csv" required rows={6} placeholder={"prenom;nom;role;telephone"} className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 font-mono text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>
            </Form>
          </div>
        </div>
      </section>

      <section className="card mt-8 p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Consigne du jour</h2>
          <Link href="/consignes" className="font-semibold text-accent">Consignes et retours de l&apos;équipe</Link>
        </div>
        <form action={saveConsigne} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-zinc-300">Visible sur le téléphone de l&apos;équipe<textarea name="consigne" defaultValue={co.consigne} rows={2} placeholder="Ex. ouverture 11h30, terrasse fermée" className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>
          <label className="block text-sm font-medium text-zinc-300">Questions fréquentes <span className="font-normal text-zinc-500">(une par ligne : question | réponse)</span><textarea name="faq" defaultValue={faq} rows={4} placeholder="Où sont les tabliers ? | Vestiaire, casier 3" className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>
          <button className="btn-primary">Enregistrer la consigne du jour</button>
        </form>
      </section>
    </main>
  );
}
