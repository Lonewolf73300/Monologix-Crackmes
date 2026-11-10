import { canSend, seed, targets, type Account, type Audience, type Db, type Note, type Priority } from "./logic";

export const DB_KEY = "gesto_chamois_demo_v1";
export const SESSION_KEY = "gesto_chamois_session_v1";
const EVENT = "gesto-chamois";

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadDb(): Db {
  if (typeof localStorage === "undefined") return seed();
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Db;
    if (!parsed?.restaurant || !Array.isArray(parsed.accounts)) return seed();
    return parsed;
  } catch { return seed(); }
}

export function saveDb(db: Db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  window.dispatchEvent(new Event(EVENT));
}

export function ensureDb() {
  const db = loadDb();
  if (!localStorage.getItem(DB_KEY)) saveDb(db);
  return loadDb();
}

export function resetDemo() {
  localStorage.removeItem(DB_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  saveDb(seed());
}

export function onDemoChange(fn: () => void) {
  const storage = (e: StorageEvent) => { if (e.key === DB_KEY || e.key === null) fn(); };
  window.addEventListener("storage", storage);
  window.addEventListener(EVENT, fn);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(EVENT, fn); };
}

export function sessionId() { return sessionStorage.getItem(SESSION_KEY); }
export function setSession(id: string | null) {
  if (id) sessionStorage.setItem(SESSION_KEY, id);
  else sessionStorage.removeItem(SESSION_KEY);
}

export function login(email: string, password: string): { ok: true; id: string } | { ok: false; error: string } {
  const db = loadDb();
  const account = db.accounts.find((a) => a.email === email.trim().toLowerCase());
  if (!account || !account.password || account.password !== password) return { ok: false, error: "Email ou mot de passe incorrect." };
  if (!account.active) return { ok: false, error: "Ce compte a été désactivé par le patron." };
  setSession(account.id);
  return { ok: true, id: account.id };
}

export function invite(authorId: string, input: { firstName: string; lastName: string; email: string; role: "manager" | "salarie" }): { ok: true; token: string } | { ok: false; error: string } {
  const db = loadDb();
  const author = db.accounts.find((a) => a.id === authorId);
  if (!author || author.role !== "patron" || !author.active) return { ok: false, error: "Seul le patron peut inviter." };
  const email = input.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Email invalide." };
  const firstName = input.firstName.trim().slice(0, 40);
  const lastName = input.lastName.trim().slice(0, 40);
  if (!firstName || !lastName) return { ok: false, error: "Prénom et nom sont obligatoires." };
  if (db.accounts.some((a) => a.email === email)) return { ok: false, error: "Cet email est déjà dans l'équipe." };
  const token = uid().replace(/-/g, "");
  const account: Account = {
    id: uid(), restaurantId: db.restaurant.id, firstName, lastName, email,
    role: input.role, password: null, active: true, inviteToken: token,
  };
  db.accounts.push(account);
  saveDb(db);
  return { ok: true, token };
}

export function acceptInvite(token: string, password: string): { ok: true; id: string } | { ok: false; error: string } {
  if (password.length < 8) return { ok: false, error: "Mot de passe : 8 caractères minimum." };
  const db = loadDb();
  const account = db.accounts.find((a) => a.inviteToken === token);
  if (!account) return { ok: false, error: "Invitation inconnue ou déjà utilisée." };
  if (!account.active) return { ok: false, error: "Ce compte a été désactivé par le patron." };
  account.password = password;
  account.inviteToken = null;
  saveDb(db);
  setSession(account.id);
  return { ok: true, id: account.id };
}

export function setActive(patronId: string, accountId: string, active: boolean) {
  const db = loadDb();
  const patron = db.accounts.find((a) => a.id === patronId);
  const account = db.accounts.find((a) => a.id === accountId);
  if (!patron || patron.role !== "patron" || !account || account.role === "patron") return;
  account.active = active;
  saveDb(db);
}

export function setManagersMaySend(patronId: string, allowed: boolean) {
  const db = loadDb();
  const patron = db.accounts.find((a) => a.id === patronId);
  if (!patron || patron.role !== "patron") return;
  db.restaurant.managersMaySend = allowed;
  saveDb(db);
}

export function postDirective(authorId: string, input: { body: string; priority: Priority; due: string; audience: Audience }) {
  const db = loadDb();
  const author = db.accounts.find((a) => a.id === authorId);
  if (!author) return { ok: false as const, error: "Compte introuvable." };
  if (!canSend(db, author)) return { ok: false as const, error: "Le patron n'a pas autorisé les managers à envoyer des consignes." };
  const body = input.body.trim().slice(0, 2000);
  if (body.length < 2) return { ok: false as const, error: "Écris la consigne." };
  if (input.due && !/^\d{4}-\d{2}-\d{2}$/.test(input.due)) return { ok: false as const, error: "Date invalide." };
  db.directives.push({
    id: uid(), restaurantId: db.restaurant.id, authorId, body,
    priority: input.priority, due: input.due || null, audience: input.audience, createdAt: new Date().toISOString(),
  });
  saveDb(db);
  return { ok: true as const };
}

export function markRead(accountId: string, directiveId: string) {
  const db = loadDb();
  if (db.reads.some((r) => r.directiveId === directiveId && r.accountId === accountId)) return;
  const directive = db.directives.find((d) => d.id === directiveId);
  if (!directive) return;
  if (!targets(db, directive).some((a) => a.id === accountId)) return;
  db.reads.push({ directiveId, accountId, at: new Date().toISOString() });
  saveDb(db);
}

export function postNote(authorId: string, input: { directiveId: string | null; kind: Note["kind"]; body: string }) {
  const db = loadDb();
  const author = db.accounts.find((a) => a.id === authorId && a.active);
  if (!author) return { ok: false as const, error: "Compte inactif." };
  const body = input.body.trim().slice(0, 2000);
  if (input.kind !== "fait" && body.length < 2) return { ok: false as const, error: "Écris quelques mots." };
  if (input.directiveId) {
    const directive = db.directives.find((d) => d.id === input.directiveId);
    if (!directive || !targets(db, directive).some((a) => a.id === authorId)) return { ok: false as const, error: "Cette consigne ne t'est pas adressée." };
  } else if (input.kind !== "rapport") return { ok: false as const, error: "Un rapport est nécessaire." };
  db.notes.push({
    id: uid(), restaurantId: db.restaurant.id, directiveId: input.directiveId, authorId,
    kind: input.kind, body: body || "Marqué comme fait.", status: "ouvert", createdAt: new Date().toISOString(),
  });
  saveDb(db);
  return { ok: true as const };
}

export function setNoteStatus(actorId: string, noteId: string, status: Note["status"]) {
  const db = loadDb();
  const actor = db.accounts.find((a) => a.id === actorId);
  if (!actor || (actor.role !== "patron" && actor.role !== "manager")) return;
  const note = db.notes.find((n) => n.id === noteId && n.restaurantId === actor.restaurantId);
  if (!note) return;
  note.status = status;
  saveDb(db);
}
