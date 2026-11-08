import Link from "next/link";
import { Form, Field } from "../ui";
import { login } from "../actions";
export default function Page() {
  return (
    <main className="mx-auto max-w-md px-5 pb-10">
      <h1 className="text-3xl font-semibold tracking-tight">Connexion</h1>
      <div className="mt-6"><Form action={login} submit="Me connecter">
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Mot de passe" name="password" type="password" required autoComplete="current-password" />
      </Form></div>
      <p className="mt-6 text-sm text-zinc-400">Pas de compte ? <Link href="/inscription" className="underline">Créer mon compte</Link></p>
    </main>
  );
}
