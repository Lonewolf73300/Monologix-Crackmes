# Dossier de transmission — écran LED Le Chamois (Eurodisplay)

> Faits = vus sur photos/documents par l'utilisateur. À vérifier = pas encore testé sur la Dell.

## Objectif
Piloter l'écran géant extérieur depuis la **nouvelle tour Dell**, avec bon cadrage et bonne qualité, sans toucher à la programmation des cartes. Idéal : un outil "lancer et ça marche" (lecteur photo/vidéo carré).

## Matériel (faits)
- Écran : Eurodisplay **easyScreen modèle 410**, 1,92 × 1,92 m, définition **192 × 192 px** (fiche sur photo).
- Carte d'envoi : **LINSN TS801** (carte verte, puce marquée LXY801A / "LX801A"). Carte de réception séparée : **RV801**. Ne pas confondre : TS801 = envoi, RV801 = réception.
- Carte rouge : PCI vidéo ancienne génération, **modèle non identifié** (à identifier via rapport PCI).
- Carte mère : MSI FM2-A55M-E33 (FM2, ancienne plateforme). Connectique : VGA, nappes internes, RJ45.
- Les cartes rouge et verte sont **installées dans la Dell** (pas à transférer).
- Câble RJ45 sortant vers l'écran : très probablement liaison LINSN propriétaire, **pas de l'Ethernet classique** — à confirmer.
- OS de la Dell : apparemment **Windows 7** → PowerShell 2.0 (pas de Get-CimInstance, Get-NetAdapter, Get-NetIPAddress).

## Docs Eurodisplay 2009 (faits)
4 modules, pitch 10 mm, 3,69 m², système d'origine PC Windows XP + logiciel Eurodisplay, entrées RGB/S-Video/composite, pilotage DVI plug & play. Le logiciel Eurodisplay a une **zone de capture réglable** : cause probable de "seul un coin du bureau s'affiche". Modèle exact de la carte d'envoi/protocole : non donné par les docs commerciales. À confirmer : la façade installée = 192×192 px.
Une vidéo HD doit être réduite à 192×192 : la perte de détail est normale, pas un défaut.

## Symptôme actuel
L'écran **affiche une image** mais mal cadrée et de mauvaise qualité. Pas écran noir.

## Historique des pannes
- Ancien diagnostic `Diagnostic_LED.ps1` : `$root` vide (Join-Path/Split-Path), commandes CIM/NetAdapter absentes, `Stop-Transcript` sans transcription. Message "Rapport créé" **trompeur** → ancien rapport invalide.
- Packs précédents : CHAMOIS_LED_USB_V1.zip, CHAMOIS_LED_REGIE_V6_0_USB.zip (non repris ici).

## Contenu de ce dossier
- `LANCER_DIAGNOSTIC.bat` + `OUTILS/Diagnostic_LED_W7.ps1` : diagnostic **lecture seule**, Win7/PS2.0, rapport dans `RAPPORTS/`. Copie (sans modifier la source) les fichiers de config Linsn/Eurodisplay trouvés.
- `OUVRIR_MIRE.cmd` → `OUTILS/mire.html` : mire 192×192 (bords rouges, grille 16 px, coins magenta/cyan) pour mesurer le décalage de cadrage.
- `OUVRIR_LECTEUR.cmd` → `OUTILS/lecteur.html` : lecteur photos/vidéos recadré en carré.
- **Non testé sur la Dell ni sur l'écran** (aucun accès matériel ici).

## Règles de sécurité
Ne supprimer aucun pilote, ne pas reflasher de firmware, ne pas écraser la config de réception LED. Sauvegarder avant toute modification. Ne pas appliquer une résolution à l'aveugle.

## Plan
1. Lancer le diagnostic sur la Dell, récupérer `RAPPORTS/`.
2. Identifier la carte rouge, la résolution actuelle de la sortie VGA, le logiciel LED installé.
3. Afficher la mire en plein écran (F11) sur la sortie vers l'écran : noter ce qui est coupé/décalé.
4. Régler d'abord la **résolution de sortie du PC** pour égaler la zone d'envoi configurée dans le logiciel LINSN, puis la zone dans le logiciel (jamais la réception).
4b. Dans le logiciel Eurodisplay, régler la **zone de capture** sur la zone où s'affiche le lecteur carré.
5. Alternative à étudier : lecteur autonome LINSN (USB/réseau) à la place de la tour — vérifier d'abord que la TS801 est compatible.

## Mission pour Claude/Grok
À partir du rapport : (a) identifier la carte rouge et la chaîne vidéo exacte, (b) dire quelle résolution/position afficher, (c) proposer le réglage logiciel minimal, (d) évaluer l'option lecteur autonome.

## Options matériel (avis, pas de décision)
- **Ne rien acheter à l'aveugle.** Un contrôleur autonome (NovaStar Taurus, Linsn autonome…) n'est pas compatible d'office avec des cartes réceptrices Linsn RV801 : valider modèle exact et câblage avant achat.
- Option 1 (prioritaire, gratuite) : régler la chaîne existante (mire + zone de capture + lecteur carré).
- Option 2 : mini-PC moderne + carte d'envoi actuelle, si elle est saine.
- Option 3 : contrôleur autonome compatible Linsn, une fois les références confirmées.
