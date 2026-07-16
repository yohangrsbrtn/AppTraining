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
- `bilan.js`, `training.js`, `diete.js`, `mensurations.js`, `recettes.js`, `progression.js`, `collection.js`, `coach.js`, `protocole.js` — une page par fichier
- **Préchargement** (`index.html`, section "Préchargement") : `_pf` (cache), `schedulerPrechargement()`/`precharger()` relancent le chargement en arrière-plan de Bilan/Programme/Diète/Mensurations à CHAQUE atterrissage sur l'accueil OU sur l'une de ces 4 pages elles-mêmes (pas juste une fois) — navigation quasi instantanée tant que le cache n'a pas été consommé. `_pfSession` s'incrémente à chaque bascule d'identité (login, `enterVueClient`/`exitVueClient`) pour ignorer les résultats d'un préchargement lancé pour un autre client.
- **`apiEtendreBilan()`** (`api.js`) : sérialise tous les appels à `chargerBilan`/`chargerJourneeEnCours` (voir piège ci-dessous) via une file d'attente commune — à utiliser systématiquement pour ces deux actions, y compris depuis le préchargement, `verifierEtCocherTraining`, etc., pas seulement depuis l'accueil.
- **`showLoadingOverlay()`/`hideLoadingOverlay()`** (`index.html`) : popup léger (fond grisé + petite carte + spin + message, façon GAS) pour les actions/navigations courtes — à utiliser à la place de `setPage('loading')` (spinner plein écran) sauf pour le tout premier chargement après connexion.

## Pièges connus (ne pas refaire les mêmes erreurs)

- **`chargerBilan` et `chargerJourneeEnCours` appellent toutes les deux `etendreBilan()` côté serveur** (écriture sur la feuille Bilan). Ne JAMAIS les appeler en parallèle — ça plante. `loadHome()` utilise `chargerJourneeEnCours` (pas `chargerBilan`, jamais lue par l'accueil).
- **`validerBilan` renvoie une chaîne `JSON.stringify`** côté serveur (contrairement à `validerJournee`/`envoyerBilanAuCoach` qui renvoient de vrais objets) — toujours faire `typeof raw === 'string' ? JSON.parse(raw) : raw`.
- **Feuille Bilan, bloc de 9 lignes** : col C = date de validation (double usage : présence = bilan validé). Col U (21) = case "Valide Bilan" **fusionnée sur les 7 lignes de jours** (une seule valeur visuelle pour toute la semaine, écrite uniquement par `validerBilan`). Col V (22) = validation quotidienne par jour (`validerJournee`), non fusionnée, ajoutée spécifiquement pour ne pas entrer en conflit avec U.
- **Mensurations sont totalement indépendantes du bilan** — pas de blocage à l'envoi/clôture (le blocage historique a été retiré). Ne pas réintroduire de vérification bloquante.
- **Le "Guide & Fonctionnement" dans Paramètres doit rester synchro avec le comportement réel** — ne pas copier bêtement le texte du GAS s'il décrit un ancien comportement (ex: l'ancien blocage mensurations).
- Le système de déblocage niveau/titre (confettis, glow) est dans `collection.js` (`verifierDeblocages`/`afficherDeblocage`) — déclenché après journée/séance/bilan/envoi-avec-bonus via `rafraichirProgressionEtDeblocages()`. Si un nouveau point de gain d'XP est ajouté, penser à y accrocher cette vérification.
- Palette de couleurs alignée sur le GAS (`index.html` `:root`) : fond page `#0f1117`, fond carte `#1a1d29`, bordure `#2d3142`, texte secondaire `#8892a4`. Les cartes GAS n'ont **pas** de bordure visible — uniquement le contraste de fond.
- `getBadgeSVG`/`TITRES_DEF`/`BADGES_NIVEAU` (badges de niveau + titres) sont dans `collection.js`, utilisés partout (accueil, progression, profil, collection, classement, coach). Toute modification de style s'y fait une seule fois et se propage automatiquement partout — vérifier tous les call sites avant de considérer un changement "fini".
- **`logActivite(client, programme, type, semaine, xp)` (Code.js) déduplique sur `client|programme|semaine|type`** — le paramètre `semaine` DOIT être unique par occurrence réelle (numéro de semaine, ou date), jamais une valeur qui se répète chaque semaine (ex: nom du jour "Mardi") — sinon `mettreAJourStats` (qui met à jour le total XP affiché) est silencieusement sauté à partir de la 2e occurrence, alors que la ligne `Log` est quand même ajoutée (bug réel trouvé et corrigé sur `validerJournee`/bonus pas — cause du total XP qui n'augmentait plus).
- **Toute nouvelle action serveur qui accorde de l'XP doit fixer le montant côté serveur, jamais le recevoir du client** (`validerSeanceActivite` par ex. ignore un éventuel `xp` envoyé par le client) — sinon un client peut s'auto-attribuer de l'XP arbitraire via un appel direct à l'action.
- **Mode simplifié** (`localStorage['modeSimplifie']`, réglage par appareil, pas par client — comme le GAS) cache XP/progression/classement et coupe les popups de déblocage/XP ; toute nouvelle UI liée à l'XP doit vérifier `modeSimplifieActif()` si elle est censée être masquée dans ce mode.
- **Protocole "chimie"** (`protocole.js`) : lecture seule, ne jamais écrire dans la feuille `Protocol` du client — la saisie (dates, molécules) reste manuelle côté coach dans Sheets, l'app recalcule juste l'affichage à la volée. Activable individuellement par client via le toggle 🧬 dans "Mes clients" (coach), colonne J de la feuille `Clients`. Page à onglets (`_protocoleTab` : `cycle`/`analyses`).
- **Onglet "Analyses" du Protocole** (suivi prise de sang) : même principe lecture seule, sur une feuille `Analyses` du client (format tidy : colonnes `Date | Marqueur | Valeur | Unité | RefMin | RefMax`, une ligne par marqueur/date). Pas d'extraction PDF automatisée côté app — le coach passe les photos/PDF des résultats dans un chat dédié avec Claude qui ressort un xlsx prêt à coller dans cette feuille. `chargerAnalysesSante(client)` (Code.js) regroupe par marqueur, calcule le statut (bas/normal/haut) selon RefMin/RefMax, gated par le même flag `ChimieActif` que le reste du Protocole.
- **Notifications push (FCM)** : implémentées et déployées, mais cassées sur iPhone du coach (bug iOS non résoluble, diagnostiqué en profondeur) — mises de côté sur sa demande. Le code reste en place, ne pas re-déboguer sans nouvel élément concret.

## Workflow de travail

- Sync + push sans demander confirmation à chaque fois — seulement si une action est destructive (force-push, suppression) faut-il confirmer.
- Avant tout changement visuel/fonctionnel supposé "comme le GAS", relire le code GAS correspondant plutôt que deviner — plusieurs écarts trouvés cette session venaient d'un portage approximatif (ex: badges Platine/Diamant/Légendaire qui avaient perdu leurs facettes, page Classement avec des noms de champs invalides).
