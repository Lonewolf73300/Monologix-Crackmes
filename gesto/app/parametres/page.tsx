import { requirePatron } from "@/lib/auth";
import { db } from "@/lib/db";
import { mediaUrls, MAX_BYTES } from "@/lib/media";
import { deleteAccount, saveFirstName, updateCompany } from "../actions";
import { Form, Field, inputCls } from "../ui";
import { TYPES, NB, SEASONS, PAINS, OBJECTIVES } from "@/lib/rules";
import { PageHeader } from "../kit";
import { Icon } from "../icons";
import { Avatar } from "../brand";
import { Banner } from "../banner";

export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string; retire?: string; erreur?: string }> }) {
  const u = await requirePatron();
  const q = await searchParams;
  const co = (await db.prepare("SELECT name,dept,type,nb_sal,season,pains,objective FROM companies WHERE id=?").get(u.company_id)) as { name: string; dept: string; type: string; nb_sal: string; season: string; pains: string; objective: string };
  const pains: string[] = JSON.parse(co.pains || "[]");
  const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);
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
    <main className="mx-auto max-w-4xl px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
      <PageHeader icon="settings" tone="gris" title="Paramètres" sub={co.name} />
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
      <section className="card mt-6 p-5 lg:p-6">
        <p className="text-lg font-bold">Mon commerce</p><p className="text-sm text-zinc-500">Les réponses du diagnostic : elles règlent ton tableau de bord et tes documents. Modifiables à tout moment.</p>
        <div className="mt-5"><Form action={updateCompany} submit="Enregistrer mon commerce">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom du commerce" name="name" defaultValue={co.name} required maxLength={80} />
            <Field label="Département" name="dept" defaultValue={co.dept} maxLength={3} inputMode="numeric" />
            <label className="block text-sm font-medium text-zinc-300">Type de commerce<select name="type" defaultValue={co.type} className={inputCls}>{TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select></label>
            <label className="block text-sm font-medium text-zinc-300">Nombre de salariés<select name="nb_sal" defaultValue={co.nb_sal} className={inputCls}>{NB.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
            <label className="block text-sm font-medium text-zinc-300">Activité<select name="season" defaultValue={co.season} className={inputCls}>{SEASONS.map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select></label>
            <label className="block text-sm font-medium text-zinc-300">Objectif prioritaire<select name="objective" defaultValue={co.objective} className={inputCls}>{OBJECTIVES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          </div>
          <fieldset><legend className="text-sm font-medium text-zinc-300">Douleurs concrètes</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">{PAINS.map((p) => <label key={p} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-green-50"><input type="checkbox" name="pains" value={p} defaultChecked={pains.includes(p)} className="h-4 w-4 accent-[#1f9d4c]" />{p}</label>)}</div>
          </fieldset>
        </Form></div>
      </section>

      <section className="card mt-6 p-5 lg:p-6">
        <p className="text-lg font-bold">Mes données</p><p className="text-sm text-zinc-500">Tes données t&apos;appartiennent : export complet et suppression sur demande. Aucune revente.</p>
        <a href="/api/export" className="btn-ghost mt-4"><Icon name="file" className="h-5 w-5" />Exporter toutes mes données (JSON)</a>
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/60 p-4">
          <p className="font-bold text-red-700">Supprimer mon compte</p>
          <p className="text-sm text-red-700/80">Efface définitivement le commerce, les salariés, les documents, les échéances, les photos et les comptes salariés. Irréversible : exporte d&apos;abord ce que tu dois archiver.</p>
          <div className="mt-3"><Form action={deleteAccount} submit="Supprimer définitivement" danger><Field label="Écris SUPPRIMER pour confirmer" name="confirm" autoComplete="off" required /></Form></div>
        </div>
      </section>
      <p className="mt-4 text-xs text-zinc-500">Les photos sont stockées pour ton commerce uniquement et ne sont visibles que par toi et tes salariés.</p>
    </main>
  );
}
