"use server";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, encrypt, decrypt, now, logError } from "@/lib/db";
import { checkPassword, endSession, hashPassword, requirePatron, startSession, currentUser } from "@/lib/auth";
import { missingInfo, KIND_LABEL, type Emp, type Kind } from "@/lib/documents";
import { TYPES, NB, SEASONS, PAINS, OBJECTIVES } from "@/lib/rules";
import { contactError, parseRosterCsv, type RosterInput } from "@/lib/roster";

const validDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const readEmp = (f: FormData): Emp => {
  const e: Emp = { name: s(f, "name").slice(0, 80), post: s(f, "post").slice(0, 80), start: s(f, "start"), hours: s(f, "hours"), salary: s(f, "salary"), contractType: s(f, "contractType") === "CDD" ? "CDD" : "CDI", end: s(f, "end") };
  for (const k of ["convention", "essai", "motif"] as const) { const v = s(f, k).slice(0, 120); if (v) e[k] = v; }
  if (e.contractType === "CDI") { e.end = ""; delete e.motif; }
  return e;
};
const checkEmp = (e: Emp): string | null => {
  if (!e.name || !e.post || !e.start || !e.hours || !e.salary) return "Les six questions sont obligatoires.";
  if (!validDate(e.start) || (e.end && !validDate(e.end))) return "Date invalide.";
  if (e.contractType === "CDD" && !e.end) return "Pour un CDD, indique la date de fin.";
  if (e.end && e.end < e.start) return "La date de fin doit être après la date de début.";
  const h = Number(e.hours), sal = Number(e.salary);
  if (!(h > 0 && h <= 48)) return "Horaires hebdomadaires : entre 1 et 48 heures.";
  if (!(sal >= 0 && sal < 100000)) return "Salaire invalide.";
  return null;
};

export async function signup(_: unknown, f: FormData) {
  const email = s(f, "email").toLowerCase(), pw = s(f, "password");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Email invalide." };
  if (pw.length < 8) return { error: "Mot de passe : 8 caractères minimum." };
  if (!f.get("cgv")) return { error: "Tu dois accepter les conditions d'utilisation." };
  if (await db.prepare("SELECT 1 FROM users WHERE email=?").get(email)) return { error: "Un compte existe déjà avec cet email." };
  const first = s(f, "first_name").slice(0, 40) || null;
  const r = await db.prepare("INSERT INTO users(email,hash,first_name,consent_cgv,consent_stats,created) VALUES(?,?,?,1,?,?)")
    .run(email, hashPassword(pw), first, f.get("stats") ? 1 : 0, now());
  await startSession(Number(r.lastInsertRowid));
  redirect("/diagnostic");
}
export async function login(_: unknown, f: FormData) {
  const u = await db.prepare("SELECT id,hash,role,company_id FROM users WHERE email=?").get(s(f, "email").toLowerCase()) as { id: number; hash: string; role: string; company_id: number | null } | undefined;
  if (!u || !checkPassword(s(f, "password"), u.hash)) return { error: "Email ou mot de passe incorrect." };
  await startSession(u.id);
  redirect(u.role === "patron" ? "/tableau-de-bord" : "/salarie");
}
export async function logout() { await endSession(); redirect("/"); }

export async function saveDiagnostic(data: { name: string; type: string; dept: string; nb_sal: string; season: string; pains: string[]; objective: string }) {
  const u = await currentUser();
  if (!u || u.role !== "patron") redirect("/connexion");
  if (u.company_id) {
    await db.prepare("UPDATE companies SET name=?,type=?,dept=?,nb_sal=?,season=?,pains=?,objective=? WHERE id=?")
      .run(data.name, data.type, data.dept, data.nb_sal, data.season, JSON.stringify(data.pains), data.objective, u.company_id);
  } else {
    const r = await db.prepare("INSERT INTO companies(owner_id,name,type,dept,nb_sal,season,pains,objective,invite_code) VALUES(?,?,?,?,?,?,?,?,?)")
      .run(u.id, data.name, data.type, data.dept, data.nb_sal, data.season, JSON.stringify(data.pains), data.objective, crypto.randomBytes(4).toString("hex").toUpperCase());
    await db.prepare("UPDATE users SET company_id=? WHERE id=?").run(Number(r.lastInsertRowid), u.id);
  }
  redirect("/tableau-de-bord");
}

