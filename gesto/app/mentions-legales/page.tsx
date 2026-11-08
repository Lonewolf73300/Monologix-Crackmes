export const metadata = { title: "Ce que Gesto fait et ne fait pas" };
export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10">
      <h1 className="text-3xl font-semibold tracking-tight">Ce que Gesto fait et ne fait pas</h1>
      <h2 className="mt-6 text-xl font-semibold">Gesto fait</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-300">
        <li>Préparer des modèles de documents à relire et valider par toi.</li>
        <li>Te rappeler tes échéances.</li>
        <li>Organiser tes informations d&apos;entreprise et de salariés.</li>
      </ul>
      <h2 className="mt-6 text-xl font-semibold">Gesto ne fait pas</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-300">
        <li>Déclarer quoi que ce soit à ta place (DPAE, URSSAF, impôts).</li>
        <li>Certifier un document ou garantir une conformité.</li>
        <li>Remplacer un avocat, un expert-comptable ou un organisme agréé.</li>
      </ul>
      <p className="mt-6 rounded-lg border border-line bg-panel p-4 text-sm text-zinc-400">
        Les mentions légales, CGV, droit de rétractation et politique RGPD définitifs seront publiés ici
        après relecture par un professionnel, avant toute mise en vente. Ils ne sont pas encore rédigés : l'éditeur (identité, SIREN, adresse) sera indiqué ici dès l'immatriculation reçue. Aucun encaissement n'est ouvert.
      </p>
    </main>
  );
}
