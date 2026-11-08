import Link from "next/link";
import { extras } from "@/lib/flags";
import { Form, Field } from "../ui";
import { signup } from "../actions";
export default function Page() {
  return (
    <main className="mx-auto max-w-md px-5 pb-10 pt-4">
      <div className="card p-6 sm:p-8">
      <h1 className="text-[28px] font-bold tracking-tight">Créer mon compte</h1>
      <div className="mt-6"><Form action={signup} submit="Créer mon compte">
        <Field label="Ton prénom (facultatif)" name="first_name" autoComplete="given-name" maxLength={40} />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Mot de passe (8 caractères min.)" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <label className="flex items-start gap-3 text-sm text-zinc-300"><input type="checkbox" name="cgv" className="mt-0.5 h-4 w-4 shrink-0 accent-[#1f9d4c]" /><span>J&apos;accepte les <Link href="/mentions-legales" className="underline">conditions d&apos;utilisation</Link> (textes définitifs en cours de relecture juridique).</span></label>
        <label className="flex items-start gap-3 text-sm text-zinc-400"><input type="checkbox" name="stats" className="mt-0.5 h-4 w-4 shrink-0 accent-[#1f9d4c]" /><span>J&apos;accepte que mes réponses servent à des statistiques anonymisées (facultatif). Aucune donnée personnelle n&apos;est transmise à des sponsors.</span></label>
      </Form></div>
      <p className="mt-6 text-sm text-zinc-400">Déjà un compte ? <Link href="/connexion" className="underline">Me connecter</Link>{extras && <> · Salarié ? <Link href="/rejoindre" className="underline">Rejoindre mon employeur</Link></>}</p>
      </div>
    </main>
  );
}
export const dynamic = "force-dynamic";