export async function createEmployee(_: unknown, f: FormData) {
  const u = await requirePatron();
  const e = readEmp(f);
  const err = checkEmp(e);
  if (err) return { error: err };
  // Tout ou rien : le salarié, ses 3 documents, le journal et l'échéance DPAE sont créés ensemble.
  await db.tx(async (t) => {
    const r = await t.prepare("INSERT INTO employees(company_id,enc,created) VALUES(?,?,?)").run(u.company_id, encrypt(e), now());
    const eid = Number(r.lastInsertRowid);
    for (const kind of ["contrat", "fiche_horaire", "checklist_dpae"]) {
      const d = await t.prepare("INSERT INTO documents(company_id,employee_id,kind,created) VALUES(?,?,?,?)").run(u.company_id, eid, kind, now());
      await t.prepare("INSERT INTO journal(company_id,at,actor,action,doc_id,version) VALUES(?,?,?,?,?,1)").run(u.company_id, now(), u.email, `Document généré : ${KIND_LABEL[kind as Kind]} pour ${e.name}`, Number(d.lastInsertRowid));
    }
    await t.prepare("INSERT INTO deadlines(company_id,title,due,remind_days,employee_id) VALUES(?,?,?,5,?)").run(u.company_id, `DPAE de ${e.name} à déclarer`, e.start, eid);
    const rid = Number(s(f, "roster_id"));
    if (rid) await t.prepare("UPDATE roster SET employee_id=? WHERE id=? AND company_id=? AND employee_id IS NULL").run(eid, rid, u.company_id);
  });
  revalidatePath("/", "layout");
  redirect("/documents");
}

export async function validateDoc(f: FormData) {
  const u = await requirePatron();
  const id = Number(f.get("id"));
  const d = await db.prepare("SELECT d.id,d.version,d.kind,e.enc FROM documents d JOIN employees e ON e.id=d.employee_id WHERE d.id=? AND d.company_id=?").get(id, u.company_id) as { id: number; version: number; kind: string; enc: string } | undefined;
  if (!d) return;
  if (d.kind === "contrat" && missingInfo(decrypt<Emp>(d.enc)).length) return; // validation refusée : infos manquantes
  await db.prepare("UPDATE documents SET status='valide', validated_at=? WHERE id=?").run(now(), id);
  await db.prepare("INSERT INTO journal(company_id,at,actor,action,doc_id,version) VALUES(?,?,?,?,?,?)").run(u.company_id, now(), u.email, `Document validé : ${KIND_LABEL[d.kind as Kind]}`, id, d.version);
  revalidatePath("/documents");
  revalidatePath("/tableau-de-bord");
}

export async function addDeadline(_: unknown, f: FormData) {
  const u = await requirePatron();
  const title = s(f, "title"), due = s(f, "due");
  if (!title || !due) return { error: "Titre et date obligatoires." };
  if (!validDate(due)) return { error: "Date invalide." };
  await db.prepare("INSERT INTO deadlines(company_id,title,due,remind_days) VALUES(?,?,?,?)").run(u.company_id, title, due, Math.min(60, Math.max(1, Math.trunc(Number(s(f, "remind")) || 7))));
  revalidatePath("/echeances");
  return { ok: true };
}
export async function toggleDeadline(f: FormData) {
  const u = await requirePatron();
  await db.prepare("UPDATE deadlines SET done=1-done WHERE id=? AND company_id=?").run(Number(f.get("id")), u.company_id);
  revalidatePath("/echeances");
  revalidatePath("/tableau-de-bord");
}

export async function saveConsigne(f: FormData) {
  const u = await requirePatron();
  const faq = s(f, "faq").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [q, ...a] = l.split("|"); return { q: q.trim(), a: a.join("|").trim() }; }).filter((x) => x.a);
  await db.prepare("UPDATE companies SET consigne=?, faq=? WHERE id=?").run(s(f, "consigne"), JSON.stringify(faq), u.company_id);
  revalidatePath("/salaries");
}

