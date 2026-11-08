# Rapport d'état — Gestro Studio / Gesto

Date : 8 novembre 2026. Ce document a deux parties de statut différent : la **partie A est déclarée par Lou** (non vérifiée par Claude), la **partie B est vérifiée dans le dépôt** (code + tests relancés le jour même). Ne pas mélanger les deux.

---

## Partie A — Déclaré par Lou (non vérifié dans cette session)

État actuel : le projet Lovable « Gestro Studio » existe mais n'est pas publié, l'accueil y est encore vide. En parallèle, une version HTML complète a été préparée et testée en local, sans publication publique, avec paiements désactivés et indexation bloquée. L'immatriculation INPI a été déposée mais le SIREN n'est pas encore reçu ; les mentions légales publiques restent donc incomplètes et les encaissements doivent rester coupés. Stripe et Revolut Business ne sont pas connectés.

Risques et points de vigilance : ne pas publier de fausses informations légales, ne pas activer de paiements avant validation bancaire, séparer cockpit privé et vitrine publique, conformité juridique à finaliser.

Prochaines étapes : attendre le SIREN, compléter les mentions légales, publier d'abord une vitrine sans paiement, tester Stripe en mode test, puis seulement envisager l'activation publique.

---

## Partie B — Gesto, vérifié dans le dépôt

Source : `gesto/STATE.md`, code de `gesto/`, et `tests/run.sh` relancé le 8 novembre 2026 (base Postgres 16 vierge, résultat : « TOUS LES TESTS PASSENT » puis « PERSISTANCE OK »).

### Prouvé (automatisé)
- Parcours complet : inscription, diagnostic, création d'un salarié (fiche chiffrée), contrat avec alerte sur informations manquantes (convention collective, période d'essai, motif CDD), validation bloquée côté serveur tant que c'est incomplet, version 2 à revalider, validation horodatée dans un journal, téléchargement DOCX seulement après validation.
- Échéance DPAE créée automatiquement ; rappel déclenché dans sa fenêtre de dates (une échéance à 30 jours ne déclenche rien) ; pas de doublon ; 2 notifications par semaine maximum.
- Rappel par notification système (Web Push) : le serveur envoie un message chiffré signé VAPID à un faux service push local ; le lien de la notification ouvre le bon dossier.
- Persistance : après redémarrage du serveur, la fiche salarié, le contrat v2 validé, l'abonnement push et le journal des rappels sont conservés.
- Volume : 24 vérifications (17 de bout en bout + 7 de persistance), mode cœur ; le mode avec fonctions masquées passe aussi.
- Indexation bloquée (le 8 novembre 2026) : en-tête `X-Robots-Tag: noindex`, balise robots et `robots.txt` en `Disallow: /`, vérifiés sur le serveur de production local.
- Les fonctions hors V1 (espace employé, `/offres`, Stripe) sont masquées par défaut (`GESTO_EXTRAS` désactivé) ; leurs pages renvoient une 404.

### Non prouvé
- Affichage réel de la notification sur un téléphone verrouillé (dépend du service push Google/Apple et d'un vrai appareil ; iPhone : Gesto doit être ajouté à l'écran d'accueil).
- Connexion à un vrai projet Supabase (SSL, pooler) ; la migration a été testée sur un Postgres local.
- Paiement Stripe avec de vraies clés, envoi d'email Resend, appel quotidien automatique de `/api/rappels` en ligne.

### Conformité
- Paiement désactivé par défaut. Sans clés Stripe, `/offres` indique que le paiement n'est pas ouvert.
- Mentions légales, CGV, droit de rétractation, politique RGPD : **non rédigées** (la page `/mentions-legales` le dit). Les modèles de documents RH sont à faire relire par un juriste en droit du travail avant tout usage réel.
- En production, l'application refuse de démarrer sans `GESTO_DATA_KEY` (chiffrement des données salariés) et `GESTO_SESSION_SECRET`.

### Incohérences à lever
- Nom : « Gestro Studio » (partie A) contre « Gesto » (ce dépôt). Sont-ce deux projets ou un seul ?
- « 7 pages HTML » et « 14 tests OK » (partie A) : introuvables dans ce dépôt, où les tests sont ceux listés ci-dessus.
- La partie A parle d'une vitrine sans paiement sur Lovable ; le code Gesto est une application Next.js avec comptes et base de données. À clarifier : lequel sera publié, et en quel ordre.

---

## Partie C — Prompt à copier pour une autre IA

> Voici l'état d'une startup. Distingue strictement deux blocs.
>
> **Bloc déclaré (non vérifié)** : projet Lovable « Gestro Studio » non publié, accueil vide ; version HTML locale complète (7 pages, 14 tests annoncés) non publiée, paiements désactivés, indexation bloquée ; INPI déposé, SIREN en attente ; mentions légales incomplètes ; Stripe et Revolut Business non connectés.
>
> **Bloc vérifié (application Gesto, Next.js + Postgres)** : parcours salarié, contrat avec alerte sur informations manquantes, validation journalisée, échéance et rappel par notification Web Push, persistance après redémarrage : 24 vérifications automatisées passent sur Postgres 16 vierge. Non prouvé : notification sur téléphone verrouillé, Supabase réel, Stripe réel, Resend réel. Paiement désactivé par défaut ; CGV, mentions légales et RGPD non rédigés.
>
> Objectif : un site public sans encaissement tant que la conformité n'est pas bouclée. Ne traite comme établi que le bloc vérifié. Liste les risques, les incohérences (nom Gestro/Gesto, deux bases de code possibles) et les prochaines actions prudentes, dans l'ordre. Ne propose aucune activation de paiement avant le SIREN, la validation bancaire et la relecture juridique.

---

## Décisions par défaut prises par Claude (à corriger si faux)
1. « Gestro Studio » et « Gesto » restent deux blocs séparés tant que Lou n'a pas confirmé que c'est le même projet.
2. Ordre de publication : vitrine sans paiement d'abord (comme dans le plan de Lou) ; l'application Gesto reste privée et non indexée.
3. Aucune activation de paiement avant le SIREN, la validation bancaire et la relecture juridique.
