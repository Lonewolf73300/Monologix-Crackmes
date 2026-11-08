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

## 0.4.0
- Habillage patron/salarié (tuiles de statut, navigation, « À traiter » sur données réelles), heures en Europe/Paris, test du tableau de bord.

## 0.5.0
- Refonte visuelle claire (vert/or), bannière SVG, nouvelle navigation, accueil patron et salarié refaits, accueil public avec bannière.

## 0.6.0
- Refonte design pro : Geist, palette papier/encre/vert alpin, courbes de niveau, tableau « Aujourd'hui », pointeuse salarié, accueil éditorial.

## 0.7.0
- Design calqué sur les maquettes (cartes blanches, vert/or, pastilles d'icônes, priorité, coup d'œil, pointeuse salarié), emplacement pour une vraie photo de bannière.

## 0.8.0
- Reproduction des 3 maquettes (patron mobile, patron ordinateur, salarié) sur données réelles ; prénom ; photos par commerce ; page Paramètres ; Mode Focus.
