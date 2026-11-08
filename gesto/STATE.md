# STATE — Gesto V1

Dossier : `gesto/` (Next.js 15 App Router, TypeScript, Tailwind). Lancer : `npm i && npm run dev`.
Test : `npm run build`, démarrer `next start -p 3100` avec `CRON_SECRET=testsecret` et un `GESTO_DATA_DIR` vierge, puis ``tests/run.sh 0` (cœur V1) ou `tests/run.sh 1` (avec extras) — lance serveur + base vierge + test Playwright.

## Fonctionnel et testé (le test de bout en bout passe)
- Accueil, chapitre 1 gratuit, page « ce que Gesto fait / ne fait pas ».
- Inscription/connexion (scrypt + cookie signé), consentements CGV / stats séparés.
- Diagnostic une question par écran → entreprise + suggestions.
- Tableau de bord 4 tuiles. Nouveau salarié (6 questions) → contrat, fiche horaire, checklist DPAE (DOCX).
- Relecture, validation horodatée (journal), téléchargement refusé tant que non validé.
- Échéances + rappels (`/api/rappels`, cron protégé, 2 notifs/semaine max). Échéance DPAE créée automatiquement.
- Espace employé : invitation par code, consigne, FAQ, pointage par bouton (sans géolocalisation).
- Données salariés chiffrées AES-256-GCM. Erreurs journalisées (table `errors`).

## Branché mais inactif sans clés (rien de simulé)
- Stripe : `/offres`, `/api/checkout`, `/api/webhook` (clés + IDs de prix en env). Sans clés : message « paiement pas encore ouvert ». NON testé avec Stripe réel.
- Emails Resend : sans clé, le rappel est consigné « non_envoye ». NON testé avec Resend réel.

## Écarts avec le prompt (à décider)
- Stockage : (résolu en 0.3.0) Stockage migré SQLite → Postgres (compatible Supabase).
- Écrans V2 non construits (verrou 10 commerçants). Rails : `companies.modules`, `users.role`.

## CONSIGNE ABSOLUE (re-précisée par Lou) — statut honnête
Le test de bout en bout n'est PAS encore validé :
- OK automatisé : salarié → contrat à relire → validation → échéance → rappel déclenché dans sa fenêtre de dates (et pas avant).
- MANQUE : le rappel n'est pas un « vrai » rappel tant qu'aucune clé Resend n'est branchée (statut `non_envoye`), et Lou ne l'a pas encore vu fonctionner.
- Périmètre dépassé avant cette consigne : espace employé, /offres + Stripe, chapitre 1. À masquer derrière un indicateur ou à retirer si Lou le demande. Aucune autre brique ne démarre.

## Décision (Lou : « à toi de voir »)
Extras (espace employé, /offres, Stripe) masqués par défaut : `GESTO_EXTRAS=1` pour les activer. Cœur V1 testé dans les deux modes. Reste à valider : vrai email (clé Resend) + démonstration à Lou.

## Les 3 blocs V1 verrouillés — preuves (commande : `tests/run.sh 0`, base vierge, ~1 min)
1. Saisie salarié persistante : fiche créée, chiffrée, retrouvée après redémarrage du serveur (test `persist.cjs`).
2. Contrat avec alerte : infos manquantes (convention collective, période d'essai, motif CDD) → alerte rouge, validation et téléchargement bloqués côté serveur ; compléter → version 2 à revalider, journal horodaté.
3. Rappel : échéance DPAE → à la date, notification système Web Push vers l'appareil abonné, lien `/echeances?id=…` qui ouvre le bon dossier ; repli email (Resend) ; sinon statut `non_envoye`, jamais faussement envoyé. 2 notifications/semaine max, pas de doublon.

## Ce qui est prouvé / pas prouvé
- PROUVÉ (automatisé) : le serveur Gesto envoie un message Web Push chiffré, signé VAPID, au service push (faux service HTTPS local) ; abonnement, journal et dossier persistent après redémarrage.
- NON PROUVÉ : affichage réel sur téléphone verrouillé. Il dépend du service push du constructeur (FCM/Apple) et d'un vrai appareil. À tester par Lou : voir ci-dessous. iPhone : Gesto doit être ajouté à l'écran d'accueil (iOS 16.4+).
- NON FAIT : migration Supabase (obligatoire avant mise en ligne ; SQLite ne tient pas sur Vercel), cron quotidien en ligne, clé Resend (repli email), icône PNG pour iOS.

## Test réel sur téléphone (à faire par Lou)
1. `npx web-push generate-vapid-keys` → VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY dans `.env.local`, + CRON_SECRET.
2. Servir en HTTPS (obligatoire pour le push), ouvrir Gesto sur le téléphone, /echeances → « Activer les rappels sur cet appareil ».
3. Créer une échéance du jour, verrouiller le téléphone, appeler `/api/rappels` (Authorization: Bearer CRON_SECRET) → la notification doit apparaître écran verrouillé ; un appui ouvre le dossier.

## 0.3.0 — Migration Postgres (Supabase)
- Toute la base passe par `DATABASE_URL` (Postgres). Testé sur un vrai Postgres 16 jetable (`tests/run.sh` le crée et le détruit ; si `DATABASE_URL` est fourni, il l'utilise à la place).
- Création du salarié = transaction (salarié + 3 documents + journal + échéance, tout ou rien). Dates validées côté serveur.
- Production : `GESTO_DATA_KEY` et `GESTO_SESSION_SECRET` obligatoires (l'app refuse de démarrer sans, plus de clé par défaut).
- Auth maison (mot de passe scrypt + cookie signé) sur la table `users` ; Supabase Auth non utilisé (décision : moins de pièces). Pas de RLS Supabase : l'accès passe uniquement par le serveur Next.js avec la connexion Postgres — ne jamais exposer la clé `anon` ni ouvrir l'API REST Supabase sur ces tables.
- NON TESTÉ sur un vrai projet Supabase (pas d'accès ici) : SSL/pooler. À valider au premier déploiement.

## Mise en ligne (préparé, non exécuté)
- `vercel.json` : appel quotidien (07:00 UTC) de `/api/rappels` ; Vercel envoie automatiquement `Authorization: Bearer $CRON_SECRET`. Note : le plan gratuit Vercel limite les crons à 1 par jour, c'est suffisant (rappels datés au jour).
- `GET /api/sante` (Bearer CRON_SECRET) : `pret_pour_rappels` + oui/non par réglage (base, clé chiffrement, secret session, VAPID, Resend, Stripe). À appeler après chaque déploiement.
- Variables à renseigner sur Vercel : DATABASE_URL, GESTO_DATA_KEY, GESTO_SESSION_SECRET, CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (Resend et Stripe : plus tard).
- Reste hors de mon accès : projet Supabase, compte Vercel, téléphone, SIREN, textes légaux.

## 0.4.0 — Habillage inspiré des maquettes (fonctions existantes uniquement)
- Thème sombre + accent orange conservé ; langage de couleurs repris des maquettes : rouge = problème immédiat, orange = à traiter, vert = OK, bleu = information (`app/tile.tsx`).
- Navigation : barre latérale (desktop) / onglets en bas (mobile) une fois connecté (`app/nav.tsx`).
- Accueil patron : « À traiter aujourd'hui » alimenté par les vraies données (échéances en retard / proches, contrats bloqués, documents à relire, appareil sans notifications). Accueil salarié : une action principale selon l'état (J'arrive / Pause / Reprendre / Je pars). Heures affichées en fuseau Europe/Paris.
- NON CONSTRUIT (présent sur les maquettes, hors V1) : Gesto Now (« service dans 42 min », prévision), Mode Focus, météo, planning, remplacements validés par un manager, recrutement / candidatures, abonnement Pro, photos de profil. Les noms et chiffres des maquettes (Paul, Chloé, 12 candidatures…) sont des exemples, jamais à afficher comme des données réelles.

## 0.5.0 — Refonte visuelle alignée sur les maquettes de Lou
- Thème clair : fond gris doux, cartes blanches ombrées, action principale verte, accent or, barre latérale sombre (desktop) et onglets blancs à icônes (mobile). Remplace le thème sombre/orange du prompt d'origine (décision de Lou : « sois plus comme la photo »).
- Bannière montagne/chalet = illustration SVG maison (`app/brand.tsx`), logo toque SVG, avatars = initiales. Aucune photo de stock. Une vraie photo pourra être ajoutée plus tard (ex. générée via Canva).
- Toujours sans données inventées : chiffres et tuiles viennent de la base. Cloche = lien vers les échéances avec le nombre d'échéances en retard ou proches.

## 0.6.0 — Design pro (remplace 0.5.0 jugé « trop gamin »)
- Direction : éditoriale et sobre. Papier chaud #f6f5f1, encre #141414, filets fins, un seul accent vert alpin #1f5a43, laiton #b08a4a en touche. Polices Geist Sans / Geist Mono (paquet `geist`, embarqué, sans réseau au build).
- Plus d'illustration ni d'emoji : motif de courbes de niveau généré (`Contours`, `app/brand.tsx`) pour l'identité montagne ; logo = carré vert + coche (« document validé ») + mot « gesto ».
- Patron « Aujourd'hui » : titre-phrase (« 4 points à traiter aujourd'hui »), bande sombre de chiffres (salariés, à relire, échéances ouvertes, J-x), liste « À traiter » à barres de statut, raccourcis. Barre latérale sombre, compte + déconnexion en bas.
- Salarié : écran pointeuse — grande horloge en direct (heure de Paris), statut, un seul bouton, consigne en citation, FAQ. Pas de barre d'onglets (un seul écran).

## 0.7.0 — Design calqué sur les maquettes de Lou (remplace 0.6.0, jugé « trop vide, austère »)
- Fond gris clair, cartes blanches ombrées, boutons verts en dégradé, accent or, pastilles d'icônes teintées, barre latérale sombre avec onglet doré (desktop), barre d'onglets blanche à pastille (mobile). Icônes au trait maison (`app/icons.tsx`).
- Patron : bannière + « Bonjour », 3 raccourcis (Nouveau salarié en or), carte « priorité » (la chose la plus urgente, un bouton), « En un coup d'œil » (prochaine échéance J-x, salariés, à relire, urgents), « Ensuite », « Derniers documents » (relire / valider en un clic), panneau sombre « Mon cours ». Toutes les données sont réelles.
- Salarié : bannière, « Bonjour {prénom} · Prêt pour le service ? », 3 tuiles (date, heure en direct, pointage), poste, consigne, gros bouton vert unique, FAQ.
- Bannière : `app/banner.tsx`. Si `public/banniere.jpg` existe (vraie photo du Chamois), elle remplace automatiquement la scène dessinée.

## 0.8.0 — Maquettes de Lou reproduites à l'identique (données réelles uniquement)
- Patron mobile = maquette 1 : logo, cloche (échéances), menu profil (Paramètres, déconnexion), « Bonjour {prénom} 👋 » + photo, carte décision (priorité n°1, 2 vrais boutons), Gesto Now (prochaine échéance, équipe, à relire, urgents, rappels), Mode Focus (interrupteur réel : 3 priorités / tout), onglets à pastille bleue.
- Patron ordinateur = maquette 3 : barre latérale « Gesto MANAGEMENT » dorée, bannière photo, 3 cartes d'action (Embaucher en or), chiffres (+n cette semaine), derniers documents (aperçu / valider en un clic), panneau sombre or « Mon cours ».
- Salarié = maquette 2 (bannière = photo du commerce, 👋, prise de poste).
- Nouveau : prénom (inscription + Paramètres, colonne `users.first_name`) ; photos par commerce (`company_media`, route `/api/media/[kind]`, JPEG/PNG/WebP ≤ 3 Mo, lecture réservée au commerce) ; page `/parametres`.
- Retiré des maquettes car non construit : météo, planning, recrutement / candidatures, remplacements, « Qui contacter », abonnement Pro.
- Tests : 30 vérifications (dont prénom, envoi photo, format refusé, accès sans connexion refusé) + persistance.
