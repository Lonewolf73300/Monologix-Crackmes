import { Form, Field } from "../ui";
import { joinCompany } from "../actions";
export default function Page() {
  return (
    <main className="mx-auto max-w-md px-5 pb-10 pt-4">
      <div className="card p-6 sm:p-8">
      <h1 className="text-[28px] font-bold tracking-tight">Rejoindre mon restaurant</h1>
      <p className="mt-2 text-sm text-zinc-500">Entre le code personnel que ton patron t&apos;a donné. S&apos;il t&apos;a seulement donné le code du restaurant, ajoute aussi ton nom tel qu&apos;il est écrit sur ta fiche. Aucun message n&apos;est envoyé automatiquement.</p>
      <div className="mt-6"><Form action={joinCompany} submit="Rejoindre">
        <Field label="Code d'invitation" name="code" required autoComplete="off" />
        <Field label="Ton nom (seulement pour le code du restaurant)" name="name" autoComplete="off" />
        <Field label="Email" name="email" type="email" required autoComplete="username" />
        <Field label="Mot de passe (8 caractères min.)" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </Form></div>
      </div>
    </main>
  );
}
export const dynamic = "force-dynamic";
