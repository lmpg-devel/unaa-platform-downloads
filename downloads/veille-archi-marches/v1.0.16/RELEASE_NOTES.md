# Veille Archi Marches v1.0.16

## Correctif publication flux

- `generatedAt` du flux public correspond au dernier import reel execute, pas a une simple release.
- `latest-opportunities.json` public publie 65 avis actifs, 0 avis expire.
- L'application distingue `Dernier import reel publie` et `Dernier flux public charge`.
- La relecture du flux public utilise un parametre anti-cache unique et lit GitHub Contents avant les fallbacks publics.
- Package complet: PWA publique, HTML mobile autonome, APK Android signe, installateur Windows, ZIP portable et checksums.

## Etat pipeline

- Le workflow d'import refuse maintenant de produire un import prive non publie.
- La publication automatique depuis GitHub Actions necessite un secret de publication downloads cote depot source.
- La publication v1.0.16 du depot public a ete effectuee depuis un checkout local authentifie.
