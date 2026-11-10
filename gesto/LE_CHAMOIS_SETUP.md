# Mettre Gesto en service pour Le Chamois

Ce guide prépare un **déploiement de prévisualisation** (Preview Vercel), pas le site public déjà en ligne. Ne remplace pas https://gesto-management.vercel.app et ne règle pas les variables de **Production**.

Deux choses coexistent dans le dépôt :

- `gesto-management/` : le pilote public (pages statiques, données dans le navigateur). Il sert à montrer le produit. **N'y mets pas la vraie équipe.**
- `gesto/` : l'outil du restaurant. Comptes séparés, base Postgres (Supabase), fiches, brouillons de contrat, échéances, consignes. C'est celui-ci que Lou et l'équipe utilisent.

Aucun salarié n'est créé tout seul. La liste vient de toi.

## Boîte d'équipe, tout de suite, sans Supabase

Ouvre `/le-chamois` dans l'application. Le bandeau dit **Mode démo locale**.

- Le seul compte déjà là est le patron de démonstration : `lou@chamois.demo` / `demo-lou`. Aucun salarié n'est inventé.
- Le patron invite par un lien (rôle Manager ou Salarié), envoie une consigne (priorité, date facultative, tout le monde, un rôle ou une personne) et voit qui a lu.
- La personne ouvre le lien dans le même navigateur, choisit un mot de passe, lit, répond, marque fait, ou envoie un rapport.
- Le patron désactive un compte. Un compte désactivé ne rentre plus.
- Les managers n'envoient des consignes que si le patron coche l'autorisation.
- **Aucun e-mail n'est envoyé.** Il n'y a pas de fournisseur. Le temps réel entre deux téléphones n'existe pas dans cette démo : tout reste dans ce navigateur. Le bouton « Effacer la démo » vide ces données.
- N'y mets pas de vraies personnes. Les mots de passe y sont en clair. Pas de salaire, pas de santé, pas de pièce d'identité dans cette boîte.

Pour de vrais comptes, suis la suite et lance aussi `gesto/supabase/migrations/002_chamois_comms.sql`. Ça crée les tables `chamois_*` avec les droits par restaurant (RLS). Renseigne alors, en Preview seulement :

```text
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la clé anon, jamais la service_role
```

L'écran `/le-chamois` reste en démo locale tant que ces variables ne sont pas là : on ne simule pas une base distante. Les e-mails d'invitation ne partiront qu'après avoir réglé le SMTP dans Supabase Auth (Authentication → Emails). Sans ce réglage, même en production, il faudra transmettre le lien à la main. Le temps réel Supabase n'est pas activé dans le SQL : ne le promets pas à l'équipe.

Avant d'y mettre l'équipe réelle, Lou doit : informer les personnes (finalité, durée, droits d'accès et d'effacement), signer les conditions Supabase, et vérifier qu'aucune donnée sensible n'est demandée. L'identité de l'éditeur (SIREN, adresse) n'est toujours pas renseignée.

## 1. Créer le projet Supabase

1. Va sur https://supabase.com et crée un projet. Région conseillée : **Europe (eu-west)**.
2. Choisis un mot de passe de base de données et garde-le dans un gestionnaire de mots de passe, pas dans le code.
3. Attends que le projet soit prêt.
4. Ouvre **SQL Editor → New query**.
5. Colle tout le fichier `gesto/supabase/migrations/001_init.sql`, puis **Run**.
6. Vérifie dans **Table Editor** que les tables `users`, `companies`, `employees`, `roster`, `directives` et `staff_messages` existent.

L'application recrée ces tables si elles manquent. Lancer le SQL d'abord permet de les voir avant la première connexion.

Ne active pas l'API REST publique sur ces tables et n'utilise pas la clé `anon` dans le navigateur. Gesto parle à Postgres uniquement depuis le serveur.

## 2. Récupérer la chaîne de connexion

1. **Project Settings → Database → Connection string**.
2. Choisis **URI** et le mode **Transaction pooler** (port **6543**), adapté à Vercel.
3. Remplace `[YOUR-PASSWORD]` par le mot de passe du projet. La chaîne ressemble à :

```text
postgresql://postgres.xxxx:MOT_DE_PASSE@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```

4. Ne commite pas cette chaîne. Ne la mets pas dans un fichier du dépôt.

## 3. Préparer les secrets

Sur ta machine, dans un terminal :

```bash
openssl rand -hex 32
```

Lance-le deux fois. La première valeur sera `GESTO_DATA_KEY` (elle chiffre les fiches). La seconde sera `GESTO_SESSION_SECRET`.

Une troisième fois, plus court, pour le cron :

```bash
openssl rand -hex 24
```

Ce sera `CRON_SECRET`.

Si tu changes `GESTO_DATA_KEY` plus tard, les fiches déjà enregistrées deviennent illisibles. Note la clé au même endroit que le mot de passe Supabase.

## 4. Variables sur Vercel, Preview seulement

1. Crée un projet Vercel **séparé** de celui qui sert le site public, ou utilise une branche de prévisualisation sans toucher au domaine `gesto-management.vercel.app`.
2. **Root Directory** : `gesto`.
3. Framework : Next.js. La commande de build par défaut (`next build`) suffit.
4. **Settings → Environment Variables**. Pour chaque variable, coche **Preview** uniquement. Décoche Production.

| Nom | Valeur |
| --- | --- |
| `DATABASE_URL` | la chaîne pooler de l'étape 2 |
| `GESTO_DATA_KEY` | le premier secret |
| `GESTO_SESSION_SECRET` | le second secret |
| `CRON_SECRET` | le troisième secret |

