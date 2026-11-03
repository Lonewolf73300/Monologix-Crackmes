# CHANGELOG
## 0.1.0
- App Gesto V1 : accueil, chapitre 1, auth, diagnostic, salariés, documents DOCX avec validation journalisée, échéances/rappels, espace employé, Stripe/Resend branchés conditionnellement, test e2e.

## 0.2.0
- Rappels par notification système (Web Push) vers le dossier concerné, repli email.
- Contrat : alerte et blocage sur infos manquantes, versionnage, revalidation.
- Test e2e en une commande + redémarrage + persistance.
- Verrou SQLite (busy_timeout).

## 0.3.0
- Migration SQLite → Postgres (Supabase), transactions, secrets obligatoires en production, tests sur Postgres jetable.
