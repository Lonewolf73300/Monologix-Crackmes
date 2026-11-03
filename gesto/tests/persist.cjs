// Après redémarrage du serveur : rien n'est perdu (salarié, contrat v2 validé, échéance, appareil push, journal des rappels).
const { chromium } = require("playwright"); const fs = require("fs"); const { Client } = require("pg");
const B = process.env.BASE; const dir = process.env.GESTO_DATA_DIR;
const ok = (c, m) => { if (!c) { console.error("ÉCHEC:", m); process.exit(1); } console.log("OK:", m); };
(async () => {
  const { email } = JSON.parse(fs.readFileSync(dir + "/state.json", "utf8"));
  const br = await chromium.launch(); const p = await (await br.newContext()).newPage();
  await p.goto(B + "/connexion"); await p.fill("[name=email]", email); await p.fill("[name=password]", "motdepasse1"); await p.click("button:has-text('Me connecter')");
  await p.waitForURL("**/tableau-de-bord"); ok(true, "reconnexion après redémarrage");
  await p.goto(B + "/salaries"); ok(await p.locator("text=Léa Martin").isVisible(), "fiche salarié conservée");
  await p.goto(B + "/documents"); ok((await p.locator("text=v2 · validé le").count()) === 1, "contrat v2 validé conservé");
  const dl = await p.request.get(B + "/api/documents/1"); ok(dl.status() === 200, "contrat toujours téléchargeable");
  await p.goto(B + "/echeances?id=1"); ok(await p.locator("#dossier >> text=salarié : Léa Martin").isVisible() && await p.locator("#dossier >> text=Contrat de travail v2 — validé").isVisible(), "ouverture du bon dossier depuis le lien de la notification");
  const db = new Client({ connectionString: process.env.DATABASE_URL }); await db.connect();
  const cnt = async (sql) => (await db.query(sql)).rows[0].n;
  ok(await cnt("SELECT COUNT(*)::int n FROM push_subs") === (process.env.MOCK_PORT ? 1 : 0), "abonnement push conservé");
  ok(await cnt("SELECT COUNT(*)::int n FROM notifications WHERE status IN ('push_envoye','email_envoye')") === (process.env.MOCK_PORT ? 1 : 0), "journal des rappels conservé");
  await db.end(); await br.close(); console.log("PERSISTANCE OK");
})().catch((x) => { console.error(x); process.exit(1); });