async function staffLabel(userId: number, companyId: number, email: string): Promise<string> {
  const roster = (await db.prepare("SELECT enc FROM roster WHERE user_id=? AND company_id=?").get(userId, companyId)) as { enc: string } | undefined;
  if (roster) { const r = decrypt<RosterInput>(roster.enc); return `${r.firstName} ${r.lastName}`; }
  const emp = (await db.prepare("SELECT enc FROM employees WHERE user_id=? AND company_id=?").get(userId, companyId)) as { enc: string } | undefined;
  if (emp) return decrypt<Emp>(emp.enc).name;
  const u = (await db.prepare("SELECT first_name FROM users WHERE id=?").get(userId)) as { first_name: string | null } | undefined;
  return u?.first_name || email;
}

async function insertRoster(companyId: number, rows: RosterInput[]) {
  const existing = (await db.prepare("SELECT enc FROM roster WHERE company_id=?").all(companyId)) as { enc: string }[];
  const keys = new Set(existing.map((e) => { const r = decrypt<RosterInput>(e.enc); return `${r.firstName.toLowerCase()}|${r.lastName.toLowerCase()}`; }));
  let n = 0;
  const errors: string[] = [];
  for (const row of rows) {
    const key = `${row.firstName.toLowerCase()}|${row.lastName.toLowerCase()}`;
    if (keys.has(key)) { errors.push(`${row.firstName} ${row.lastName} est déjà dans l'équipe.`); continue; }
    let code = "";
    for (let i = 0; i < 5; i++) {
      code = crypto.randomBytes(4).toString("hex").toUpperCase();
      if (!(await db.prepare("SELECT 1 FROM roster WHERE invite_code=?").get(code)) && !(await db.prepare("SELECT 1 FROM companies WHERE invite_code=?").get(code))) break;
    }
    await db.prepare("INSERT INTO roster(company_id,enc,invite_code,created) VALUES(?,?,?,?)").run(companyId, encrypt(row), code, now());
    keys.add(key);
    n++;
  }
  return { n, errors };
}

export async function addRosterPerson(_: unknown, f: FormData) {
  const u = await requirePatron();
  const row: RosterInput = { firstName: s(f, "first_name").slice(0, 40), lastName: s(f, "last_name").slice(0, 40), role: s(f, "role").slice(0, 80), contact: s(f, "contact").slice(0, 80) };
  if (!row.firstName || !row.lastName || !row.role) return { error: "Prénom, nom et rôle sont obligatoires." };
  const bad = contactError(row.contact);
  if (bad) return { error: bad };
  if (row.contact.includes("@")) row.contact = row.contact.toLowerCase();
  const res = await insertRoster(u.company_id, [row]);
  revalidatePath("/salaries");
  if (!res.n) return { error: res.errors[0] || "Personne non ajoutée." };
  return { ok: true };
}

export async function importRoster(_: unknown, f: FormData) {
  const u = await requirePatron();
  const parsed = parseRosterCsv(s(f, "csv"));
  if (!parsed.rows.length) return { error: parsed.errors[0] || "Aucune personne à importer." };
  const res = await insertRoster(u.company_id, parsed.rows);
  revalidatePath("/salaries");
  const detail = [...(res.n ? [`${res.n} personne${res.n > 1 ? "s" : ""} ajoutée${res.n > 1 ? "s" : ""}.`] : []), ...parsed.errors, ...res.errors];
  if (!res.n) return { error: detail.join(" ") };
  if (parsed.errors.length || res.errors.length) return { error: detail.join(" ") };
  return { ok: true };
}

export async function addDirective(_: unknown, f: FormData) {
  const u = await requirePatron();
  const body = s(f, "body").slice(0, 2000);
  if (body.length < 2) return { error: "Écris la consigne." };
  await db.prepare("INSERT INTO directives(company_id,body,created) VALUES(?,?,?)").run(u.company_id, body, now());
  revalidatePath("/consignes");
  revalidatePath("/salarie");
  return { ok: true };
}

