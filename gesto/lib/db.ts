import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dir = process.env.GESTO_DATA_DIR || path.join(process.cwd(), "data");
fs.mkdirSync(dir, { recursive: true });

const g = globalThis as unknown as { __db?: DatabaseSync };
function open() {
  const db = new DatabaseSync(path.join(dir, "gesto.db"));
  db.exec(`
  PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
  CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'patron', company_id INTEGER, consent_cgv INTEGER NOT NULL DEFAULT 0, consent_stats INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS companies(id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL, name TEXT NOT NULL, type TEXT, dept TEXT, nb_sal TEXT, season TEXT, pains TEXT, objective TEXT, invite_code TEXT UNIQUE, consigne TEXT DEFAULT '', faq TEXT DEFAULT '[]', modules TEXT DEFAULT '{"paperasse":true,"salarie":true}');
  CREATE TABLE IF NOT EXISTS employees(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL, user_id INTEGER, enc TEXT NOT NULL, created TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS documents(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL, employee_id INTEGER, kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'a_relire', version INTEGER NOT NULL DEFAULT 1, created TEXT NOT NULL, validated_at TEXT);
  CREATE TABLE IF NOT EXISTS journal(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL, at TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, doc_id INTEGER, version INTEGER);
  CREATE TABLE IF NOT EXISTS deadlines(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL, title TEXT NOT NULL, due TEXT NOT NULL, remind_days INTEGER NOT NULL DEFAULT 7, done INTEGER NOT NULL DEFAULT 0, last_reminded TEXT);
  CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL, deadline_id INTEGER, at TEXT NOT NULL, subject TEXT NOT NULL, status TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS punches(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL, employee_id INTEGER NOT NULL, at TEXT NOT NULL, kind TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS purchases(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, offer TEXT NOT NULL, status TEXT NOT NULL, stripe_id TEXT, created TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS errors(id INTEGER PRIMARY KEY, at TEXT NOT NULL, scope TEXT, message TEXT);
  `);
  return db;
}
export const db: DatabaseSync = (g.__db ??= open());

// Chiffrement AES-256-GCM des données salariés. Clé : GESTO_DATA_KEY, sinon fichier local généré.
function key(): Buffer {
  const env = process.env.GESTO_DATA_KEY;
  if (env) return crypto.scryptSync(env, "gesto", 32);
  const f = path.join(dir, ".datakey");
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
  return Buffer.from(fs.readFileSync(f, "utf8"), "hex");
}
export function encrypt(obj: unknown): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}
export function decrypt<T>(s: string): T {
  const [iv, tag, data] = s.split(".").map((x) => Buffer.from(x, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return JSON.parse(Buffer.concat([d.update(data), d.final()]).toString("utf8"));
}
export function logError(scope: string, e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(`[gesto:${scope}]`, message);
  try { db.prepare("INSERT INTO errors(at,scope,message) VALUES(?,?,?)").run(new Date().toISOString(), scope, message); } catch {}
}
export const now = () => new Date().toISOString();
