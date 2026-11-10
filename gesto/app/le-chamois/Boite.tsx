"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CIBLES, EQUIPE_HIVER_2026, nomAffiche, pourvus } from "@/lib/chamois/equipe-hiver";
import { audienceLabel, canSend, fullName, incoming, inbox, PRIORITY_LABEL, readBy, ROLE_LABEL, sent, targets, type Account, type Audience, type Db, type Priority } from "@/lib/chamois/logic";
import { acceptInvite, ensureDb, invite, loadDb, login, markRead, onDemoChange, postDirective, postNote, resetDemo, sessionId, setActive, setManagersMaySend, setNoteStatus, setSession } from "@/lib/chamois/demo";

const field = "mt-1 w-full rounded-xl border border-line bg-white px-3 py-3 text-base outline-none focus:border-accent";

export default function Boite({ supabaseConfigured = false }: { supabaseConfigured?: boolean }) {
  const params = useSearchParams();
  const token = params.get("invitation");
  const [db, setDb] = useState<Db | null>(null);
  const [session, setSess] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("equipe");
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = () => { setDb(loadDb()); setSess(sessionId()); };
  useEffect(() => { ensureDb(); refresh(); return onDemoChange(refresh); }, []);

  if (!db) return null;
  const me = db.accounts.find((a) => a.id === session && a.active) ?? null;
  const invited = token ? db.accounts.find((a) => a.inviteToken === token) : undefined;

  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-[#f4f6f8] text-[#142033]">
      <header className="sticky top-0 z-10 border-b border-line bg-[#0c1728] px-4 py-3 text-white">
        <p className="pr-16 text-[11px] font-bold uppercase tracking-wider text-[#f1bf65]">Mode démo locale · ce navigateur seulement</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold">Le Chamois</p>
            <p className="text-xs text-white/70">{me ? `${ROLE_LABEL[me.role]} · ${fullName(me)}` : "Boîte d'équipe"}</p>
          </div>
          {me && <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => { setSession(null); setSess(null); }}>Sortir</button>}
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 pb-28 pt-4">
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Aucun e-mail n&apos;est envoyé : il n&apos;y a pas de fournisseur. Les mots de passe de cette démo restent dans ce navigateur, en clair. N&apos;y inscris pas de vraies personnes.{supabaseConfigured ? " Des clés Supabase sont présentes, mais cet écran n'est pas encore relié à Auth : rien n'est enregistré dans la base." : ""}</p>
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!me && invited && <Accept db={db} account={invited} token={token!} onError={setError} onDone={refresh} />}
        {!me && !invited && <Login onError={setError} onDone={refresh} />}
        {me?.role === "patron" && <Patron db={db} me={me} tab={tab} setTab={setTab} onError={setError} refresh={refresh} />}
        {me?.role === "manager" && <Staff db={db} me={me} tab={tab} setTab={setTab} openId={openId} setOpenId={setOpenId} onError={setError} refresh={refresh} />}
        {me?.role === "salarie" && <Staff db={db} me={me} tab={tab} setTab={setTab} openId={openId} setOpenId={setOpenId} onError={setError} refresh={refresh} />}
      </main>
    </div>
  );
}

function Login({ onError, onDone }: { onError: (s: string) => void; onDone: () => void }) {
  return (
    <form className="card mt-4 p-4" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const res = login(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""));
      if (!res.ok) { onError(res.error); return; }
      onError(""); onDone();
    }}>
      <h1 className="text-xl font-bold">Entrer</h1>
      <label className="mt-3 block text-sm font-medium">Email<input name="email" type="email" required autoComplete="username" className={field} /></label>
      <label className="mt-3 block text-sm font-medium">Mot de passe<input name="password" type="password" required autoComplete="current-password" className={field} /></label>
      <button className="btn-primary mt-4 w-full py-3">Entrer</button>
      <p className="mt-3 text-sm text-zinc-500">Patron de démonstration, déjà créé : <b>lou@chamois.demo</b> / <b>demo-lou</b>. Aucun salarié n&apos;est préenregistré.</p>
      <button type="button" className="mt-3 text-sm underline" onClick={() => { resetDemo(); onDone(); }}>Effacer la démo de ce navigateur</button>
    </form>
  );
}