export async function staffWrite(_: unknown, f: FormData) {
  const u = await currentUser();
  if (!u || u.role !== "salarie" || !u.company_id) redirect("/connexion");
  const body = s(f, "body").slice(0, 2000);
  const kind = s(f, "kind") === "rapport" ? "rapport" : "reponse";
  if (body.length < 2) return { error: "Écris au moins quelques mots." };
  const directiveId = Number(s(f, "directive_id")) || null;
  if (kind === "reponse") {
    if (!directiveId) return { error: "Choisis la consigne à laquelle tu réponds." };
    const d = await db.prepare("SELECT id FROM directives WHERE id=? AND company_id=?").get(directiveId, u.company_id);
    if (!d) return { error: "Cette consigne n'est pas dans ton restaurant." };
  }
  const author = await staffLabel(u.id, u.company_id, u.email);
  await db.prepare("INSERT INTO staff_messages(company_id,user_id,directive_id,kind,body,author,created) VALUES(?,?,?,?,?,?,?)").run(u.company_id, u.id, kind === "rapport" ? null : directiveId, kind, body, author, now());
  revalidatePath("/salarie");
  revalidatePath("/consignes");
  return { ok: true };
}

export async function joinCompany(_: unknown, f: FormData) {
  const code = s(f, "code").toUpperCase(), email = s(f, "email").toLowerCase(), pw = s(f, "password");
  if (!/^\S+@\S+\.\S+$/.test(email) || pw.length < 8) return { error: "Email valide et mot de passe de 8 caractères minimum." };
  if (await db.prepare("SELECT 1 FROM users WHERE email=?").get(email)) return { error: "Email déjà utilisé." };
  const personal = (await db.prepare("SELECT id,company_id,employee_id,user_id FROM roster WHERE invite_code=?").get(code)) as { id: number; company_id: number; employee_id: number | null; user_id: number | null } | undefined;
  if (personal) {
    if (personal.user_id) return { error: "Cette invitation a déjà été utilisée. Demande un nouveau code à ton patron." };
    const r = await db.prepare("INSERT INTO users(email,hash,role,company_id,consent_cgv,created) VALUES(?,?,'salarie',?,1,?)").run(email, hashPassword(pw), personal.company_id, now());
    const uid = Number(r.lastInsertRowid);
    await db.prepare("UPDATE roster SET user_id=? WHERE id=?").run(uid, personal.id);
    if (personal.employee_id) await db.prepare("UPDATE employees SET user_id=? WHERE id=? AND company_id=? AND user_id IS NULL").run(uid, personal.employee_id, personal.company_id);
    await startSession(uid);
    redirect("/salarie");
  }
  const co = await db.prepare("SELECT id FROM companies WHERE invite_code=?").get(code) as { id: number } | undefined;
  if (!co) return { error: "Code d'invitation inconnu." };
  const name = s(f, "name");
  if (!name) return { error: "Indique ton nom, comme sur la fiche préparée par ton patron." };
  const emp = await db.prepare("SELECT id,enc FROM employees WHERE company_id=? AND user_id IS NULL").all(co.id) as { id: number; enc: string }[];
  const match = emp.find((x) => decrypt<Emp>(x.enc).name.toLowerCase() === name.toLowerCase());
  if (!match) return { error: "Nom non trouvé : demande à ton patron d'ajouter ta fiche." };
  const r = await db.prepare("INSERT INTO users(email,hash,role,company_id,consent_cgv,created) VALUES(?,?,'salarie',?,1,?)").run(email, hashPassword(pw), co.id, now());
  await db.prepare("UPDATE employees SET user_id=? WHERE id=?").run(Number(r.lastInsertRowid), match.id);
  await startSession(Number(r.lastInsertRowid));
  redirect("/salarie");
}

