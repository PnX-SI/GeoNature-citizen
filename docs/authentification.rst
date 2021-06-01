===================================
Configuration de l'authentification
===================================

Le fichier ``frontend/src/conf/app.config.ts`` permet notamment de configuer l'authentification.

Il y a 3 possibilités :

- un mode sans authentifiaction (``signup : "never"``),
- un mode avec authentification optionnelle (``signup : "optional"``) tout en conservant le mode sans authentification,
- un mode avec authentification obligatoire (``signup : "always"``).
