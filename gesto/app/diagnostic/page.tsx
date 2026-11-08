import { requirePatronNoCompany } from "./guard";
import Wizard from "./Wizard";
import { Logo } from "../brand";
export default async function Page() {
  await requirePatronNoCompany();
  return (
    <main className="mx-auto max-w-lg px-5 pb-10 pt-6">
      <div className="mb-8"><Logo /></div>
      <div className="card p-5 sm:p-7"><Wizard /></div>
      <p className="mt-4 text-center text-xs text-zinc-500">Tes réponses règlent ton tableau de bord. Tu pourras les modifier à tout moment dans Paramètres.</p>
    </main>
  );
}
