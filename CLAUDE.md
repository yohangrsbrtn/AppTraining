# AppTrainingPWA

PWA (Progressive Web App) qui reproduit à l'identique l'app de coaching **AppTraining officielle** (Google Apps Script). Hébergée sur GitHub Pages, backend partagé avec le GAS.

- **URL live** : https://yohangrsbrtn.github.io/AppTraining/
- **Backend** : `https://script.google.com/macros/s/AKfycbwQiM6ixf-CTIWwcuNHoosFbvrDzWmC056yRUGhTaWv0Nwxbm0dLeK3d5QVgqmS7P9G7A/exec` (Web App GAS, même code que l'app officielle — voir `../AppTraining/Code.js`)
- **Référence visuelle/fonctionnelle** : `../AppTraining/Index.html` et `../AppTraining/Code.js` sont la source de vérité. Objectif permanent : la PWA doit ressembler et se comporter *exactement* comme l'app GAS officielle, sauf demande explicite contraire.

## Déploiement

- Push sur `main` = déploiement automatique (GitHub Pages sert directement depuis le repo). Pousser après chaque modification, sans demander confirmation.
- Le GAS (`Code.js`/`Index.html`) est un projet **séparé**, non versionné sur GitHub, déployé via `clasp push && clasp deploy --deploymentId <id>` depuis `/Users/yohangrosbertin/Desktop/AppTraining`.

## Architecture

- `index.html` — coquille de l'app (CSS, état global `S`, routage `setPage()`/`render()`, accueil, classement, profil, réglages)
- `api.js` — `api()`/`apiAs()` vers le backend GAS. `_viewAsClientOverride` : quand posé, TOUTES les requêtes `api()` utilisent ce client au lieu du client connecté — c'est le mécanisme qui alimente la "vue client" du coach (`enterVueClient`/`exitVueClient` dans `index.html`).
- `bilan.js`, `training.js`, `diete.js`, `mensurations.js`, `recettes.js`, `progression.js`, `collection.js`, `coach.js` — une page par fichier

## Pièges connus (ne pas refaire les mêmes erreurs)

- **`chargerBilan` et `chargerJourneeEnCours` appellent toutes les deux `etendreBilan()` côté serveur** (écriture sur la feuille Bilan). Ne JAMAIS les appeler en parallèle — ça plante. `loadHome()` utilise `chargerJourneeEnCours` (pas `chargerBilan`, jamais lue par l'accueil).
- **`validerBilan` renvoie une chaîne `JSON.stringify`** côté serveur (contrairement à `validerJournee`/`envoyerBilanAuCoach` qui renvoient de vrais objets) — toujours faire `typeof raw === 'string' ? JSON.parse(raw) : raw`.
- **Feuille Bilan, bloc de 9 lignes** : col C = date de validation (double usage : présence = bilan validé). Col U (21) = case "Valide Bilan" **fusionnée sur les 7 lignes de jours** (une seule valeur visuelle pour toute la semaine, écrite uniquement par `validerBilan`). Col V (22) = validation quotidienne par jour (`validerJournee`), non fusionnée, ajoutée spécifiquement pour ne pas entrer en conflit avec U.
- **Mensurations sont totalement indépendantes du bilan** — pas de blocage à l'envoi/clôture (le blocage historique a été retiré). Ne pas réintroduire de vérification bloquante.
- **Le "Guide & Fonctionnement" dans Paramètres doit rester synchro avec le comportement réel** — ne pas copier bêtement le texte du GAS s'il décrit un ancien comportement (ex: l'ancien blocage mensurations).
- Le système de déblocage niveau/titre (confettis, glow) est dans `collection.js` (`verifierDeblocages`/`afficherDeblocage`) — déclenché après journée/séance/bilan/envoi-avec-bonus via `rafraichirProgressionEtDeblocages()`. Si un nouveau point de gain d'XP est ajouté, penser à y accrocher cette vérification.
- Palette de couleurs alignée sur le GAS (`index.html` `:root`) : fond page `#0f1117`, fond carte `#1a1d29`, bordure `#2d3142`, texte secondaire `#8892a4`. Les cartes GAS n'ont **pas** de bordure visible — uniquement le contraste de fond.
- `getBadgeSVG`/`TITRES_DEF`/`BADGES_NIVEAU` (badges de niveau + titres) sont dans `collection.js`, utilisés partout (accueil, progression, profil, collection, classement, coach). Toute modification de style s'y fait une seule fois et se propage automatiquement partout — vérifier tous les call sites avant de considérer un changement "fini".

## Workflow de travail

- Sync + push sans demander confirmation à chaque fois — seulement si une action est destructive (force-push, suppression) faut-il confirmer.
- Avant tout changement visuel/fonctionnel supposé "comme le GAS", relire le code GAS correspondant plutôt que deviner — plusieurs écarts trouvés cette session venaient d'un portage approximatif (ex: badges Platine/Diamant/Légendaire qui avaient perdu leurs facettes, page Classement avec des noms de champs invalides).
