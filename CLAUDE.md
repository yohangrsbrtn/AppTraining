# AppTrainingPWA

PWA coaching hébergée sur GitHub Pages, backend GAS partagé.

- **URL live** : https://yohangrsbrtn.github.io/AppTraining/
- **Backend** : `https://script.google.com/macros/s/AKfycbwQiM6ixf-CTIWwcuNHoosFbvrDzWmC056yRUGhTaWv0Nwxbm0dLeK3d5QVgqmS7P9G7A/exec`
- **Référence visuelle/fonctionnelle** : `../AppTraining/Index.html` et `../AppTraining/Code.js` — source de vérité. La PWA doit se comporter *exactement* comme le GAS, sauf demande explicite contraire.

## Déploiement

- Push sur `main` = déploiement automatique. Pousser après chaque modification, sans demander confirmation.
- GAS : `clasp push && clasp deploy --deploymentId AKfycbwQiM6ixf-CTIWwcuNHoosFbvrDzWmC056yRUGhTaWv0Nwxbm0dLeK3d5QVgqmS7P9G7A` depuis `/Users/yohangrosbertin/Desktop/AppTraining`.
- **Ajouter un client** : `CLIENTS` + `CLIENT_NOMS` dans `Code.js` → redéployer le GAS. Ajouter une ligne dans la feuille `Clients` seule ne suffit pas.

## Architecture

- `index.html` — CSS, état global `S`, routage `setPage()`/`render()`, accueil, classement, profil, réglages
- `console.html` — tableau de bord coach (noir + or, sidebar, autonome, charge juste `api.js`). Lit `localStorage` (`at_coach`/`at_token`) posé par une connexion coach dans `index.html`. Pages : Accueil, Clients, Bilans, Classement, Protocole, Base alimentaire, Programmes, Diètes, **Fiche client** (`state.nav='fiche-client'`). **Piège** : `listerClientsAvecNiveaux()` renvoie un `JSON.stringify` — toujours `JSON.parse` côté client. `data.clients` exclut systématiquement `yohan`.
- **Fiche client** (`console.html`) : page dédiée dans `#main` (pas un panneau latéral). `openPanel(id)` positionne `state.nav='fiche-client'` et charge en parallèle (Promise.all) : profil Supabase (`client_profiles`), programme assigné, diète assignée, mensurations GAS (`apiAs('chargerMensurations', id)`), notes coach. `ficheData` = état global `{ loaded, profil, programme, diete, mensurations, notes }`. `renderFicheClientPage(el)` affiche un spinner tant que `loaded=false`, puis le contenu complet. Sidebar garde "Clients" actif quand `state.nav==='fiche-client'`.
- **Supabase `client_profiles`** : table `{ client_id PK, email, date_debut, jour_bilan, age, taille_cm, objectif, updated_at }` — données coach éditables, sans équivalent Sheets. Upsert via `on_conflict=client_id`. Le nom du client reste lu depuis `data.clients` (GAS), pas stocké dans cette table.
- `api.js` — `api()`/`apiAs()`. `_viewAsClientOverride` : quand posé, toutes les requêtes `api()` utilisent ce client — mécanisme "vue client" coach (`enterVueClient`/`exitVueClient`).
- `bilan.js`, `training.js`, `diete.js`, `mensurations.js`, `recettes.js`, `progression.js`, `collection.js`, `coach.js`, `protocole.js` — une page par fichier
- **Préchargement** : `_pf` (cache), `schedulerPrechargement()`/`precharger()` relancent le chargement à chaque atterrissage sur l'accueil ou sur Bilan/Programme/Diète/Mensurations. `_pfSession` s'incrémente à chaque bascule d'identité.
- **`apiEtendreBilan()`** (`api.js`) : sérialise tous les appels à `chargerBilan`/`chargerJourneeEnCours` via file d'attente — utiliser systématiquement, jamais en parallèle.
- **XP/niveau** : `rafraichirProgressionEtDeblocages()` (`collection.js`) = seul point de vérité après tout gain d'XP. Ne jamais patcher `S.data.prog` manuellement.
- **`showLoadingOverlay()`/`hideLoadingOverlay()`** : pour les actions/navigations courtes, à la place de `setPage('loading')` (spinner plein écran réservé au premier chargement).
- **Supabase** (nouvelles fonctionnalités coach) : tables `notes_coach`, `exercices`, `programme_templates/blocs/seances/seance_exercices`, `diete_templates/repas/repas_aliments`, `client_programmes`, `client_dietes`, `client_profiles`. RLS ouverte à `anon`. Assignation de programmes/diètes à un client réel → passer par `AppTraining-Sandbox`/`AppTrainingDatabase` d'abord.
- **Diètes console** : aliments dans un repas = snapshot (pas FK), macros recalculées à l'affichage depuis `quantite_g × valeur_par_gramme`. `sucres/fibres/ags` = `null` pour la base coach (≠ 0).
- **Programmes console** : sauvegarde = upsert template + delete cascade + réinsertion arborescence. Mapping après réinsertion par colonne `ordre` (Postgres ne garantit pas l'ordre d'un insert multi-lignes).
- **Mes menus + Mon journal** (`diete.js`) : `MenuId = 'M'+Date.now()`, stable même si le nom change. Slot journal = numéro choisi par le client. Diète cible stockée comme pseudo-slot `Slot=0, Type='cible'`. `_dMenuDraft.cible` = lecture seule, jamais un champ de saisie.
- **`getBadgeSVG`/`TITRES_DEF`/`BADGES_NIVEAU`** (`collection.js`) : utilisés partout — toute modif style y est faite une seule fois.

