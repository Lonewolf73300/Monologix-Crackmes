import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { Form, Field } from "../../ui";
import { createEmployee } from "../../actions";
import ContractFields from "../../ContractFields";
import { Icon } from "../../icons";
import { PageHeader } from "../../kit";

export default async function Page() {
  await requirePatron();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
      <Link href="/salaries" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-[#0f172a]"><Icon name="chevronRight" className="h-4 w-4 rotate-180" />Mon équipe</Link>
      <div className="mt-3"><PageHeader icon="userPlus" title="Nouveau salarié" sub="Six questions : Gesto prépare le contrat, la fiche horaire et la checklist DPAE." /></div>
      <ol className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-zinc-500">
        {["Tu réponds", "Gesto prépare", "Tu relis et valides"].map((x, i) => <li key={x} className={`rounded-xl px-2 py-2 ${i === 0 ? "bg-green-100 text-green-700" : "bg-white"}`}>{i + 1}. {x}</li>)}
      </ol>
      <section className="card mt-5 p-5 lg:p-6">
        <Form action={createEmployee} submit="Générer les documents">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="1. Nom et prénom" name="name" required autoComplete="off" placeholder="Ex : Camille Durand" />
            <Field label="2. Poste" name="post" required placeholder="Ex : serveuse" />
            <Field label="3. Date de début" name="start" type="date" required />
            <Field label="4. Horaires hebdomadaires" name="hours" type="number" step="0.5" min="1" max="48" required placeholder="35" />
            <Field label="5. Salaire brut mensuel (€)" name="salary" type="number" min="0" required placeholder="Ex : 2100" />
          </div>
          <ContractFields />
        </Form>
      </section>
      <p className="mt-4 text-xs text-zinc-500">Modèles préparés par Gesto, à relire et valider avant usage ; ce n&apos;est pas un conseil juridique. Gesto ne fait pas la DPAE à ta place.</p>
    </main>
  );
}
