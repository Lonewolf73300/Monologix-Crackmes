#!/usr/bin/env node
// Nettoie les données d'équipe du restaurant lié à LOU_EMAIL.
// CONFIRM=NETTOYER-LE-CHAMOIS  → efface fiches, équipe, consignes, échéances, documents. Garde le compte patron.
// CONFIRM=SUPPRIMER-COMPTE    → efface aussi le compte et le restaurant.
const { Client } = require("pg");
function need(name) {
  const v = process.env[name];
  if (!v) { console.error("Variable manquante : " + name); process.exit(1); }
  return v;
}
(async () => {
  const confirm = need("CONFIRM");
  if (!["NETTOYER-LE-CHAMOIS", "SUPPRIMER-COMPTE"].includes(confirm)) {
    console.error("CONFIRM doit valoir NETTOYER-LE-CHAMOIS ou SUPPRIMER-COMPTE.");
    process.exit(1);
  }
  const email = need("LOU_EMAIL").trim().toLowerCase();
  const local = /localhost|127\.0\.0\.1/.test(need("DATABASE_URL"));
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: local ? false : { rejectUnauthorized: false } });
  await c.connect();
  try {
    const user = await c.query("SELECT id, company_id FROM users WHERE email=$1", [email]);
    if (!user.rowCount) { console.error("Aucun compte pour cet email."); process.exit(1); }
    const companyId = user.rows[0].company_id;
    const userId = user.rows[0].id;
    if (!companyId) { console.log("Ce compte n'a pas de restaurant."); return; }
    const co = await c.query("SELECT name FROM companies WHERE id=$1", [companyId]);
    await c.query("BEGIN");
    for (const table of ["staff_messages", "directives", "roster", "punches", "notifications", "deadlines", "journal", "documents", "employees", "company_media", "push_subs"]) {
      await c.query(`DELETE FROM ${table} WHERE company_id=$1`, [companyId]);
    }
    await c.query("DELETE FROM users WHERE company_id=$1 AND role='salarie'", [companyId]);
    if (confirm === "SUPPRIMER-COMPTE") {
      await c.query("DELETE FROM purchases WHERE user_id=$1", [userId]);
      await c.query("DELETE FROM users WHERE id=$1", [userId]);
      await c.query("DELETE FROM companies WHERE id=$1", [companyId]);
      console.log(`Compte et restaurant « ${co.rows[0].name} » supprimés.`);
    } else {
      await c.query("UPDATE companies SET consigne='', faq='[]' WHERE id=$1", [companyId]);
      console.log(`Équipe, fiches, consignes, documents et échéances effacés pour « ${co.rows[0].name} ». Le compte patron est conservé.`);
    }
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally { await c.end(); }
})().catch((e) => { console.error(e.message); process.exit(1); });