export async function punch(f: FormData) {
  const u = await currentUser();
  if (!u || u.role !== "salarie" || !u.company_id) redirect("/connexion");
  const kind = s(f, "kind");
  if (!["arrive", "pause", "reprise", "part"].includes(kind)) return;
  try {
    const emp = await db.prepare("SELECT id FROM employees WHERE user_id=?").get(u.id) as { id: number };
    // Pointage sans position : simple bouton (la géolocalisation n'est pas activée).
    await db.prepare("INSERT INTO punches(company_id,employee_id,at,kind) VALUES(?,?,?,?)").run(u.company_id, emp.id, now(), kind);
  } catch (e) { logError("punch", e); }
  revalidatePath("/salarie");
}

export async function completeContract(f: FormData) {
  const u = await requirePatron();
  const eid = Number(f.get("employee_id"));
  const row = await db.prepare("SELECT enc FROM employees WHERE id=? AND company_id=?").get(eid, u.company_id) as { enc: string } | undefined;
  if (!row) return;
  const e = decrypt<Emp>(row.enc);
  for (const k of ["convention", "essai", "motif"] as const) { const v = s(f, k); if (v) e[k] = v; }
  await db.prepare("UPDATE employees SET enc=? WHERE id=?").run(encrypt(e), eid);
  // Le contrat change : nouvelle version, à relire et revalider.
  const c = await db.prepare("SELECT id,version FROM documents WHERE employee_id=? AND kind='contrat'").get(eid) as { id: number; version: number };
  await db.prepare("UPDATE documents SET version=version+1, status='a_relire', validated_at=NULL WHERE id=?").run(c.id);
  await db.prepare("INSERT INTO journal(company_id,at,actor,action,doc_id,version) VALUES(?,?,?,?,?,?)").run(u.company_id, now(), u.email, "Contrat complété, à revalider", c.id, c.version + 1);
  revalidatePath("/documents");
  revalidatePath("/tableau-de-bord");
}