Ne définis pas `STRIPE_SECRET_KEY`, `STRIPE_PRICE_COURS`, `STRIPE_PRICE_ABO`, ni `RESEND_API_KEY` tant que le paiement et l'e-mail ne sont pas vraiment branchés. Sans elles, l'écran des tarifs affiche **Paiement non encore activé** et les rappels restent dans l'application.

Ne définis pas `GESTO_EXTRAS`. L'espace équipe fonctionne sans. La page de paiement `/offres` reste fermée.

Les notifications sur le téléphone (facultatif, plus tard) : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:ton-adresse`, générées avec `npx web-push generate-vapid-keys`. Preview seulement, elles aussi.

5. Déploie la prévisualisation **toi-même** depuis la branche, quand tu le décides. Ce dépôt ne le fait pas.

Le cron du fichier `gesto/vercel.json` n'est exécuté par Vercel que sur un déploiement de production. Sur une preview, les rappels du jour se voient dans **Échéances** dès que la date est atteinte. Pour forcer le passage du robot de rappel sur la preview :

```bash
curl -H "Authorization: Bearer TON_CRON_SECRET" https://TON-APERCU.vercel.app/api/rappels
```

Sans clé d'e-mail, le statut sera `non_envoye`. Ce n'est pas un envoi.

## 5. Créer le compte patron de Lou et le restaurant

Deux chemins. Le script est le plus net : il crée **Le Chamois** et **aucun salarié**.

Dans `gesto/`, avec Node.js et les dépendances installées (`npm install`) :

```bash
cd gesto
export DATABASE_URL="postgresql://..."
export LOU_EMAIL="adresse-de-lou@example.com"
export LOU_PASSWORD="un-mot-de-passe-d-au-moins-8-caracteres"
export LOU_FIRST_NAME="Lou"
node scripts/bootstrap-le-chamois.cjs
```

Remplace l'adresse par la vraie boîte de Lou. Le mot de passe ne doit pas rester dans l'historique du terminal plus que nécessaire : tu peux aussi les passer juste pour la commande, sans les écrire dans un fichier.

Le script affiche le code du restaurant. Aucune fiche n'est créée. L'effectif enregistré est « 0 » (personne n'est encore saisi) et la saison est « saisonnier » : corrige ces deux réponses dans **Paramètres** si elles ne collent pas.

Relancer le script ne duplique pas le restaurant et ne change pas le mot de passe.

Autre chemin, sans script : ouvre la preview, va sur `/inscription`, crée le compte avec le prénom Lou, puis réponds au diagnostic en nommant le commerce **Le Chamois**.

## 6. Ajouter et inviter l'équipe

1. Connecte-toi en patron. Ouvre **Équipe**.
2. La liste est vide. Ajoute une personne (prénom, nom, rôle, email ou téléphone) ou colle un CSV.

En-têtes acceptés, virgule ou point-virgule :

```text
prenom;nom;role;telephone
```

ou `email` à la place de `telephone`. Une ligne d'exemple, à effacer avant d'importer les vraies personnes :

```text
prenom;nom;role;telephone
EXEMPLE;A_EFFACER;serveur;0600000000
```

3. Chaque personne reçoit un **code personnel**. Gesto n'envoie aucun e-mail ni SMS : tu transmets le code toi-même (papier, message que tu envoies de ton côté).
4. La personne ouvre `/rejoindre` sur son téléphone, entre le code, choisit son email de connexion et un mot de passe.
5. Elle voit les consignes, peut répondre et envoyer un rapport. Le pointage n'apparaît qu'après **Compléter la fiche** (dates, heures, salaire). Ne remplis pas une fiche avec un salaire inventé.
6. Le code du restaurant (affiché en haut de la page Équipe) sert seulement si la fiche existe déjà : la personne doit alors retaper son nom tel qu'il est écrit sur la fiche.

## 7. Consignes, brouillons, échéances

- **Consignes** : le patron écrit. L'équipe répond ou dépose un rapport. Tout reste dans le restaurant.
- **Fiche** : génère un brouillon (contrat, fiche horaire, checklist DPAE). Le statut passe à **À relire**, puis **Validé par le patron** après relecture. Ce n'est pas un contrat à signer. La convention collective et les clauses obligatoires sont signalées. Le SIREN de l'employeur n'est pas inventé.
- **Échéances** : la DPAE est posée à la date de début dès la fiche. Le rappel du jour est sur la page Échéances. L'historique dit si un e-mail est parti ou non.

## 8. Nettoyer ou recommencer

Depuis `gesto/`, vers la même `DATABASE_URL`.

Effacer l'équipe, les fiches, les consignes, les documents et les échéances, et **garder** le compte patron :

```bash
export DATABASE_URL="postgresql://..."
export LOU_EMAIL="adresse-de-lou@example.com"
export CONFIRM=NETTOYER-LE-CHAMOIS
node scripts/reset-le-chamois.cjs
```

Effacer aussi le compte et le restaurant :

```bash
export CONFIRM=SUPPRIMER-COMPTE
node scripts/reset-le-chamois.cjs
```

Ça ne touche pas un autre restaurant qui aurait un autre email. Pour tout supprimer côté Supabase : **Project Settings → General → Delete project**.

## 9. Ce qui n'est pas fait par ce guide

- Pas de paiement. Les prix affichés sur `/tarifs` restent **Le cours 47 €** (paiement unique) et **Fais-le pour moi 24 €/mois**, avec la mention **Paiement non encore activé**.
- Pas d'e-mail de rappel tant que `RESEND_API_KEY` n'est pas posée, en Preview seulement, le jour où l'envoi sera vraiment voulu.
- Pas de SIREN, pas de raison sociale : les mentions légales gardent des emplacements vides.
- Le domaine public actuel reste le pilote statique tant que tu ne le changes pas toi-même.
