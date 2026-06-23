# OS Marches UNAA v1.0.1

Premiere distribution multiplateforme officielle du module `UNAA Analyse de Marches`.

## Correctifs v1.0.1

- Ajout du packaging Windows Tauri v2 avec installateur NSIS et raccourcis icones.
- Ajout du packaging Android Capacitor.
- Ajout du manifeste PWA et de l'identite officielle `unaa-analyse-de-marches`.
- Ajout du workflow GitHub Release avec EXE, ZIP portable, APK, web/PWA, source privee et checksums.
- Ajout d'un garde de portabilite sur les livrables web publics.

## Contenu fonctionnel repris de v1.0.0

- Workflow d'analyse de marche en 6 etapes.
- Ingestion documentaire, classification FR/NL, scoring, matching references/marche.
- Generation de livrables PDF, DOCX, XLSX, CSV, JSON et packages reinscriptibles.

## Securite et portabilite

- Aucun secret, token ou credential n'est embarque.
- Les livrables publics ne doivent contenir aucun chemin local, lien de fichier local, URL locale de developpement ou tunnel temporaire.
- Les sources restent privees ; seuls les artefacts distribuables sont publies dans le depot public de telechargement.
