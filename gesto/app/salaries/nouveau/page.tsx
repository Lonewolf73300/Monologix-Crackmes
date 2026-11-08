import { requirePatron } from "@/lib/auth";
import { Form, Field, inputCls } from "../../ui";
import { createEmployee } from "../../actions";
export default async function Page() {
  await requirePatron();
  return (
    <main className="mx-auto max-w-md px-5 pb-10">
      <h1 className="text-3xl font-semibold tracking-tight">Nouveau salarié</h1>
      <p className="mt-2 text-sm text-zinc-400">Six questions : Gesto prépare le contrat, la fiche horaire et la checklist DPAE.</p>
      <div className="mt-6"><Form action={createEmployee} submit="Générer les documents">
        <Field label="1. Nom et prénom" name="name" required />
        <Field label="2. Poste" name="post" required placeholder="Ex : serveur" />
        <Field label="3. Date de début" name="start" type="date" required />
        <Field label="4. Horaires hebdomadaires" name="hours" type="number" step="0.5" min="1" max="48" required placeholder="35" />
        <Field label="5. Salaire brut mensuel (€)" name="salary" type="number" min="0" required />
        <label className="block text-sm text-zinc-300">6. Type de contrat<select name="contractType" className={inputCls}><option>CDI</option><option>CDD</option></select></label>
        <Field label="Date de fin (CDD uniquement)" name="end" type="date" />
      </Form></div>
    </main>
  );
}
