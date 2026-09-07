# Vérification 1.0.20 — actualisation native à l'ouverture

Rapport de tests du 08/09/2026. Package complet requis. Les contrôles ci-dessous
portent sur les artefacts exacts préparés pour publication ; les adresses distantes
font l'objet d'un contrôle final distinct après publication.

| Contrôle | État | Résultat observable |
|---|---|---|
| Préflight UNAA | Testé avec succès | Node/npm, Python, Rust/Cargo, Java, Gradle, Tauri, Capacitor disponibles |
| Collecte CLI réelle | Testé avec succès | TED 18, BOSA 60, BMA 2, Vlaams 2 ; 82 récupérés, 81 actifs |
| Tests Node | Testé avec succès | 14 tests : ouverture répétée, repli, provenance, états lus, créneau supprimé |
| Python unittest | Non applicable | Aucun test Python dans ce projet ; zéro test exécuté |
| Web et HTML autonome | Testé avec succès | Build, garde portabilité, navigation Sources/Veille ; Edge 1360 × 860 et 800 × 1100, zéro erreur JS |
| Flux public produit | Testé avec succès | data:verify : 81 avis avec sources vérifiées |
| APK debug tablette API 35 | Testé avec succès | Installation puis deux lancements réels ; aucune source simulée |
| Première ouverture Android | Testé avec succès | Les 4 dates retrievedAt renouvelées ; fin 2026-09-07T23:27:05.863Z |
| Fermeture/réouverture Android | Testé avec succès | Les 4 sources relues ; fin 2026-09-07T23:28:03.039Z |
| Android sans réseau | Testé avec succès | Wi-Fi/data coupés sur émulateur : 81 avis conservés ; avertissement ; date complète inchangée |
| Rendu tablette | Testé avec succès | 1280 × 744 CSS ; pas de débordement horizontal ; capture inspectée |
| EXE Windows local | Testé avec succès | Deux lancements réels : 23:40:34.567Z puis 23:41:21.048Z ; les 4 retrievedAt renouvelés ; 81 avis actifs |
| Interface Windows réelle | Testé avec succès | Fenêtre contrôlée avec Computer Use ; bandeau complet et rendu inspectés |
| APK signé stable | Testé avec succès | Build GitHub 34170363749 ; installation de 1.0.19 puis mise à jour 1.0.20 sans désinstaller ; actualisations à 01:36 et 01:38 Bruxelles |
| Signature Android | Testé avec succès | Paquet be.unaa.veillearchimarches ; versionCode 20 ; certificat SHA-256 identique à 1.0.19 |
| Installateur NSIS Windows | Produit, non testé en installation | Ne pas confondre avec l'EXE portable exécuté ; installation sur machine utilisateur non effectuée |
| ZIP Windows portable | Testé avec succès | Archive extraite, EXE extrait lancé : 4 sources actualisées à 01:45 Bruxelles |
| Sources GitHub | Poussées | Code applicatif testé : 7fe61b8 ; les commits suivants documentent les tests |

Le script tools/qa-native-opening.mjs inspecte la WebView native réelle et écrit
les captures et dates par source dans qa-output/ (ignoré par Git). Les tests de
repli unitaires utilisent des fixtures uniquement dans tests/, jamais dans l'app.

Périmètre : Windows et Android natifs, selon demande. Le HTML web autonome reste
lecteur du flux public ; il n'obtient pas un connecteur natif en navigateur.
L'application native collecte directement les quatre sources publiques sans
jeton GitHub ni secret utilisateur. Les paramètres publics BOSA et son jeton
anonyme temporaire restent en mémoire ; les journaux Capacitor sont désactivés.
Le wrapper Android, l'identifiant de paquet et la signature stable sont conservés.

Provenance des artefacts natifs : EXE/ZIP issus du build local release terminé
avec succès ; APK signé issu du build GitHub 34170363749. Ces mêmes fichiers
testés sont utilisés pour la publication, sans recompilation intermédiaire.

Non couverts : téléphone/tablette physique, iOS, envoi d'e-mails, exhaustivité de
tous les marchés belges au-delà du périmètre des connecteurs existants.

Le retour d'arrière-plan Android ne déclenchait pas toujours visibilitychange :
MainActivity.onResume transmet désormais un événement natif. Cette branche a été
compilée et embarquée dans l'APK signé testé ; un second test d'arrière-plan après
correction n'a pas pu être mené par le contrôle d'interface disponible. Les deux
fermetures/lancements complets, eux, ont bien été testés.

## Fichiers et état de test

Créations : collecteurs partagés src/importers/, connecteur src/native-refresh.js,
tests de rafraîchissement et de planification, outils QA, présent rapport,
preflight/, qa-output/ (captures, profils isolés et téléchargements candidats),
cache de compilation Tauri dédié autorisé. Aucune source métier déplacée ou
supprimée. Sur l'émulateur de test uniquement, l'APK debug a été désinstallé puis
remplacé par la chaîne de test signée 1.0.19 → 1.0.20 ; les données de cette
instance debug étaient des données de QA et sont reconstituables par collecte.
