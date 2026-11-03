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
- Stockage : SQLite local (node:sqlite) au lieu de Supabase. Incompatible Vercel (disque éphémère) → migrer vers Postgres/Supabase avant déploiement.
- Écrans V2 non construits (verrou 10 commerçants). Rails : `companies.modules`, `users.role`.

## CONSIGNE ABSOLUE (re-précisée par Lou) — statut honnête
Le test de bout en bout n'est PAS encore validé :
- OK automatisé : salarié → contrat à relire → validation → échéance → rappel déclenché dans sa fenêtre de dates (et pas avant).
- MANQUE : le rappel n'est pas un « vrai » rappel tant qu'aucune clé Resend n'est branchée (statut `non_envoye`), et Lou ne l'a pas encore vu fonctionner.
- Périmètre dépassé avant cette consigne : espace employé, /offres + Stripe, chapitre 1. À masquer derrière un indicateur ou à retirer si Lou le demande. Aucune autre brique ne démarre.

## Décision (Lou : « à toi de voir »)
Extras (espace employé, /offres, Stripe) masqués par défaut : `GESTO_EXTRAS=1` pour les activer. Cœur V1 testé dans les deux modes. Reste à valider : vrai email (clé Resend) + démonstration à Lou.
