# Reprise — écran géant Eurodisplay du Chamois (dossier au 22/11/2026)

Destiné à Claude, Grok ou un technicien. **Essais sur la Dell et sur la façade : NON réalisés.** Les pièces jointes (photos, V7, anciens packs) ne sont pas dans ce dépôt ; seul le pack V1-corrigé de ce dossier l'est.

## Demande
Gérant du Chamois. Écran extérieur déjà alimenté en image, mais mauvais cadrage, qualité décevante, bureau Windows / erreurs de script visibles dehors. Souhait : déposer photo/vidéo, laisser le logiciel préparer une copie adaptée, choisir, lancer. Commandes et autres fenêtres hors de l'image. Installation par clé USB + raccourci. Réglages validés une fois sur la façade puis mémorisés.

## Faits retenus
- Écran : Euro Display easyScreen Indoor/Outdoor **410** (EVPTRMD410), 1,92 × 1,92 m, 4 modules 2×2. Fiche : définition graphique **192 × 192** ; mentionne aussi HDV/Quadcore et pitch 10/20 mm → ne pas certifier une matrice physique 192×192 sans contrôle.
- Carte d'envoi dans la tour : étiquette **TS801** ; puce LXY801A / LINSN / 0912 (référence de puce ≠ carte).
- **RV801** (+ HUB40A-1, puce LINSN 0828) : photographiée dans une boîte, **installation actuelle non prouvée**.
- Carte bleue à antenne = **NETGEAR WG311v3** (Wi-Fi PCI) : aucun rôle d'émetteur LED. (Une analyse précédente de la conversation parlait d'une "carte rouge PCI vidéo" : non confirmé.)
- GPU photographié : ATI Radeon HD4350 ; carte mère FM2-A55M-E33 ; Windows 7 build 7601 — **état de la nouvelle Dell non confirmé** (modèle, GPU, Windows à relever par diagnostic).
- Docs 2009 : Windows XP Pro, ED Player, Serial Converter, Control Software, carte vidéo USB. Ne pas fusionner avec l'époque Windows 7.
- Lecteur d'origine : **VisualManager** ; **EasyScreen Manager V9.13** visible aussi (contenu/lecture vs gestion).
- Le RJ45 de la TS801 transporte le signal LED : **pas un réseau IP**, ne pas y brancher une carte réseau PC. Deux câbles blancs distincts (réseau carte mère / carte d'envoi).
- Un CD EasyCAP photographié n'est pas un installateur récupéré.

## Symptômes / réglages historiques (à tester, pas à réappliquer)
Lecteur : X=49 Y=10 L=283 H=205 (IMG_1113) ; X=49 Y=8 L=283 H=209 (IMG_1114) ; default.seq, SpotEuroDisplay, Loop ON. Catalyst : duplication + "Redimensionner en plein écran", 60 Hz, 16 bits. Hypothèse : la fenêtre de lecture n'est pas alignée sur la portion vidéo réellement transmise (clone, mise à l'échelle, décalage). Une image sur la façade ne valide pas modules, couleurs ni mapping.

## Anciens packs
- V1 : `$PSScriptRoot` (vide sous PS2), Get-CimInstance / Get-NetAdapter / Get-NetIPAddress absents sous Win7 ; le script annonçait un rapport malgré les échecs. `lecteur.html` : JS moderne, inadapté à un vieil IE, ne pilote pas les cartes Linsn.
- V6 : HTA/JScript + Windows Media Player, compatibilité non vérifiée.
- Une panne des panneaux n'est **pas** établie par ces erreurs.

## Candidat V7 (hors dépôt)
Application C++ Win32/GDI+ 32/64 bits, FFmpeg 6.1.6 → AVI/MJPEG 192×192, playlist, fenêtre de sortie positionnable, mire numérotée, essai 30 s + confirmation + profil mémorisé, diagnostic natif. Compilée et testée sous Linux (385 contrôles, filtres, FFmpeg) ; **jamais exécutée sous Windows** (Wine bloqué). Limites : pas de planificateur, pas de texte défilant, pas d'API TS801 certifiée, ne lit/écrit pas la mémoire des cartes, pas de HEIC/AVIF, HDR non validé.

## Contenu de ce dépôt (`chamois-led-usb/`)
- `LANCER_DIAGNOSTIC.bat` → `OUTILS/Diagnostic_LED_W7.ps1` : lecture seule, PS 2.0, WMI classique, vérifie que le rapport existe avant d'annoncer la réussite, copie (sans modifier la source) les config Linsn/Eurodisplay trouvées.
- `OUVRIR_MIRE.cmd` → `OUTILS/mire.html` : mire numérotée (1 rouge HG, 2 vert HD, 3 bleu BG, 4 blanc BD, cadre, cercle).
- `OUVRIR_LECTEUR.cmd` → `OUTILS/lecteur.html` : lecteur HTML carré (navigateur récent requis ; **inadapté à un vieil IE**, à vérifier sur la Dell).

## Procédure sur la Dell
1. Diagnostic → noter modèle, Windows, architecture, GPU, écrans, entrée DVI réelle vers la TS801.
2. Relever mode clone/étendu, DPI, résolution du signal.
3. Mire en plein écran sur la sortie LED : contrôler 4 coins, cadre, cercle, couleurs, ordre des modules dehors.
4. Régler la zone de capture / position de fenêtre d'après la mire, puis seulement importer photo/vidéo SDR courte.
5. Si la mire source est correcte mais blocs réordonnés/couleurs fausses : examiner la réception et son fichier de config, pas le lecteur.

## Alternative à la tour
Document Linsn : TS801/TS802/DS801/DS802 existent en boîtier indépendant (DVI-D, RJ45, USB de communication, 5 V) — principe valide, pas un branchement improvisé. Il faut toujours une source vidéo ; la liaison USB n'est pas un lecteur de médias. Ne rien acheter sans preuve de compatibilité (modèle, fichier de dalle, mode HDV/Quadcore, carte de réception réelle). Notice TS802 ≠ TS801.

## Sources
Linsn "Show the Entire Desktop" (en.linsn.com/new/url/e1b0418375efa9a8) ; Linsn Outer Box Specification (cvc.de/de/pdf/linsn%20ts852%20case%20specs%20english.pdf) ; Euro Display 2023 (eurodisplay.com/led-screens-dedicated-proprietary-control-system/) ; Microsoft about_Automatic_Variables ; Linsn LEDStudio Manual V12.65 ; FFmpeg docs. Non relues ici.

## Mission pour Claude/Grok
Diagnostic hiérarchisé avec preuves (observations / déductions / inconnues) ; vérifier modèle Dell, exécution réelle des exécutables Windows, cadrage, écarts 192×192 / résolution DVI / HDV-Quadcore, références TS801/RV801/LXY801A ; corriger avec essais réels (chemins accentués, fichiers corrompus, portrait/paysage, pixels non carrés, couleurs, écran noir, reprise, profil). Toute modification firmware/pilote/mapping : cause établie + retour arrière. Chaîne sans tour : matériel compatible *vérifié*.
