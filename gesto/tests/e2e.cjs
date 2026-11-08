// Test de bout en bout : inscription -> diagnostic -> salarié -> validation -> téléchargement -> échéance -> rappel -> espace employé.
const { chromium } = require("playwright");
const B = process.env.BASE || "http://localhost:3100";
const ok = (c, m) => { if (!c) { console.error("ÉCHEC:", m); process.exit(1); } console.log("OK:", m); };
(async () => {
  const br = await chromium.launch(); const fsx = require("fs"); const p = await (await br.newContext({ acceptDownloads: true })).newPage();
  const email = `patron${Date.now()}@test.fr`;
  await p.goto(B + "/inscription");
  await p.fill("[name=email]", email); await p.fill("[name=password]", "motdepasse1");
  await p.click("[name=cgv]"); await p.click("button:has-text('Créer mon compte')");
  await p.waitForURL("**/diagnostic"); ok(true, "inscription");
  await p.fill("input[placeholder='Nom du commerce']", "Le Chamois"); await p.click("text=Continuer");
  await p.fill("input[placeholder='Ex : 73']", "73"); await p.click("text=Continuer");
  await p.click("button:has-text('restaurant')"); await p.click("button:has-text('6-10')"); await p.click("button:has-text('saisonnier')");
  await p.click("button:has-text('URSSAF')"); await p.click("text=Continuer"); await p.click("button:has-text('Gagner du temps')");
  await p.waitForURL("**/tableau-de-bord"); ok(await p.locator("text=Le Chamois").first().isVisible(), "diagnostic -> tableau de bord");
  fsx.writeFileSync((process.env.GESTO_DATA_DIR || ".") + "/state.json", JSON.stringify({ email }));
  await p.goto(B + "/salaries/nouveau");
  await p.fill("[name=name]", "Léa Martin"); await p.fill("[name=post]", "serveuse"); await p.fill("[name=start]", new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10));
  await p.fill("[name=hours]", "42"); await p.fill("[name=salary]", "2400"); await p.click("button:has-text('Générer')");
  await p.waitForURL("**/documents"); ok((await p.locator("text=J'ai relu, je valide").count()) === 2 && (await p.locator("text=Validation bloquée").count()) === 1, "3 documents générés : 2 à relire, contrat bloqué (infos manquantes)");
  await p.goto(B + "/tableau-de-bord");
  ok(await p.locator("text=Contrat bloqué").isVisible() && await p.locator("text=DPAE de Léa Martin à déclarer").isVisible() && await p.locator("text=3 documents en attente de validation").isVisible(), "tableau de bord : contrat bloqué (rouge), échéance DPAE et documents à relire (orange), données réelles");
  await p.goto(B + "/documents");
  const r = await p.request.get(B + "/api/documents/3"); ok(r.status() === 403, "téléchargement refusé avant validation");
  ok(await p.locator("text=Informations manquantes").isVisible() && (await p.locator("text=Validation bloquée").count()) === 1, "alerte infos manquantes + validation du contrat bloquée");
  ok((await p.request.get(B + "/api/documents/1")).status() === 403, "contrat non téléchargeable tant qu'incomplet");
  await p.fill("[name=convention]", "HCR (IDCC 1979)"); await p.fill("[name=essai]", "2 mois"); await p.click("button:has-text('Compléter le contrat')");
  await p.waitForSelector("text=Validation bloquée", { state: "detached" }); ok(true, "contrat complété (version 2, à revalider)");
  while (await p.locator("button:has-text(\"J'ai relu\")").count()) { const n = await p.locator("button:has-text(\"J'ai relu\")").count(); await p.locator("button:has-text(\"J'ai relu\")").first().click(); await p.waitForFunction((k) => document.querySelectorAll("button").length >= 0 && [...document.querySelectorAll("button")].filter((b) => b.textContent.includes("J'ai relu")).length < k, n); }
  ok(await p.locator("text=v2 · validé le").count() === 1, "contrat v2 validé (journal horodaté)");
  const dl = await p.request.get(B + "/api/documents/3"); const buf = await dl.body();
  ok(dl.status() === 200 && buf.slice(0, 2).toString() === "PK", "DOCX téléchargé après validation");
  ok(await p.locator("text=Document validé").first().isVisible(), "journal de validation");
  await p.goto(B + "/echeances"); ok(await p.locator("text=DPAE de Léa Martin").isVisible(), "échéance DPAE créée automatiquement");
  await p.fill("[name=title]", "Échéance lointaine"); await p.fill("[name=due]", new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)); await p.click("button:has-text('Ajouter')"); await p.waitForSelector("text=Échéance lointaine");
  const mock = process.env.MOCK_PORT ? `https://localhost:${process.env.MOCK_PORT}` : null;
  if (mock) {
    const b64u = (b) => b.toString("base64url"); const ecdh = require("crypto").createECDH("prime256v1"); ecdh.generateKeys();
    const sr = await p.request.post(B + "/api/push/subscribe", { data: { endpoint: mock + "/push/appareil-1", keys: { p256dh: b64u(ecdh.getPublicKey()), auth: b64u(require("crypto").randomBytes(16)) } } });
    ok(sr.status() === 200, "appareil abonné aux notifications système");
  }
  const rap = await p.request.get(B + "/api/rappels", { headers: { authorization: "Bearer testsecret" } });
  const j = await rap.json();
  if (mock) {
    ok(rap.status() === 200 && j.envoyes === 1 && j.non_envoyes === 0, "rappel DPAE envoyé en notification système, pas l'échéance à 30 jours " + JSON.stringify(j));
    const got = await (await fetch(mock + "/received")).json().catch(() => null);
    ok(got && got.length === 1 && got[0].headers.authorization?.startsWith("vapid") && got[0].headers["content-encoding"] === "aes128gcm" && got[0].bytes > 0, "le service push a reçu 1 message chiffré signé VAPID");
    const j2 = await (await p.request.get(B + "/api/rappels", { headers: { authorization: "Bearer testsecret" } })).json();
    ok(j2.envoyes === 0, "pas de doublon de rappel");
  } else ok(rap.status() === 200 && j.non_envoyes === 1 && j.envoyes === 0, "sans clé push : rappel marqué non envoyé (jamais faussement envoyé) " + JSON.stringify(j));
  ok((await p.request.get(B + "/api/rappels")).status() === 401, "rappels protégés");
  ok((await p.request.get(B + "/api/sante")).status() === 401, "contrôle de configuration protégé");
  const sante = await (await p.request.get(B + "/api/sante", { headers: { authorization: "Bearer testsecret" } })).json();
  ok(sante.checks.base_postgres === true && sante.pret_pour_rappels === true && sante.checks.paiement_stripe === false && !JSON.stringify(sante).includes("testsecret"), "contrôle de configuration : prêt pour rappels, paiement coupé, aucun secret exposé");
  if (process.env.GESTO_EXTRAS !== "1") { ok((await p.request.get(B + "/offres")).status() === 404 && (await p.request.get(B + "/salarie")).status() === 404, "extras masqués par défaut"); await br.close(); console.log("TOUS LES TESTS PASSENT (cœur V1)"); return; }
  await p.goto(B + "/salaries"); const code = (await p.locator("span.font-mono").innerText()).trim();
  await p.fill("[name=consigne]", "Ouverture 11h30"); await p.click("button:has-text('Enregistrer')"); await p.waitForLoadState("networkidle"); await p.waitForTimeout(500);
  const ctx2 = await br.newContext(); const e = await ctx2.newPage();
  await e.goto(B + "/rejoindre"); await e.fill("[name=code]", code); await e.fill("[name=name]", "Léa Martin");
  await e.fill("[name=email]", `lea${Date.now()}@test.fr`); await e.fill("[name=password]", "motdepasse1"); await e.click("button:has-text('Rejoindre')");
  await e.waitForURL("**/salarie"); ok(await e.locator("text=Ouverture 11h30").isVisible(), "espace employé + consigne");
  await e.click("button:has-text(\"J'arrive\")"); await e.waitForSelector("text=Arrivé à"); ok(true, "pointage J'arrive");
  ok((await e.request.get(B + "/api/documents/3")).status() === 401, "salarié sans accès aux documents");
  await br.close(); console.log("TOUS LES TESTS PASSENT");
})().catch((x) => { console.error(x); process.exit(1); });