## Pièges connus

- **`chargerBilan` et `chargerJourneeEnCours` appellent toutes deux `etendreBilan()` côté serveur** — ne JAMAIS les appeler en parallèle. `loadHome()` utilise `chargerJourneeEnCours`.
- **`validerBilan` et `validerEtEnvoyerBilan` renvoient un `JSON.stringify`** — toujours `typeof raw === 'string' ? JSON.parse(raw) : raw`. `listerClientsAvecNiveaux` aussi.
- **Feuille Bilan** : col C = date validation. Col U (21) = "Valide Bilan" fusionnée 7 lignes (écrite par `validerBilan`). Col V (22) = validation quotidienne par jour (`validerJournee`), non fusionnée.
- **Règle permanente : `font-size` ≥ 16px** sur tout `input`/`textarea`/`select` — en dessous, Safari iOS zoome au focus sans dézoomer.
- **Le "Guide & Fonctionnement" dans Paramètres doit rester synchro avec le comportement réel** — ne pas copier le texte GAS s'il décrit un ancien comportement.
- **Déblocage niveau/titre** (`collection.js`) : n'exclut QUE `_viewAsClientOverride`, pas `S.isCoach` — le coach voit ses propres passages de niveau comme un client.
- **Palette** (`index.html :root`) : fond page `#0f1117`, fond carte `#1a1d29`, bordure `#2d3142`, texte secondaire `#8892a4`. Pas de bordure visible sur les cartes — uniquement contraste de fond.
- **`logActivite` déduplique sur `client|programme|semaine|type`** — `semaine` DOIT être unique par occurrence réelle (numéro de semaine ou date), jamais une valeur constante (ex: `"SEMAINE"` ou nom du jour) sinon `mettreAJourStats` est sauté silencieusement. Tout nouveau type passé à `logActivite` doit être ajouté à `TYPES_CONNUS` dans `chargerTousLesLogs` ET son libellé dans `renderNotificationsCoach` (`coach.js`) et `afficherLogs` (`Index.html`).
- **Bilan en retard** : `joursDepuis >= 2 || (joursDepuis === 1 && minutesNow > 730)`. Logique dupliquée dans `envoyerBilanAuCoach` et `verifierRetardBilan` — répercuter tout correctif sur les deux.
- **XP côté serveur uniquement** — toute action accordant de l'XP fixe le montant serveur, jamais reçu du client.
- **Mode simplifié** (`localStorage['modeSimplifie']`, par appareil) : cache XP/progression/classement. Toute nouvelle UI XP doit vérifier `modeSimplifieActif()`.
- **Protocole "chimie"** : lecture seule, ne jamais écrire dans la feuille `Protocol`. Colonne J de `Clients` = ChimieActif. Onglet Analyses : feuille `Analyses` client (tidy `Date|Marqueur|Valeur|Unité|RefMin|RefMax`), extraction PDF/photo faite manuellement via Claude chat → xlsx à coller.
- **Notifications push (FCM)** : code en place, cassé sur iPhone coach (bug iOS non résoluble) — ne pas re-déboguer sans nouvel élément.
- **Feuille `Clients`** : col A=id, B=nom, C=hash MDP (SHA-256), D=date 1ère connexion, F=niveau, G=dernière connexion, H=titreActif, I=token FCM, J=ChimieActif. G ≠ mot de passe.
- **Login en 2 temps** : `verifierClient` → écran MDP (jamais de pré-aiguillage avant saisie — court-circuiterait le code maître coach). Écran "Crée ton MDP" uniquement si le serveur renvoie `sans_mot_de_passe`.
- **Base alimentaire** : valeurs par GRAMME. Base coach (`copie de base`) : kcal/prot/glu/lip seulement — `sucres/fibres/ags = null`. Entrées communautaires ont tous les champs. `deleteRow` décale les numéros de ligne → toujours refetch après suppression. Dates Sheets auto-converties en objet Date → utiliser `_fmtDateJournal()`/`_fmtDateHeureCommunaute()` pour les relire.
- **`_guardAction(fn, this)`** (`diete.js`) : tous les boutons d'action de la page Diète passent par là — grise le bouton + bloque les clics concurrents. Un double-tap sans ça crée des doublons côté serveur.
- **`null` vs `[]`** (`diete.js`) : `_dMenus`/`_dJournal` = `null` tant que jamais chargés, `[]` une fois confirmés vides. Un échec réseau laisse à `null` → afficher "Erreur de chargement + Réessayer", jamais "liste vide".
- **`modifierMenu`** : supprime + réinsère toutes les lignes en conservant le même `MenuId` — indispensable si un slot journal référence déjà ce menu.
- **Open Food Facts** (console Base alimentaire et scan mobile) : requête à la demande uniquement, jamais d'import en masse. Mobile : `html5-qrcode` + `_arreterScan()` coupe la caméra à chaque sortie.

## Workflow

- Push git sans demander confirmation (sauf action destructive).
- Avant tout changement visuel/fonctionnel "comme le GAS", relire le code GAS correspondant.
