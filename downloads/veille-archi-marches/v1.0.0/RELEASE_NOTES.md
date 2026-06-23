# Veille Archi Marches v1.0.0

Premiere version stable officielle de l'application de veille des marches publics d'architecture.

## Contenu

- Avis reels uniquement, sans donnees de demonstration.
- Connecteurs TED, e-Procurement BOSA, BMA et Vlaams Bouwmeester.
- Detection des PPP et operations de developpement incluant des competences d'architecture.
- Distinction travaux / honoraires, estimation 10% uniquement quand le montant travaux est disponible.
- Tri des avis par echeance, score et nouveaute.
- Alertes visuelles pour echeances proches, aujourd'hui ou depassees.
- HTML mobile autonome et PWA.
- Socle de packaging Windows Tauri et Android Capacitor.

## Securite et portabilite

- Aucun secret ou credential n'est stocke dans le frontend, le depot ou le stockage navigateur.
- Les livrables sont controles contre les chemins locaux et liens `file://`, `localhost` ou `127.0.0.1`.
- Les connecteurs authentifies devront passer par GitHub Actions, backend securise ou coffre de secrets.
