# Veille Archi Marches v1.0.11

Mise a jour corrective Android: APK release signee avec une cle stable pour permettre les mises a jour futures.

## Packaging v1.0.11

- Alignement des versions npm, Tauri, Cargo, Android et manifeste UNAA sur `1.0.11`.
- Ajout de la signature Android stable via secrets GitHub Actions.
- Production d'un APK release signe `veille-archi-marches-v1.0.11-android.apk` lorsque les secrets de signature sont disponibles.
- Remplacement du keystore debug ephemere par un keystore PKCS12 stable cote CI.
- Etat connu: les APK debug deja installees ne peuvent pas etre mises a jour directement vers la premiere APK signee; Android impose une desinstallation unique de l'ancienne APK debug.

## Historique v1.0.10

Mise a jour corrective: adaptation automatique de l'affichage PC selon la taille et la densite de l'ecran.

## Packaging v1.0.10

- Alignement des versions npm, Tauri, Cargo, Android et manifeste UNAA sur `1.0.10`.
- Ajout d'une detection de densite d'ecran: `standard`, `laptop`, `compact`, `mobile`.
- Reduction adaptative des marges, largeurs de sidebar, espacements, cartes et lignes de marche sur laptop.
- Sur laptop, le panneau "Dossier selectionne" passe sous la liste afin de redonner de la largeur au tableau des avis.
- Sur grand ecran, le panneau detail reste a droite comme dans la version stable precedente.
- Validation responsive: `1366x768`, `1536x864` et `1920x1080`, sans debordement horizontal detecte.

## Historique v1.0.9

Mise a jour de maintenance: version visible dans l'application, test email strict et diagnostics SMTP Microsoft 365.

## Packaging v1.0.9

- Alignement des versions npm, Tauri, Cargo, Android et manifeste UNAA sur `1.0.9`.
- Affichage de la version applicative dans la sidebar desktop et la sidebar compacte mobile/tablette.
- Ajout des commandes `email:preview` et `email:test` pour verifier le digest quotidien.
- Ajout du workflow manuel GitHub Actions `Test email digest`.
- Durcissement du workflow quotidien: les donnees publiques sont publiees avant l'envoi email, et l'echec SMTP est explicite.
- Correctifs client SMTP: timeout reseau, parsing de la banniere serveur, fallback `AUTH LOGIN` pour Microsoft 365.
- Etat connu: l'envoi Microsoft 365 reste bloque tant que `Authenticated SMTP` n'est pas active par l'IT pour `tenders@unaa.eu` ou le tenant.

## Historique v1.0.8

Package complet stable: web/PWA, EXE Windows, ZIP portable, APK Android, donnees publiques et checksums.

## Packaging v1.0.8

- Alignement des versions npm, Tauri, Cargo et Android sur `1.0.8`.
- Regeneration du package complet apres l integration des prescripteurs publics bruxellois prioritaires.
- Publication attendue des artefacts Windows, Android, HTML mobile, donnees publiques et `SHA256SUMS.txt`.

## Historique v1.0.7

Integration des prescripteurs publics bruxellois prioritaires.

### Nouveautes v1.0.7

- Ajout des canaux Beliris/DIT, SAU/MSI, citydev.brussels, urban.brussels, perspective.brussels et Brulocalis au catalogue des sources.
- Ajout des familles de prescripteurs "Operateurs publics Bruxelles" et "Communes + CPAS bruxellois".
- Enrichissement du connecteur BOSA pour detecter les acheteurs bruxellois prioritaires et classer leurs avis officiels sans creer de donnees de demonstration.
- Ajout des statuts d audit et d import dans le panneau Sources afin de distinguer prescripteurs directs, relais et sources de controle.

## Historique v1.0.6

Correctif navigation externe PC/HTML.

### Correctifs v1.0.6

- En mode web, PWA ou HTML autonome, l'ouverture d'un avis se fait uniquement dans un nouvel onglet via `_blank`.
- L'application ne force plus le focus vers l'onglet externe afin de laisser la page de veille accessible.
- Le fallback qui remplaçait l'onglet courant par la source officielle a été supprimé; si le navigateur bloque l'ouverture, l'application reste affichée et signale le blocage.
- Test desktop validé: clic sur une ligne d'avis, nouvel onglet créé, URL de l'application inchangée; test popup bloqué, URL de l'application inchangée.

