-- Gesto — schéma Postgres (Supabase). Idempotent : on peut le relancer.
-- L'application recrée aussi ces tables au démarrage. Ce fichier sert à les voir et à les poser avant la première ouverture.

CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patron',
  company_id INTEGER,
  consent_cgv INTEGER NOT NULL DEFAULT 0,
  consent_stats INTEGER NOT NULL DEFAULT 0,
  created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS companies(
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  dept TEXT,
  nb_sal TEXT,
  season TEXT,
  pains TEXT,
  objective TEXT,
  invite_code TEXT UNIQUE,
  consigne TEXT DEFAULT '',
  faq TEXT DEFAULT '[]',
  modules TEXT DEFAULT '{"paperasse":true,"salarie":true}'
);
CREATE TABLE IF NOT EXISTS employees(
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  user_id INTEGER,
  enc TEXT NOT NULL,
  created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS documents(
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  employee_id INTEGER,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'a_relire',
  version INTEGER NOT NULL DEFAULT 1,
  created TEXT NOT NULL,
  validated_at TEXT
);
CREATE TABLE IF NOT EXISTS journal(
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  doc_id INTEGER,
  version INTEGER
);
CREATE TABLE IF NOT EXISTS deadlines(
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  due TEXT NOT NULL,
  remind_days INTEGER NOT NULL DEFAULT 7,
  done INTEGER NOT NULL DEFAULT 0,
  last_reminded TEXT,
  employee_id INTEGER
);
CREATE TABLE IF NOT EXISTS notifications(
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  deadline_id INTEGER,
  at TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS punches(
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  at TEXT NOT NULL,
  kind TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS purchases(
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  offer TEXT NOT NULL,
  status TEXT NOT NULL,
  stripe_id TEXT,
  created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS push_subs(
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS errors(
  id SERIAL PRIMARY KEY,
  at TEXT NOT NULL,
  scope TEXT,
  message TEXT
);
CREATE TABLE IF NOT EXISTS company_media(
  company_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  mime TEXT NOT NULL,
  data BYTEA NOT NULL,
  updated TEXT NOT NULL,
  PRIMARY KEY(company_id, kind)
);
CREATE TABLE IF NOT EXISTS roster(
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  enc TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  employee_id INTEGER,
  created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS directives(
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS staff_messages(
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  directive_id INTEGER,
  kind TEXT NOT NULL,
  body TEXT NOT NULL,
  author TEXT NOT NULL,
  created TEXT NOT NULL
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_company ON deadlines(company_id, done, due);
CREATE INDEX IF NOT EXISTS idx_roster_company ON roster(company_id);
CREATE INDEX IF NOT EXISTS idx_directives_company ON directives(company_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_staff_messages_company ON staff_messages(company_id, id DESC);