function Accept({ account, token, onError, onDone }: { db: Db; account: Account; token: string; onError: (s: string) => void; onDone: () => void }) {
  return (
    <form className="card mt-4 p-4" onSubmit={(e) => {
      e.preventDefault();
      const res = acceptInvite(token, String(new FormData(e.currentTarget).get("password") ?? ""));
      if (!res.ok) { onError(res.error); return; }
      onError(""); onDone();
    }}>
      <h1 className="text-xl font-bold">Invitation</h1>
      <p className="mt-2 text-sm">Vue {ROLE_LABEL[account.role]} · {fullName(account)}</p>
      <p className="text-sm text-zinc-500">{account.email}. Ce lien ne t&apos;a pas été envoyé par e-mail.</p>
      <label className="mt-3 block text-sm font-medium">Choisis un mot de passe<input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} /></label>
      <button className="btn-primary mt-4 w-full py-3">Créer mon accès</button>
    </form>
  );
}

function Tabs({ items, tab, setTab }: { items: [string, string][]; tab: string; setTab: (s: string) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid border-t border-line bg-white" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map(([id, label]) => (
        <button key={id} className={`min-h-14 px-2 text-sm font-semibold ${tab === id ? "text-green-700" : "text-zinc-500"}`} onClick={() => setTab(id)}>{label}</button>
      ))}
    </nav>
  );
}

function Patron({ db, me, tab, setTab, onError, refresh }: { db: Db; me: Account; tab: string; setTab: (s: string) => void; onError: (s: string) => void; refresh: () => void }) {
  const people = db.accounts.filter((a) => a.role !== "patron");
  return (
    <div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Vue Patron</p>
      <Tabs items={[["equipe", "Équipe"], ["consigne", "Consigne"], ["boite", "Boîte"]]} tab={tab === "equipe" || tab === "consigne" || tab === "boite" ? tab : "equipe"} setTab={setTab} />
      {(tab === "equipe" || (tab !== "consigne" && tab !== "boite")) && <section className="mt-4 space-y-4">
        <label className="card flex items-center gap-3 p-4 text-sm"><input type="checkbox" checked={db.restaurant.managersMaySend} onChange={(e) => { setManagersMaySend(me.id, e.target.checked); refresh(); }} />Les managers peuvent envoyer des consignes</label>
        <form className="card p-4" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const res = invite(me.id, { firstName: String(fd.get("first") ?? ""), lastName: String(fd.get("last") ?? ""), email: String(fd.get("email") ?? ""), role: fd.get("role") === "manager" ? "manager" : "salarie" });
          if (!res.ok) { onError(res.error); return; }
          onError(""); e.currentTarget.reset(); refresh();
        }}>
          <h2 className="font-bold">Inviter</h2>
          <label className="mt-2 block text-sm">Prénom<input name="first" required className={field} /></label>
          <label className="mt-2 block text-sm">Nom<input name="last" required className={field} /></label>
          <label className="mt-2 block text-sm">Email<input name="email" type="email" required className={field} /></label>
          <label className="mt-2 block text-sm">Rôle<select name="role" className={field}><option value="salarie">Salarié</option><option value="manager">Manager</option></select></label>
          <button className="btn-primary mt-4 w-full py-3">Créer l&apos;invitation</button>
        </form>
        <ul className="space-y-3">{people.map((a) => {
          const link = a.inviteToken ? `/le-chamois?invitation=${a.inviteToken}` : "";
          return (
            <li key={a.id} className="card p-4">
              <p className="font-bold">{fullName(a)}</p>
              <p className="text-sm text-zinc-500">{ROLE_LABEL[a.role]} · {a.email} · {a.active ? (a.password ? "Accès créé" : "Invitation non ouverte") : "Désactivé"}</p>
              {link && <p className="mt-2 text-sm">Aucun e-mail n&apos;a été envoyé. Lien à transmettre toi-même :<a data-testid="invite-link" className="mt-1 block break-all font-medium text-green-800" href={link}>{link}</a></p>}
              <button className="btn-ghost mt-3 px-3 py-2 text-sm" onClick={() => { setActive(me.id, a.id, !a.active); refresh(); }}>{a.active ? "Désactiver" : "Réactiver"}</button>
            </li>
          );
        })}
          {!people.length && <li className="text-sm text-zinc-500">Aucun compte créé. La liste ci-dessous n&apos;est pas invitée.</li>}</ul>
        <section className="card p-4">
          <h2 className="font-bold">Hiver 2026/27</h2>
          <p className="mt-1 text-sm text-zinc-500">Dix-neuf personnes. Pas d&apos;email, pas de téléphone, pas de compte. On attend Lou avant toute invitation. John Adrait et Maurice (Momo) Adrait ne sont pas dans l&apos;équipe.</p>
          <ul className="mt-3 space-y-1 text-sm">{CIBLES.map((c) => {
            const n = pourvus(c.roles).length;
            return <li key={c.poste}><b>{c.groupe} · {c.poste}</b> {n}/{c.cible}{n < c.cible ? ` · il manque ${c.cible - n}` : ""}</li>;
          })}</ul>
          <p className="mt-2 text-xs text-zinc-500">Le bar et le snack sont en dehors de ces cibles.</p>
          <ul className="mt-3 space-y-2 text-sm">{EQUIPE_HIVER_2026.map((p) => (
            <li key={nomAffiche(p)} className="flex items-baseline justify-between gap-3">
              <span><b>{nomAffiche(p)}</b> · {p.role}{p.note ? ` · ${p.note}` : ""}</span>
              <span className="shrink-0 text-xs font-semibold uppercase text-zinc-500">{p.statut === "embauche" ? "prévu" : p.statut === "en_attente" ? "en attente" : p.statut === "non_confirme" ? "non confirmé" : "pas invité"}</span>
            </li>
          ))}</ul>
        </section>
      </section>}
      {tab === "consigne" && <Composer db={db} me={me} onError={onError} refresh={refresh} />}
      {tab === "boite" && <Inbox db={db} me={me} refresh={refresh} />}
    </div>
  );
}

