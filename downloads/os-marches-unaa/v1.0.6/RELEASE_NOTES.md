# OS Marches UNAA v1.0.6

Distribution complete actualisee du module `UNAA Analyse de Marches`.

## Correctifs v1.0.6

- Correction de l'export `Exporter dossier etape 4`.
- Le fichier ZIP est maintenant declenche via une ancre attachee au DOM, avec URL `blob:` conservee assez longtemps pour les navigateurs/WebView.
- Ajout d'un fallback mobile/iOS/Capacitor via partage natif de fichier lorsque disponible.
- Correction appliquee aussi aux exports JSON/ZIP et aux livrables.

## Correctifs v1.0.5

- Correction du validateur JSON de l'etape 4.
- Normalisation automatique des valeurs `confidence` non conformes.
- `confidence: "fallback"` est converti en `confidence: "faible"` avant validation et stockage.
- Normalisation aussi couverte pour `default`, `unknown`, `low`, `medium`, `high`, `eleve` et variantes proches.

## Rappel v1.0.4

- Procedure ChatGPT manuelle detaillee directement dans l'interface.
- Ajout du message exact a copier dans ChatGPT.
- Ajout du fichier racine `00_START_HERE_CHATGPT.md` dans le ZIP d'export etape 4.
- Clarification du flux : exporter ZIP, joindre dans ChatGPT, produire `results.json`, importer dans l'app.

## Contenu du package

- PWA web.
- Installateur Windows x64.
- ZIP portable Windows x64.
- APK Android debug si aucune signature Android n'est configuree.
- Sources archivees.
- Checksums SHA256.

## Securite et portabilite

- Aucun secret, token ou credential n'est embarque.
- Les livrables publics ne doivent contenir aucun chemin local, lien `file://`, `localhost` ou `127.0.0.1`.
- Les sources restent privees ; seuls les artefacts distribuables sont publies dans le depot public de telechargement.
