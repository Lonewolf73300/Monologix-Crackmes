import { notFound } from "next/navigation";
import { extras } from "@/lib/flags";
import { Form, Field } from "../ui";
import { joinCompany } from "../actions";
export default function Page() {
  if (!extras) notFound();
  return (
    <main className="mx-auto max-w-md px-5 pb-10">
      <h1 className="text-3xl font-bold">Rejoindre mon employeur</h1>
      <p className="mt-2 text-sm text-zinc-400">Entre le code d&apos;invitation donné par ton patron.</p>
      <div className="mt-6"><Form action={joinCompany} submit="Rejoindre">
        <Field label="Code d'invitation" name="code" required />
        <Field label="Ton nom (comme sur ta fiche)" name="name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Mot de passe (8 caractères min.)" name="password" type="password" required minLength={8} />
      </Form></div>
    </main>
  );
}
export const dynamic = "force-dynamic";