function Composer({ db, me, onError, refresh }: { db: Db; me: Account; onError: (s: string) => void; refresh: () => void }) {
  const people = db.accounts.filter((a) => a.active && a.id !== me.id);
  if (!canSend(db, me)) return <p className="card mt-4 p-4 text-sm">Le patron n&apos;a pas autorisé les managers à envoyer des consignes. Tu peux répondre et signaler.</p>;
  return (
    <div className="mt-4 space-y-4">
      <form className="card p-4" onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const kind = String(fd.get("audience") ?? "tous");
        const audience: Audience = kind === "role" ? { type: "role", role: fd.get("role") === "manager" ? "manager" : "salarie" } : kind === "personne" ? { type: "personne", accountId: String(fd.get("person") ?? "") } : { type: "tous" };
        const res = postDirective(me.id, { body: String(fd.get("body") ?? ""), priority: (String(fd.get("priority") ?? "normale") as Priority), due: String(fd.get("due") ?? ""), audience });
        if (!res.ok) { onError(res.error); return; }
        onError(""); e.currentTarget.reset(); refresh();
      }}>
        <h2 className="font-bold">Nouvelle consigne</h2>
        <label className="mt-2 block text-sm">Consigne<textarea name="body" required rows={4} className={field} /></label>
        <label className="mt-2 block text-sm">Priorité<select name="priority" className={field} defaultValue="normale"><option value="haute">Haute</option><option value="normale">Normale</option><option value="basse">Basse</option></select></label>
        <label className="mt-2 block text-sm">Échéance facultative<input name="due" type="date" className={field} /></label>
        <label className="mt-2 block text-sm">Destinataires<select name="audience" className={field} defaultValue="tous"><option value="tous">Tout le monde</option><option value="role">Un rôle</option><option value="personne">Une personne</option></select></label>
        <label className="mt-2 block text-sm">Rôle, si tu as choisi « un rôle »<select name="role" className={field}><option value="salarie">Salariés</option><option value="manager">Managers</option></select></label>
        <label className="mt-2 block text-sm">Personne, si tu as choisi « une personne »<select name="person" className={field}>{people.map((a) => <option key={a.id} value={a.id}>{fullName(a)}</option>)}{!people.length && <option value="">Personne pour l&apos;instant</option>}</select></label>
        <button className="btn-primary mt-4 w-full py-3">Envoyer la consigne</button>
      </form>
      <ul className="space-y-3">{sent(db, me).map((d) => {
        const who = targets(db, d);
        const seen = who.filter((a) => readBy(db, d, a.id));
        return (
          <li key={d.id} className="card p-4">
            <p className="text-xs font-bold uppercase text-zinc-500">{PRIORITY_LABEL[d.priority]} · {audienceLabel(db, d)}{d.due ? ` · avant le ${d.due}` : ""}</p>
            <p className="mt-1 whitespace-pre-wrap">{d.body}</p>
            <p className="mt-2 text-sm">Lu par {seen.length}/{who.length || 0}</p>
            <ul className="mt-1 text-sm text-zinc-600">{who.map((a) => <li key={a.id}>{fullName(a)} · {readBy(db, d, a.id) ? "Lu" : "Pas encore lu"}</li>)}</ul>
          </li>
        );
      })}</ul>
    </div>
  );
}