## Historique v1.0.5

Correctif import, echeances expirees et verification de publication.

## Correctifs v1.0.5

- Les avis dont l'echeance est depassee sont retires du flux actif, de l'interface et de l'export `latest-opportunities.json`.
- Le digest email exclut a nouveau les avis expires avant de composer le message, meme si un ancien flux public est encore present.
- L'horodatage "Dernier import avis" utilise maintenant l'horodatage global du flux public quand il est disponible, au lieu du dernier `retrievedAt` d'un avis.
- La relance manuelle verifie apres succes GitHub Actions si le flux public a reellement ete republie; si l'export reste ancien, l'application signale explicitement le probleme de publication.
- Le flux public local genere le 25/06/2026 contient 48 avis actifs et 0 avis expire.

## Historique v1.0.4

Correctif installateur Windows et verification email.

## Correctifs v1.0.4

- Raccourcis Windows recrees explicitement apres installation avec l'icone de `veille-archi-marches.exe`.
- Correctif destine aux cas ou Windows conserve l'ancienne icone de raccourci apres une mise a jour.
- Mode de previsualisation email ajoute via `ALERT_PREVIEW=1` pour afficher le sujet, les destinataires et le corps texte sans envoyer de message.
- Le script email signale maintenant le sujet du digest meme lorsque les secrets SMTP ne sont pas configures.

## Historique v1.0.3

Patch d'identite applicative et d'alertes email.

## Correctifs v1.0.3

- Icone applicative alignee sur le set officiel v0.1.3 : la veille marches publics utilise l'icone radar `UNAA Veille Marches Publics`.
- Manifeste PWA corrige : nom `UNAA Veille Marches Publics`, icones issues du pack officiel `unaa-veille-marches-publics`.
- Icones Windows Tauri et Android regenerees depuis les assets officiels v0.1.3.
- Configuration email quotidienne ajoutee dans la colonne gauche avec expéditeur, boite d'envoi, heure et destinataires multiples.
- Liste de destinataires sous forme de chips ajoutables/supprimables, avec validation email.
- Persistance locale des parametres d'alertes sans stocker de mot de passe ni secret.
- Script GitHub Actions `email:digest` ajoute pour envoyer le digest quotidien via SMTP uniquement si les secrets SMTP sont configures.

## Correctifs v1.0.2

Patch de fiabilisation des liens externes.

- Ouverture externe centralisee pour tous les liens officiels de l'interface.
- Correction des boutons `Avis public`, `Documents`, `Espace connecte`, lignes de marche, sources, registres et liens de workflow.
- Utilisation du plugin Tauri opener dans l'application Windows afin d'ouvrir les sources dans le navigateur systeme.
- Fallback web/PWA/mobile en nouvel onglet, puis navigation directe si le popup est bloque.
- Ajout de la capability Tauri `opener:default`.

## Correctifs v1.0.1

- Nom installable aligne sur la fonction reelle de l'application : `UNAA Veille Archi Marches`.
- Installateur Windows NSIS configure en francais.
- Nom Android/Capacitor aligne sur `UNAA Veille Archi Marches`.
- Distinction clarifiee : cette application est la veille des marches ; l'analyse approfondie releve du module `os-marches-unaa`.

## Contenu stable v1

- Avis reels uniquement, sans donnees de demonstration.
- Connecteurs TED, e-Procurement BOSA, BMA et Vlaams Bouwmeester.
- Detection des PPP et operations de developpement incluant des competences d'architecture.
- Distinction travaux / honoraires, estimation 10% uniquement quand le montant travaux est disponible.
- Tri des avis par echeance, score et nouveaute.
- Alertes visuelles pour echeances proches, aujourd'hui ou depassees.
- HTML mobile autonome et PWA.
- Packaging Windows Tauri et Android Capacitor.

## Securite et portabilite

- Aucun secret ou credential n'est stocke dans le frontend, le depot ou le stockage navigateur.
- Les livrables sont controles contre les chemins locaux et liens `file://`, `localhost` ou `127.0.0.1`.
- Les connecteurs authentifies devront passer par GitHub Actions, backend securise ou coffre de secrets.
