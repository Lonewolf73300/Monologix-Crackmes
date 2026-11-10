(() => {
  "use strict";
  const KEY = "gesto_employe_tel_v1";
  const SNOW = new Set([71, 73, 75, 77, 85, 86]);
  const VIEWS = [
    { id: "loup", label: "le loup", poste: "chef de rang", kind: "employe" },
    { id: "pelo", label: "le pélo", poste: "runner", kind: "employe" },
    { id: "patron", label: "Lou · patron", poste: "patron", kind: "patron" },
    { id: "manager", label: "Lou · manager salle", poste: "manager salle", kind: "manager" },
  ];
  const TABS = [
    ["aujourd", "Jour", "home"],
    ["carte", "Carte", "wine"],
    ["manques", "Manques", "list"],
    ["planning", "Planning", "cal"],
    ["reunion", "Réunion", "meet"],
    ["question", "Question", "ask"],
  ];
  const ICONS = {
    home: '<path d="M4 11 12 4l8 7v9H4z"/><path d="M9 20v-6h6v6"/>',
    wine: '<path d="M8 3h8l-1 7a3 3 0 0 1-6 0z"/><path d="M12 13v7M8 20h8"/>',
    list: '<path d="M8 7h11M8 12h11M8 17h11"/><path d="M4 7h.01M4 12h.01M4 17h.01"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    meet: '<path d="M8 18v-2a4 4 0 0 1 8 0v2"/><circle cx="12" cy="8" r="3"/>',
    ask: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7"/><path d="M12 17h.01"/>',
  };

  let DATA = null;
  let state = blank();
  let view = "aujourd";
  let day = parisToday();
  let weather = null;
  let weatherError = "";
  let botQ = "";
  let botA = "";
  let askingPin = false;

  let urlTest = null;
  let pinError = "";
  let accountError = "";
  const store = window.GestoStorage.createLocalStore(KEY);

  function blank() {
    return { account: null, patronUnlocked: false, viewAs: null, plat: null, vins: [], manques: [], reunions: [], ferme: {}, meteoForce: "auto" };
  }
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function icon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
  }
  function uid() { return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`; }
  function loadState() {
    const raw = store.load();
    if (!raw) return blank();
    return { ...blank(), ...raw };
  }
  function saveState() { store.save(state); }
  function normName(s) { return String(s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim(); }
  function matchRoster(name) {
    const n = normName(name);
    return DATA.roster.find((p) => normName(nameOf(p)) === n) || null;
  }
  function persona() {
    if (urlTest) return urlTest;
    if (state.patronUnlocked && state.viewAs) return VIEWS.find((v) => v.id === state.viewAs) || VIEWS[2];
    if (state.patronUnlocked && !state.account) return VIEWS[2];
    if (state.account) return { id: "account", label: state.account.name, poste: state.account.role, kind: "employe", rosterId: state.account.rosterId };
    return { id: "none", label: "", poste: "", kind: "none" };
  }
  function myRoster() {
    const me = persona();
    return me.rosterId ? person(me.rosterId) : null;
  }
  function canEdit() { const k = persona().kind; return k === "patron" || k === "manager"; }
  function nameOf(p) { return p.label || [p.first, p.last].filter(Boolean).join(" "); }
  function person(id) { return DATA.roster.find((p) => p.id === id); }
  function weekday(iso) { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).getDay(); }
  function addDays(iso, n) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d + n);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }
  function addMinutes(hhmm, mins) {
    const [h, m] = hhmm.split(":").map(Number);
    const t = h * 60 + m + mins;
    return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(((t % 60) + 60) % 60).padStart(2, "0")}`;
  }
  function parisToday() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }
  function frDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }
  function closedWithLou(personId, iso) {
    const local = state.ferme[iso];
    if (local && Object.prototype.hasOwnProperty.call(local, personId)) return !!local[personId];
    return DATA.exempleFermeAvecLou.some((x) => x.weekday === weekday(iso) && x.personId === personId);
  }
  function baseArrival(personId, iso) {
    const row = DATA.shifts.find((s) => s.personId === personId && s.weekday === weekday(iso));
    return row ? row.arrival : null;
  }
  function arrival(personId, iso) {
    const base = baseArrival(personId, iso);
    if (!base) return null;
    const prev = addDays(iso, -1);
    if (closedWithLou(personId, prev)) return { time: addMinutes(base, DATA.fermeOffsetMinutes), base, offset: true };
    return { time: base, base, offset: false };
  }
  function dayPlan(iso) {
    const people = DATA.roster.map((p) => {
      const a = arrival(p.id, iso);
      return a ? { ...p, ...a } : null;
    }).filter(Boolean).sort((a, b) => a.time.localeCompare(b.time) || nameOf(a).localeCompare(nameOf(b), "fr"));
    const chefs = people.filter((p) => p.cible === "chef-de-rang");
    const runners = people.filter((p) => p.cible === "runner");
    return { people, events: DATA.events.filter((e) => e.weekday === weekday(iso)), cleaning: chefs[0] ? { chef: chefs[0], runner: runners[0] || null } : null };
  }
  function gaps() {
    return DATA.cibles.map((c) => {
      const n = DATA.roster.filter((p) => p.statut === "embauche" && p.cible === c.id).length;
      const suggestion = (DATA.suggestions || []).find((s) => s.slot === c.id);
      return { ...c, n, manque: Math.max(0, c.cible - n), suggestion };
    }).filter((c) => c.groupe === "Salle" || c.groupe === "Cuisine");
  }
  function snowNow() {
    if (state.meteoForce === "neige") return { snow: true, source: "manuel" };
    if (state.meteoForce === "clair") return { snow: false, source: "manuel" };
    if (!weather) return { snow: false, source: weatherError ? "indisponible" : "chargement" };
    return { snow: !!weather.snow, source: "open-meteo" };
  }
  function nextEvents(from) {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const iso = addDays(from, i);
      DATA.events.filter((e) => e.weekday === weekday(iso)).forEach((e) => out.push({ ...e, iso, today: i === 0 }));
    }
    return out;
  }

  function answer(q) {
    const s = q.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    const bits = [];
    if (/matafan|\bdj\b|vendredi/.test(s)) bits.push(eventAnswer(5));
    if (/lionel|tuez|accordeon|mercredi/.test(s)) bits.push(eventAnswer(3));
    if (/neige|terrasse/.test(s)) bits.push(snowAnswer());
    if (/menage|netto|runner/.test(s)) bits.push(cleanAnswer(parisToday()));
    if (/ferme|plus tard|lendemain/.test(s)) bits.push(offsetAnswer());
    if (/plat/.test(s)) bits.push(state.plat ? `Plat du jour : ${state.plat.title}. ${state.plat.detail || ""}`.trim() : "Le plat du jour n'est pas saisi.");
    if (/vin|carte/.test(s)) bits.push(state.vins.length ? `Vins saisis : ${state.vins.map((v) => v.nom).join(", ")}.` : "La carte des vins n'est pas saisie.");
    if (/manque/.test(s)) bits.push(state.manques.length ? `Manques sur ce téléphone : ${state.manques.map((m) => m.label + (m.done ? " (coché)" : "")).join(", ")}.` : "Aucun manque saisi sur ce téléphone.");
    DATA.roster.forEach((p) => {
      const last = (p.last || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
      const first = (p.first || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
      if ((last.length > 2 && s.includes(last)) || (first.length > 2 && s.includes(first))) bits.push(personAnswer(p));
    });
    if (!bits.length) return "Je n'ai pas trouvé ça dans les données de l'application. Aucune clé LLM n'est configurée : je n'invente pas de réponse.";
    return `${bits.join("\n\n")}\n\nRecherche dans les données de l'app. Aucune clé LLM n'est configurée.`;
  }
  function eventAnswer(wd) {
    const ev = DATA.events.find((e) => e.weekday === wd);
    const hit = nextEvents(parisToday()).find((e) => e.weekday === wd);
    return `${ev.title}, chaque ${wd === 5 ? "vendredi" : "mercredi"}${hit ? `, prochain : ${frDate(hit.iso)}` : ""}. Tenue : ${ev.dress}. C'est une entrée du calendrier, pas une notification.`;
  }
  function snowAnswer() {
    const s = snowNow();
    if (s.source === "indisponible") return "La météo de La Toussuire n'est pas joignable. Le manager peut forcer neige ou clair sur ce téléphone. Rien n'est envoyé.";
    if (s.source === "chargement") return "La météo de La Toussuire est en cours de lecture.";
    return s.snow
      ? `Neige retenue (${s.source === "manuel" ? "choix manuel sur ce téléphone" : "Open-Meteo, La Toussuire"}). Consigne appliquée à l'écran : plier la terrasse.`
      : `Pas de neige retenue (${s.source === "manuel" ? "choix manuel sur ce téléphone" : "Open-Meteo, La Toussuire"}). La consigne terrasse n'est pas active.`;
  }
  function cleanAnswer(iso) {
    const plan = dayPlan(iso);
    if (!plan.cleaning) return `${frDate(iso)} : aucun chef de rang n'a d'heure d'arrivée dans l'horaire d'exemple.`;
    const runner = plan.cleaning.runner ? nameOf(plan.cleaning.runner) : "le second runner n'est pas pourvu";
    return `${frDate(iso)} : ménage attribué à ${nameOf(plan.cleaning.chef)} (premier chef de rang, arrivée ${plan.cleaning.chef.time}) avec ${runner}. Calculé sur l'horaire d'exemple.`;
  }
  function offsetAnswer() {
    const today = parisToday();
    const lines = DATA.roster.map((p) => {
      const a = arrival(p.id, today);
      return a && a.offset ? `${nameOf(p)} : arrivée ${a.time} au lieu de ${a.base}, parce qu'il ou elle ferme avec Lou la veille.` : null;
    }).filter(Boolean);
    return (lines.length ? lines.join(" ") : "Aujourd'hui, personne n'a d'arrivée décalée.") + " Le décalage est de 1 h 30 dans le planning. Ce n'est pas un message envoyé.";
  }
  function personAnswer(p) {
    const a = arrival(p.id, parisToday());
    const when = a ? ` Aujourd'hui, horaire d'exemple : ${a.time}${a.offset ? ` (base ${a.base}, +1 h 30)` : ""}.` : " Pas d'heure d'exemple aujourd'hui.";
    return `${nameOf(p)} · ${p.role}${p.statut === "en_attente" ? " · en attente, pas invité" : ""}.${when}`;
  }

  async function maybeLlm(question) {
    const endpoint = window.GESTO_LLM_ENDPOINT;
    if (!endpoint) return null;
    const facts = answer(question);
    if (facts.startsWith("Je n'ai pas trouvé")) return null;
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, facts }) });
      if (!res.ok) return null;
      const json = await res.json();
      return typeof json.answer === "string" ? `${json.answer}\n\nRéponse du modèle branché, à partir des données de l'app.` : null;
    } catch { return null; }
  }

  function entered() { return !!(urlTest || state.account || state.patronUnlocked); }
  function render() {
    if (!DATA) return;
    if (!entered()) { document.getElementById("app").innerHTML = onboard(); return; }
    const me = persona();
    const snow = snowNow();
    const terrace = snow.source !== "indisponible" && snow.source !== "chargement" && snow.snow;
    const mine = myRoster();
    document.getElementById("app").innerHTML = `
      <header class="top">
        <span class="test">TEST</span>
        <h1>Le Chamois</h1>
        <p class="who">${urlTest ? "Test chef de rang · pas un compte" : `${esc(me.label)} · ${esc(me.poste)}`}${mine ? ` · liste : ${esc(nameOf(mine))}` : ""}</p>
        ${state.patronUnlocked ? `<label>Tester comme<select class="persona" data-change="viewas"><option value="">${state.account ? "Mon compte" : "Lou · patron"}</option>${VIEWS.map((v) => `<option value="${v.id}" ${state.viewAs === v.id ? "selected" : ""}>${esc(v.label)}</option>`).join("")}</select></label>` : `<button type="button" class="btn ghost" data-act="ask-pin">Mode patron</button>`}
      </header>
      <p class="local">${urlTest ? "Mode test par l'adresse. Aucun compte n'est créé." : state.account ? "Compte enregistré sur ce téléphone — synchronisation équipe pas encore active. Lou ne reçoit pas cette inscription." : "Manques, réunions et planning modifié : enregistré sur ce téléphone seulement."}</p>
      <main>${askingPin ? pinForm() : renderView(me, snow, terrace)}</main>
      <nav class="nav">${TABS.map(([id, label, ic]) => `<button type="button" data-act="tab" data-tab="${id}" class="${view === id ? "on" : ""}">${icon(ic)}<span>${label}</span></button>`).join("")}</nav>`;
  }
  function pinForm() {
    return `<section class="card"><h2>Code patron</h2><p class="muted">Protection faible : le code est dans data.json, lisible par qui ouvre les fichiers. Rien n'est envoyé à Lou.</p>${pinError ? `<p role="alert">${esc(pinError)}</p>` : ""}<form data-form="pin"><label>Code<input name="pin" type="password" inputmode="numeric" required></label><button class="btn">Ouvrir</button></form><button type="button" class="btn ghost" data-act="close-pin">Fermer</button></section>`;
  }
  function onboard() {
    const roles = [...new Set(DATA.roster.filter((p) => p.statut === "embauche").map((p) => p.role))];
    return `<header class="top"><span class="test">TEST</span><h1>Le Chamois</h1><p class="who">Première ouverture sur ce téléphone</p></header>
      <main><section class="card"><h2>Créer mon accès</h2><p class="muted">Compte enregistré sur ce téléphone — synchronisation équipe pas encore active. Lou ne reçoit pas les inscriptions.</p>
      ${accountError ? `<p role="alert">${esc(accountError)}</p>` : ""}
      <form data-form="compte"><label>Nom<input name="name" required autocomplete="name"></label><label>Email ou téléphone<input name="contact" required></label><label>Poste<select name="role" required><option value="">Choisir</option>${roles.map((r) => `<option>${esc(r)}</option>`).join("")}</select></label><button class="btn">Enregistrer sur ce téléphone</button></form>
      <button type="button" class="btn ghost" data-act="ask-pin">J'ai le code patron</button></section>${askingPin ? pinForm() : ""}</main>`;
  }
  function renderView(me, snow, terrace) {
    if (view === "carte") return viewCarte();
    if (view === "manques") return viewManques();
    if (view === "planning") return viewPlanning();
    if (view === "reunion") return viewReunion(me);
    if (view === "question") return viewQuestion();
    return viewHome(snow, terrace);
  }
  function viewHome(snow, terrace) {
    const today = parisToday();
    const plan = dayPlan(today);
    const upcoming = nextEvents(today).slice(0, 2);
    const gap = gaps().filter((g) => g.manque > 0);
    const temp = weather && Number.isFinite(weather.temp) ? `${weather.temp} °C` : "";
    return `
      <section class="card"><h2>${esc(frDate(today))}</h2>
        <p class="muted">${snow.source === "open-meteo" ? `Météo La Toussuire, Open-Meteo${temp ? `, ${esc(temp)}` : ""}.` : snow.source === "manuel" ? "Météo forcée à la main sur ce téléphone." : snow.source === "chargement" ? "Lecture de la météo…" : "Météo non joignable."}</p>
        ${terrace ? `<p><b>Plier la terrasse.</b> La règle neige est active.</p>` : `<p class="muted">${snow.source === "indisponible" ? "Terrasse : non décidée, météo absente." : "Terrasse : la règle neige n'est pas active."}</p>`}
        ${canEdit() ? meteoSwitch() : ""}
      </section>
      <section class="card"><h2>Animations</h2>${upcoming.map((e) => `<div class="row"><div><span class="tag rec">Chaque ${e.weekday === 5 ? "vendredi" : "mercredi"}</span><p><b>${esc(e.title)}</b></p><p class="muted">${esc(frDate(e.iso))}${e.today ? " · aujourd'hui" : ""} · tenue ${esc(e.dress)}</p></div></div>`).join("")}</section>
      <section class="card"><h2>Mon poste</h2>${mineCard()}</section>
      <section class="card"><h2>Ménage du jour</h2>${plan.cleaning ? `<p><b>${esc(nameOf(plan.cleaning.chef))}</b>, arrivée ${esc(plan.cleaning.chef.time)}, avec ${plan.cleaning.runner ? esc(nameOf(plan.cleaning.runner)) : "le runner manquant"}.</p><p class="muted">Premier chef de rang du planning d'exemple. Calculé, pas envoyé.</p>` : `<p class="muted">Pas d'horaire d'exemple aujourd'hui.</p>`}</section>
      <section class="card"><h2>Plat du jour</h2>${state.plat ? `<p><b>${esc(state.plat.title)}</b></p><p class="muted">${esc(state.plat.detail || "")}</p>` : `<p class="muted">Pas encore saisi.</p>`}</section>
      <section class="card"><h2>Écarts</h2>${gap.filter((g) => g.manque).map((g) => `<p>${esc(g.poste)} : ${g.n}/${g.cible}. ${g.suggestion ? `${esc(g.suggestion.name)} (${esc(g.suggestion.label)}). Ne compte pas comme une embauche.` : `Il manque ${g.manque}.`}</p>`).join("")}<p class="muted">En attente : Fabrice, Frère de Lou, Titi. Titi et Sébastien Thilliez restent deux lignes.</p></section>`;
  }
  function mineCard() {
    const mine = myRoster();
    const today = parisToday();
    if (urlTest) return `<p>Tu regardes le poste chef de rang en hiver. Ce n'est pas un compte, et ce n'est personne de la liste.</p><p class="muted">Tâches du poste : tenue des animations, terrasse s'il neige, ménage si tu es le premier chef de rang arrivé.</p>`;
    if (!mine) return `<p class="muted">${state.account ? "Ce nom n'est pas dans la liste. Pas d'horaire personnel." : "Pas d'horaire personnel pour cette vue."}</p>`;
    const a = arrival(mine.id, today);
    return `<p><b>${esc(nameOf(mine))}</b> · ${esc(mine.role)}</p>${a ? `<p>Arrivée aujourd'hui : <b>${esc(a.time)}</b>${a.offset ? ` (base ${esc(a.base)}, +1 h 30 car fermeture avec Lou la veille)` : ""}.</p>` : `<p class="muted">Pas d'heure d'exemple aujourd'hui.</p>`}`;
  }
  function meteoSwitch() {
    return `<div class="switch" style="margin-top:10px">${[["auto", "Météo"], ["neige", "Forcer neige"], ["clair", "Forcer clair"]].map(([id, label]) => `<button type="button" data-act="meteo" data-mode="${id}" class="${state.meteoForce === id ? "on" : ""}">${label}</button>`).join("")}</div>`;
  }
  function viewCarte() {
    const edit = canEdit();
    return `<section class="card"><h2>Plat du jour</h2>${state.plat ? `<p><b>${esc(state.plat.title)}</b></p><p>${esc(state.plat.detail || "")}</p>` : `<p class="muted">Rien à lire.</p>`}${edit ? `<form data-form="plat"><label>Titre<input name="title" required value="${esc(state.plat?.title || "")}"></label><label>Détail<textarea name="detail">${esc(state.plat?.detail || "")}</textarea></label><button class="btn">Enregistrer le plat</button></form>` : ""}</section>
      <section class="card"><h2>Carte des vins</h2>${state.vins.length ? state.vins.map((v) => `<article class="row"><div><b>${esc(v.nom)}</b><p class="muted">${esc(v.detail || "")}</p></div>${edit ? `<button class="btn ghost small" type="button" data-act="del-vin" data-id="${esc(v.id)}">Retirer</button>` : ""}</article>`).join("") : `<p class="muted">Aucune référence saisie.</p>`}${edit ? `<form data-form="vin"><label>Vin<input name="nom" required></label><label>Précision<input name="detail" placeholder="cépage, verre ou bouteille"></label><button class="btn">Ajouter la référence</button></form>` : ""}</section>`;
  }
  function viewManques() {
    return `<section class="card"><h2>Manques</h2><p class="muted">${canEdit() ? "Tu coches ce que tu as vu." : "Tu ajoutes. Le manager coche."}</p>
      <form data-form="manque"><label>Article<input name="label" required placeholder="serviettes, fondant…"></label><button class="btn">Ajouter le manque</button></form>
      ${state.manques.map((m) => `<label class="check row"><input type="checkbox" data-act="manque" data-id="${esc(m.id)}" ${m.done ? "checked" : ""} ${canEdit() ? "" : "disabled"}><span class="${m.done ? "done" : ""}">${esc(m.label)}</span></label>`).join("") || `<p class="muted">Liste vide sur ce téléphone.</p>`}</section>`;
  }
  function viewPlanning() {
    const days = [...Array(7)].map((_, i) => addDays(parisToday(), i - weekday(parisToday()) + 1));
    const plan = dayPlan(day);
    const stations = ["salle", "cuisine", "bar", "snack", "autre"];
    return `<div class="days">${days.map((iso) => `<button type="button" data-act="day" data-day="${iso}" class="${iso === day ? "on" : ""}">${esc(frDate(iso).slice(0, 3))}<br>${iso.slice(8)}</button>`).join("")}</div>
      <section class="card"><h2>${esc(frDate(day))}</h2>
        ${plan.events.map((e) => `<p><span class="tag rec">Calendrier</span> ${esc(e.title)} · ${esc(e.dress)}</p>`).join("") || `<p class="muted">Pas d'animation ce jour.</p>`}
        <p class="muted">Horaires d'exemple pour voir les règles, pas le planning réel de la saison.</p>
      </section>
      ${stations.map((st) => {
        const list = plan.people.filter((p) => p.station === st);
        if (!list.length) return "";
        return `<section class="card"><h2>${esc(st)}</h2>${list.map((p) => `<div class="row"><div><b>${esc(nameOf(p))}</b><p class="muted">${esc(p.role)}${p.offset ? ` · base ${esc(p.base)} + 1 h 30` : ""}</p>${closedWithLou(p.id, day) ? `<p class="muted">Ferme avec Lou aujourd'hui</p>` : ""}</div><div><b>${esc(p.time)}</b>${canEdit() ? `<button class="btn ghost small" type="button" data-act="ferme" data-id="${esc(p.id)}">${closedWithLou(p.id, day) ? "Retirer la fermeture" : "Ferme avec Lou"}</button>` : ""}</div></div>`).join("")}</section>`;
      }).join("")}
      <section class="card ${plan.cleaning ? "okbox" : ""}"><h2>Ménage</h2>${plan.cleaning ? `<p>${esc(nameOf(plan.cleaning.chef))} avec ${plan.cleaning.runner ? esc(nameOf(plan.cleaning.runner)) : "runner manquant"}.</p>` : `<p class="muted">Personne à attribuer.</p>`}</section>`;
  }
  function viewReunion(me) {
    const people = DATA.roster.map((p) => `<option value="${esc(p.id)}">${esc(nameOf(p))}</option>`).join("");
    const form = me.kind === "employe"
      ? `<form data-form="reunion-lou"><label>Mot pour Lou<textarea name="note" required></textarea></label><button class="btn">Demander un rendez-vous avec Lou</button></form>`
      : `<form data-form="reunion-groupe"><label>Avec<select name="to"><option value="salle">Salle</option><option value="cuisine">Cuisine</option><option value="les-deux">Salle et cuisine</option><option value="personne">Une personne</option></select></label><label>Personne<select name="person">${people}</select></label><label>Mot<textarea name="note"></textarea></label><button class="btn">Enregistrer la demande</button></form>`;
    const who = { lou: "Lou", salle: "la salle", cuisine: "la cuisine", "les-deux": "salle et cuisine" };
    return `<section class="card"><h2>Rendez-vous</h2><p class="muted">Demande dans l'app. Aucune notification.</p>${form}
      ${state.reunions.map((r) => `<div class="row"><div><b>${esc(r.fromLabel)}</b> → ${esc(who[r.to] || r.toLabel)}<p class="muted">${esc(r.note || "")}</p></div></div>`).join("") || `<p class="muted">Aucune demande sur ce téléphone.</p>`}</section>`;
  }
  function viewQuestion() {
    return `<section class="card"><h2>Question</h2><p class="muted">Je lis seulement les données de l'app. Sans clé LLM, je le dis et je n'invente rien.</p>
      <form data-form="question"><label>Ta question<input name="q" value="${esc(botQ)}" required></label><button class="btn">Chercher</button></form>
      <div class="switch" style="margin-top:8px"><button type="button" data-act="ask" data-q="Quand vient DJ Matafan ?">DJ</button><button type="button" data-act="ask" data-q="Qui fait le ménage ?">Ménage</button><button type="button" data-act="ask" data-q="Quel est le salaire ?">Hors sujet</button></div>
      ${botA ? `<p class="q">${esc(botA)}</p>` : ""}</section>`;
  }

  function onClick(e) {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    if (b.dataset.act === "tab") { view = b.dataset.tab; render(); }
    if (b.dataset.act === "day") { day = b.dataset.day; render(); }
    if (b.dataset.act === "meteo" && canEdit()) { state.meteoForce = b.dataset.mode; saveState(); render(); }
    if (b.dataset.act === "manque" && canEdit()) {
      const item = state.manques.find((m) => m.id === b.dataset.id);
      if (item) item.done = b.checked; saveState(); render();
    }
    if (b.dataset.act === "del-vin" && canEdit()) { state.vins = state.vins.filter((v) => v.id !== b.dataset.id); saveState(); render(); }
    if (b.dataset.act === "ferme" && canEdit()) {
      state.ferme[day] = state.ferme[day] || {};
      state.ferme[day][b.dataset.id] = !closedWithLou(b.dataset.id, day);
      saveState(); render();
    }
    if (b.dataset.act === "ask") { botQ = b.dataset.q; ask(botQ); }
    if (b.dataset.act === "ask-pin") { askingPin = true; pinError = ""; render(); }
    if (b.dataset.act === "close-pin") { askingPin = false; pinError = ""; render(); }
  }
  function onSubmit(e) {
    const form = e.target.closest("form");
    if (!form) return;
    e.preventDefault();
    const fd = new FormData(form);
    if (form.dataset.form === "plat" && canEdit()) state.plat = { title: String(fd.get("title") || "").trim(), detail: String(fd.get("detail") || "").trim() };
    if (form.dataset.form === "vin" && canEdit()) state.vins.push({ id: uid(), nom: String(fd.get("nom") || "").trim(), detail: String(fd.get("detail") || "").trim() });
    if (form.dataset.form === "manque") {
      const label = String(fd.get("label") || "").trim();
      if (label) state.manques.push({ id: uid(), label, done: false });
    }
    if (form.dataset.form === "reunion-lou") state.reunions.unshift({ id: uid(), fromLabel: persona().label, to: "lou", toLabel: "Lou", note: String(fd.get("note") || "").trim() });
    if (form.dataset.form === "reunion-groupe" && canEdit()) {
      const to = String(fd.get("to"));
      const personId = String(fd.get("person") || "");
      const who = person(personId);
      state.reunions.unshift({ id: uid(), fromLabel: persona().label, to: to === "personne" ? personId : to, toLabel: to === "personne" && who ? nameOf(who) : to, note: String(fd.get("note") || "").trim() });
    }
    if (form.dataset.form === "question") { botQ = String(fd.get("q") || ""); ask(botQ); return; }
    if (form.dataset.form === "pin") {
      if (String(fd.get("pin") || "") === String(DATA.patronPin)) { state.patronUnlocked = true; state.viewAs = "patron"; urlTest = null; askingPin = false; pinError = ""; saveState(); }
      else pinError = "Code incorrect.";
      render(); return;
    }
    if (form.dataset.form === "compte") {
      const name = String(fd.get("name") || "").trim();
      const contact = String(fd.get("contact") || "").trim();
      const role = String(fd.get("role") || "");
      const okContact = contact.includes("@") || contact.replace(/\D/g, "").length >= 8;
      if (!name || !role || !okContact) { accountError = "Nom, poste, et un email ou un téléphone."; render(); return; }
      const found = matchRoster(name);
      state.account = { name, contact, role, rosterId: found ? found.id : null };
      state.viewAs = null;
      askingPin = false;
      pinError = "";
      accountError = "";
      saveState(); render(); return;
    }
    saveState(); render();
  }
  function onChange(e) {
    if (e.target.dataset.change === "viewas") {
      state.viewAs = e.target.value || null;
      if (state.viewAs) urlTest = null;
      saveState(); render();
    }
  }
  async function ask(q) {
    const llm = await maybeLlm(q);
    botA = llm || answer(q);
    render();
  }
  async function refreshWeather() {
    try {
      const { lat, lon } = DATA.meteo;
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,snowfall,temperature_2m&timezone=Europe%2FParis`);
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const code = json.current.weather_code;
      weather = { snow: SNOW.has(code) || (json.current.snowfall || 0) > 0, temp: json.current.temperature_2m, code };
      weatherError = "";
    } catch (err) {
      weather = null;
      weatherError = err.message || "erreur";
    }
    render();
  }

  document.addEventListener("click", onClick);
  document.addEventListener("submit", onSubmit);
  document.addEventListener("change", onChange);
  fetch(new URL("./data.json", document.baseURI)).then((r) => { if (!r.ok) throw new Error("data"); return r.json(); }).then((data) => {
    DATA = data;
    state = loadState();
    const q = new URLSearchParams(location.search);
    if (q.get("test") === "1" && q.get("role") === "chef_de_rang") urlTest = { id: "url-chef", label: "Test chef de rang", poste: "chef de rang", kind: "employe" };
    day = parisToday();
    render();
    refreshWeather();
    if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {});
  }).catch(() => {
    document.getElementById("app").textContent = "Impossible de lire data.json. Ouvre ce dossier via un petit serveur, pas en fichier local.";
  });
})();
