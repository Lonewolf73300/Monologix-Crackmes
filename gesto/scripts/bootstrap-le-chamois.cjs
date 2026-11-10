#!/usr/bin/env node
// Crée le restaurant « Le Chamois » et le compte patron de Lou. Aucun salarié.
// Variables : DATABASE_URL, LOU_EMAIL, LOU_PASSWORD. Facultatif : LOU_FIRST_NAME (défaut Lou).
const crypto = require("crypto");
const { Client } = require("pg");

function need(name) {
  const v = process.env[name];
  if (!v) { console.error("Variable manquante : " + name); process.exit(1); }
  return v;
}
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return salt.toString("hex") + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
}
function code() { return crypto.randomBytes(4).toString("hex").toUpperCase(); }

(async () => {
  const email = need("LOU_EMAIL").trim().toLowerCase();
  const password = need("LOU_PASSWORD");
  if (password.length < 8) { console.error("LOU_PASSWORD : 8 caractères minimum."); process.exit(1); }
  const first = (process.env.LOU_FIRST_NAME || "Lou").slice(0, 40);
  const local = /localhost|127\.0\.0\.1/.test(need("DATABASE_URL"));
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: local ? false : { rejectUnauthorized: false } });
  await c.connect();
  try {
    const exists = await c.query("SELECT to_regclass('public.users') AS t");
    if (!exists.rows[0].t) {
      console.error("Tables absentes. Exécute d'abord supabase/migrations/001_init.sql, ou ouvre une fois l'application (elle crée les tables).");
      process.exit(1);
    }
    const found = await c.query("SELECT id, company_id FROM users WHERE email=$1", [email]);
    let userId = found.rows[0]?.id;
    let companyId = found.rows[0]?.company_id;
    if (!userId) {
      const ins = await c.query(
        "INSERT INTO users(email,hash,first_name,role,consent_cgv,consent_stats,created) VALUES($1,$2,$3,'patron',1,0,$4) RETURNING id",
        [email, hashPassword(password), first, new Date().toISOString()],
      );
      userId = ins.rows[0].id;
      console.log("Compte patron créé.");
    } else console.log("Compte patron déjà présent. Le mot de passe n'est pas modifié.");
    if (companyId) {
      const co = await c.query("SELECT id, name, invite_code FROM companies WHERE id=$1", [companyId]);
      console.log(`Restaurant déjà lié : ${co.rows[0].name}. Code : ${co.rows[0].invite_code}. Aucun salarié ajouté.`);
      if (co.rows[0].name !== "Le Chamois") console.log("Ce compte n'est pas nommé Le Chamois. Rien n'a été renommé.");
      return;
    }
    let invite = code();
    for (let i = 0; i < 5; i++) {
      const clash = await c.query("SELECT 1 FROM companies WHERE invite_code=$1", [invite]);
      if (!clash.rowCount) break;
      invite = code();
    }
    const co = await c.query(
      `INSERT INTO companies(owner_id,name,type,dept,nb_sal,season,pains,objective,invite_code)
       VALUES($1,'Le Chamois','restaurant','73','0','saisonnier',$2,'Déléguer',$3) RETURNING id, invite_code`,
      [userId, JSON.stringify(["Paperasse des salariés"]), invite],
    );
    await c.query("UPDATE users SET company_id=$1 WHERE id=$2", [co.rows[0].id, userId]);
    console.log("Restaurant Le Chamois créé. Aucun salarié.");
    console.log("Code du restaurant : " + co.rows[0].invite_code);
    console.log("Connexion : " + email);
    console.log("À corriger dans Paramètres si besoin : saison, effectif. L'effectif « 0 » veut dire qu'aucune fiche n'est encore là.");
  } finally { await c.end(); }
})().catch((e) => { console.error(e.message); process.exit(1); });
