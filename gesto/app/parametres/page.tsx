import { requirePatron } from "@/lib/auth";
import { db } from "@/lib/db";
import { mediaUrls, MAX_BYTES } from "@/lib/media";
import { saveFirstName } from "../actions";
import { Form, Field } from "../ui";
import { Avatar } from "../brand";
import { Banner } from "../banner";

export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string; retire?: string; erreur?: string }> }) {
  const u = await requirePatron();
  const q = await searchParams;
  const co = (await db.prepare("SELECT name FROM companies WHERE id=?").get(u.company_id)) as { name: string };
  const media = await mediaUrls(u.company_id);
  const Upload = ({ kind, label, hint }: { kind: "banniere" | "profil"; label: string; hint: string }) => (
    <div className="card overflow-hidden">
      <div className="relative h-36 bg-night">
        {kind === "banniere" ? <Banner src={media.banniere} className="absolute inset-0 h-full w-full" /> : <div className="flex h-full items-center justify-center"><Avatar name={co.name} src={media.profil} size={96} dark /></div>}
      </div>
      <div className="p-5">
        <p className="text-lg font-bold">{label}</p><p className="text-sm text-zinc-500">{hint}</p>
        <form action={`/api/media/${kind}`} method="post" encType="multipart/form-data" className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:font-semibold" />
          <button className="btn-primary">Envoyer</button>
        </form>
        {media[kind] && <form action={`/api/media/${kind}`} method="post" encType="multipart/form-data" className="mt-2"><input type="hidden" name="remove" value="1" /><button className="text-sm text-red-600 underline">Retirer la photo</button></form>}
      </div>
    </div>);
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10 pt-8 lg:pt-12">
      <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
      {q.ok && <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-green-700">Photo enregistrée.</p>}
      {q.retire && <p className="mt-4 rounded-xl border border-line bg-white p-3">Photo retirée.</p>}
      {q.erreur && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">Envoi impossible : choisis une photo JPEG, PNG ou WebP de {MAX_BYTES / 1024 / 1024} Mo maximum.</p>}
      <section className="card mt-6 p-5">
        <p className="text-lg font-bold">Ton prénom</p><p className="text-sm text-zinc-500">Affiché dans « Bonjour … ».</p>
        <div className="mt-4"><Form action={saveFirstName} submit="Enregistrer le prénom"><Field label="Prénom" name="first_name" defaultValue={u.first_name ?? ""} maxLength={40} /></Form></div>
      </section>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Upload kind="banniere" label="Photo de l'établissement" hint="Bannière d'accueil, vue par toi et tes salariés." />
        <Upload kind="profil" label="Photo de profil" hint="Ta photo ou le logo du commerce." />
      </div>
      <p className="mt-4 text-xs text-zinc-500">Les photos sont stockées pour ton commerce uniquement et ne sont visibles que par toi et tes salariés.</p>
    </main>
  );
}