function Inbox({ db, me, refresh }: { db: Db; me: Account; refresh: () => void }) {
  const notes = inbox(db, me);
  return (
    <section className="mt-4 space-y-3" data-testid="inbox">
      <h2 className="font-bold">Boîte</h2>
      <p className="text-sm text-zinc-500">Réponses, choses faites, rapports. Aucun message ne part par e-mail.</p>
      {!notes.length && <p className="card p-4 text-sm text-zinc-500">Rien pour l&apos;instant.</p>}
      {notes.map((n) => {
        const author = db.accounts.find((a) => a.id === n.authorId);
        const label = n.kind === "rapport" ? "Rapport" : n.kind === "fait" ? "Fait" : "Réponse";
        return (
          <article key={n.id} className="card p-4">
            <p className="text-xs font-bold uppercase text-zinc-500">{label} · {n.status}</p>
            <p className="mt-1 text-sm">{author ? fullName(author) : "Quelqu'un"}</p>
            <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
            {me.role !== "salarie" && n.kind === "rapport" && (
              <div className="mt-3 flex gap-2">
                <button className="btn-ghost px-3 py-2 text-sm" onClick={() => { setNoteStatus(me.id, n.id, "vu"); refresh(); }}>Vu</button>
                <button className="btn-primary px-3 py-2 text-sm" onClick={() => { setNoteStatus(me.id, n.id, "traite"); refresh(); }}>Traité</button>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

function Staff({ db, me, tab, setTab, openId, setOpenId, onError, refresh }: { db: Db; me: Account; tab: string; setTab: (s: string) => void; openId: string | null; setOpenId: (s: string | null) => void; onError: (s: string) => void; refresh: () => void }) {
  const items = incoming(db, me);
  const tabs: [string, string][] = me.role === "manager" ? [["boite", "Boîte"], ["consignes", "Consignes"], ["signaler", "Signaler"]] : [["consignes", "Consignes"], ["signaler", "Signaler"]];
  const current = tabs.some(([id]) => id === tab) ? tab : tabs[0][0];
  return (
    <div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Vue {ROLE_LABEL[me.role]}</p>
      <Tabs items={tabs} tab={current} setTab={setTab} />
      {current === "boite" && <Inbox db={db} me={me} refresh={refresh} />}
      {current === "consignes" && <div className="mt-4 space-y-3">
        {!items.length && <p className="card p-4 text-sm">Aucune consigne pour toi.</p>}
        {items.map((d) => {
          const open = openId === d.id;
          return (
            <article key={d.id} className="card p-4">
              <button className="w-full text-left" onClick={() => { setOpenId(d.id); markRead(me.id, d.id); refresh(); }}>
                <p className="text-xs font-bold uppercase text-zinc-500">{PRIORITY_LABEL[d.priority]}{d.due ? ` · avant le ${d.due}` : ""} · {readBy(db, d, me.id) ? "Lu" : "Pas lu"}</p>
                <p className="mt-1 font-semibold">{d.body}</p>
              </button>
              {open && <form className="mt-3" onSubmit={(e) => {
                e.preventDefault();
                const res = postNote(me.id, { directiveId: d.id, kind: "reponse", body: String(new FormData(e.currentTarget).get("body") ?? "") });
                if (!res.ok) { onError(res.error); return; }
                onError(""); e.currentTarget.reset(); refresh();
              }}>
                <label className="block text-sm">Ta réponse<textarea name="body" required rows={3} className={field} /></label>
                <button className="btn-primary mt-3 w-full py-3">Envoyer la réponse</button>
                <ul className="mt-3 space-y-1 text-sm">{db.notes.filter((n) => n.directiveId === d.id && n.authorId === me.id).map((n) => <li key={n.id}>{n.body}</li>)}</ul>
                <button type="button" className="btn-ghost mt-2 w-full py-3" onClick={() => { const res = postNote(me.id, { directiveId: d.id, kind: "fait", body: "Fait." }); if (!res.ok) onError(res.error); else { onError(""); refresh(); } }}>Marquer comme fait</button>
              </form>}
            </article>
          );
        })}
        {canSend(db, me) && <Composer db={db} me={me} onError={onError} refresh={refresh} />}
      </div>}
      {current === "signaler" && <form className="card mt-4 p-4" onSubmit={(e) => {
        e.preventDefault();
        const res = postNote(me.id, { directiveId: null, kind: "rapport", body: String(new FormData(e.currentTarget).get("body") ?? "") });
        if (!res.ok) { onError(res.error); return; }
        onError(""); e.currentTarget.reset(); refresh();
      }}>
        <h2 className="font-bold">Rapport ou remarque</h2>
        <p className="mt-1 text-sm text-zinc-500">Un problème, un stock qui baisse, un incident. Le patron et les managers le voient dans leur boîte. Aucun e-mail.</p>
        <label className="mt-3 block text-sm">Message<textarea name="body" required rows={4} className={field} /></label>
        <button className="btn-primary mt-4 w-full py-3">Envoyer le rapport</button>
      </form>}
    </div>
  );
}
