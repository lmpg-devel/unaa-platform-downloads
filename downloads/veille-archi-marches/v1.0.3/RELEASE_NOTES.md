# Veille Archi Marches v1.0.3

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