export async function saveFirstName(_: unknown, f: FormData) {
  const u = await currentUser();
  if (!u) redirect("/connexion");
  await db.prepare("UPDATE users SET first_name=? WHERE id=?").run(s(f, "first_name").slice(0, 40) || null, u.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---- Paramètres : réponses du diagnostic modifiables à tout moment (cahier des charges).
export async function updateCompany(_: unknown, f: FormData) {
  const u = await requirePatron();
  const name = s(f, "name").slice(0, 80), dept = s(f, "dept").slice(0, 3);
  const type = s(f, "type"), nb = s(f, "nb_sal"), season = s(f, "season"), objective = s(f, "objective");
  const pains = f.getAll("pains").map(String).filter((p) => PAINS.includes(p));
  if (!name) return { error: "Le nom du commerce est obligatoire." };
  if (!(TYPES as readonly string[]).includes(type) || !(NB as readonly string[]).includes(nb) || !(SEASONS as readonly string[]).includes(season) || !OBJECTIVES.includes(objective)) return { error: "Réponse invalide." };
  await db.prepare("UPDATE companies SET name=?,dept=?,type=?,nb_sal=?,season=?,pains=?,objective=? WHERE id=?").run(name, dept, type, nb, season, JSON.stringify(pains), objective, u.company_id);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---- Échéances
export async function deleteDeadline(f: FormData) {
  const u = await requirePatron();
  await db.prepare("DELETE FROM deadlines WHERE id=? AND company_id=?").run(Number(f.get("id")), u.company_id);
  revalidatePath("/echeances"); revalidatePath("/tableau-de-bord");
}

// ---- Fiche salarié : modification (les documents concernés repassent « à relire » en nouvelle version)
const DEPENDS: Record<Kind, (keyof Emp)[]> = {
  contrat: ["name", "post", "start", "end", "hours", "salary", "contractType", "convention", "essai", "motif"],
  fiche_horaire: ["name", "post", "hours"],
  checklist_dpae: ["name", "start"],
};
export async function updateEmployee(_: unknown, f: FormData) {
  const u = await requirePatron();
  const eid = Number(f.get("employee_id"));
  const row = (await db.prepare("SELECT enc FROM employees WHERE id=? AND company_id=?").get(eid, u.company_id)) as { enc: string } | undefined;
  if (!row) return { error: "Salarié introuvable." };
  const before = decrypt<Emp>(row.enc);
  const e = readEmp(f);
  const err = checkEmp(e);
  if (err) return { error: err };
  const changed = (Object.keys(DEPENDS) as Kind[]).filter((k) => DEPENDS[k].some((field) => (before[field] ?? "") !== (e[field] ?? "")));
  if (!changed.length) return { ok: true };
  await db.tx(async (t) => {
    await t.prepare("UPDATE employees SET enc=? WHERE id=?").run(encrypt(e), eid);
    for (const kind of changed) {
      const d = (await t.prepare("SELECT id,version FROM documents WHERE employee_id=? AND kind=?").get(eid, kind)) as { id: number; version: number } | undefined;
      if (!d) continue;
      await t.prepare("UPDATE documents SET version=version+1, status='a_relire', validated_at=NULL WHERE id=?").run(d.id);
      await t.prepare("INSERT INTO journal(company_id,at,actor,action,doc_id,version) VALUES(?,?,?,?,?,?)").run(u.company_id, now(), u.email, `Fiche modifiée : ${KIND_LABEL[kind]} à revalider`, d.id, d.version + 1);
    }
    if (before.start !== e.start) await t.prepare("UPDATE deadlines SET due=? WHERE employee_id=? AND company_id=? AND done=0 AND title LIKE 'DPAE%'").run(e.start, eid, u.company_id);
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---- Suppression d'une fiche salarié (RGPD : effacement réel, journal nettoyé du nom)
export async function deleteEmployee(f: FormData) {
  const u = await requirePatron();
  const eid = Number(f.get("employee_id"));
  if (!f.get("confirm")) return;
  const emp = (await db.prepare("SELECT user_id FROM employees WHERE id=? AND company_id=?").get(eid, u.company_id)) as { user_id: number | null } | undefined;
  if (!emp) return;
  await db.tx(async (t) => {
    await t.prepare("DELETE FROM journal WHERE company_id=? AND doc_id IN (SELECT id FROM documents WHERE employee_id=?)").run(u.company_id, eid);
    await t.prepare("DELETE FROM documents WHERE employee_id=? AND company_id=?").run(eid, u.company_id);
    await t.prepare("DELETE FROM deadlines WHERE employee_id=? AND company_id=?").run(eid, u.company_id);
    await t.prepare("DELETE FROM punches WHERE employee_id=? AND company_id=?").run(eid, u.company_id);
    await t.prepare("UPDATE roster SET employee_id=NULL, user_id=NULL WHERE company_id=? AND (employee_id=? OR user_id=?)").run(u.company_id, eid, emp.user_id);
    await t.prepare("DELETE FROM employees WHERE id=? AND company_id=?").run(eid, u.company_id);
    if (emp.user_id) await t.prepare("DELETE FROM users WHERE id=? AND role='salarie'").run(emp.user_id);
    await t.prepare("INSERT INTO journal(company_id,at,actor,action,doc_id,version) VALUES(?,?,?,?,NULL,NULL)").run(u.company_id, now(), u.email, "Fiche salarié supprimée à la demande (données effacées)");
  });
  revalidatePath("/", "layout");
  redirect("/salaries?supprime=1");
}

// ---- Suppression du compte et de toutes les données du commerce (RGPD)
export async function deleteAccount(_: unknown, f: FormData) {
  const u = await requirePatron();
  if (s(f, "confirm") !== "SUPPRIMER") return { error: "Écris SUPPRIMER en majuscules pour confirmer." };
  const c = u.company_id;
  await db.tx(async (t) => {
    for (const table of ["staff_messages", "directives", "roster", "punches", "push_subs", "notifications", "deadlines", "journal", "documents", "employees", "company_media"])
      await t.prepare(`DELETE FROM ${table} WHERE company_id=?`).run(c);
    await t.prepare("DELETE FROM purchases WHERE user_id IN (SELECT id FROM users WHERE company_id=?)").run(c);
    await t.prepare("DELETE FROM users WHERE company_id=? OR id=?").run(c, u.id);
    await t.prepare("DELETE FROM companies WHERE id=?").run(c);
  });
  await endSession();
  redirect("/?compte=supprime");
}
