import { Pool, PoolClient, types } from "pg";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Postgres (Supabase en production : DATABASE_URL = chaîne de connexion Postgres du projet).
types.setTypeParser(20, (v) => parseInt(v, 10)); // COUNT(*) -> nombre

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'patron', company_id INTEGER, consent_cgv INTEGER NOT NULL DEFAULT 0, consent_stats INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS companies(id SERIAL PRIMARY KEY, owner_id INTEGER NOT NULL, name TEXT NOT NULL, type TEXT, dept TEXT, nb_sal TEXT, season TEXT, pains TEXT, objective TEXT, invite_code TEXT UNIQUE, consigne TEXT DEFAULT '', faq TEXT DEFAULT '[]', modules TEXT DEFAULT '{"paperasse":true,"salarie":true}');
CREATE TABLE IF NOT EXISTS employees(id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, user_id INTEGER, enc TEXT NOT NULL, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS documents(id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, employee_id INTEGER, kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'a_relire', version INTEGER NOT NULL DEFAULT 1, created TEXT NOT NULL, validated_at TEXT);
CREATE TABLE IF NOT EXISTS journal(id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, at TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, doc_id INTEGER, version INTEGER);
CREATE TABLE IF NOT EXISTS deadlines(id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, title TEXT NOT NULL, due TEXT NOT NULL, remind_days INTEGER NOT NULL DEFAULT 7, done INTEGER NOT NULL DEFAULT 0, last_reminded TEXT, employee_id INTEGER);
CREATE TABLE IF NOT EXISTS notifications(id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, deadline_id INTEGER, at TEXT NOT NULL, subject TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS punches(id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, employee_id INTEGER NOT NULL, at TEXT NOT NULL, kind TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS purchases(id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, offer TEXT NOT NULL, status TEXT NOT NULL, stripe_id TEXT, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS push_subs(id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, company_id INTEGER NOT NULL, endpoint TEXT UNIQUE NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS errors(id SERIAL PRIMARY KEY, at TEXT NOT NULL, scope TEXT, message TEXT);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_company ON deadlines(company_id, done, due);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
CREATE TABLE IF NOT EXISTS company_media(company_id INTEGER NOT NULL, kind TEXT NOT NULL, mime TEXT NOT NULL, data BYTEA NOT NULL, updated TEXT NOT NULL, PRIMARY KEY(company_id, kind));
CREATE TABLE IF NOT EXISTS roster(id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, enc TEXT NOT NULL, invite_code TEXT UNIQUE NOT NULL, user_id INTEGER, employee_id INTEGER, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS directives(id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, body TEXT NOT NULL, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS staff_messages(id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL, user_id INTEGER NOT NULL, directive_id INTEGER, kind TEXT NOT NULL, body TEXT NOT NULL, author TEXT NOT NULL, created TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_roster_company ON roster(company_id);
CREATE INDEX IF NOT EXISTS idx_directives_company ON directives(company_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_staff_messages_company ON staff_messages(company_id, id DESC);
`;

const g = globalThis as unknown as { __pool?: Pool; __ready?: Promise<void> };
function pool(): Pool {
  if (g.__pool) return g.__pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant (chaîne de connexion Postgres / Supabase).");
  const local = /@(localhost|127\.0\.0\.1)(:|\/)|host=\/|%2F/.test(url);
  g.__pool = new Pool({ connectionString: url, max: 5, ssl: local ? false : { rejectUnauthorized: false } });
  g.__pool.on("error", (e) => console.error("[gesto:pg]", e.message));
  return g.__pool;
}
function ready(): Promise<void> {
  return (g.__ready ??= (async () => {
    const c = await pool().connect();
    try {
      await c.query("SELECT pg_advisory_lock(7351)");
      await c.query(SCHEMA);
      await c.query("SELECT pg_advisory_unlock(7351)");
    } finally { c.release(); }
  })().catch((e) => { g.__ready = undefined; throw e; }));
}
const conv = (sql: string) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };

type Runner = { query: (text: string, params: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }> };
function stmt(r: Runner, sql: string) {
  const text = conv(sql);
  const insert = /^\s*insert/i.test(sql) && !/returning/i.test(sql);
  return {
    get: async (...p: unknown[]) => (await r.query(text, p)).rows[0] as unknown,
    all: async (...p: unknown[]) => (await r.query(text, p)).rows as unknown[],
    run: async (...p: unknown[]) => {
      const res = await r.query(insert ? text + " RETURNING id" : text, p);
      return { lastInsertRowid: Number(res.rows[0]?.id ?? 0), changes: res.rowCount ?? 0 };
    },
  };
}
export const db = {
  prepare(sql: string) {
    const r: Runner = { query: async (t, p) => { await ready(); return pool().query(t, p as never[]); } };
    return stmt(r, sql);
  },
  // Transaction : tout ou rien (aucune écriture à moitié faite).
  async tx<T>(fn: (t: { prepare: (sql: string) => ReturnType<typeof stmt> }) => Promise<T>): Promise<T> {
    await ready();
    const c: PoolClient = await pool().connect();
    try {
      await c.query("BEGIN");
      const out = await fn({ prepare: (sql) => stmt(c as unknown as Runner, sql) });
      await c.query("COMMIT");
      return out;
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { c.release(); }
  },
};

// Chiffrement AES-256-GCM des données salariés. Clé : GESTO_DATA_KEY (obligatoire en production).
function key(): Buffer {
  const env = process.env.GESTO_DATA_KEY;
  if (env) return crypto.scryptSync(env, "gesto", 32);
  if (process.env.NODE_ENV === "production" && process.env.GESTO_ALLOW_DEV_KEY !== "1") throw new Error("GESTO_DATA_KEY manquant en production.");
  const dir = process.env.GESTO_DATA_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
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
  db.prepare("INSERT INTO errors(at,scope,message) VALUES(?,?,?)").run(new Date().toISOString(), scope, message).catch(() => {});
}
export const now = () => new Date().toISOString();
