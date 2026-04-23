# PROGRESS — Suivi d'avancement

> Mis à jour très souvent. En début de session, lire ce fichier AVANT de
> toucher au code.

**Dernière mise à jour** : 2026-04-23 — fin de session (sauvegarde anticipée)

## Statut global

- [x] Initialisation git + `.gitignore` + `README.md`
- [x] Rédaction de `CONTEXT.md` et `PROGRESS.md`
- [x] Squelette `index.html` avec 3 onglets
- [x] `style.css` (tables monospace alignées)
- [x] Parsing `.txt` → structure en mémoire (avec validation équilibre)
- [x] Fonction générique d'affichage de matrice/proposition (HTML + texte)
- [x] Algorithme Nord-Ouest
- [x] Calcul du coût total
- [x] Algorithme Balas-Hammer (avec étapes journalisées)
- [x] BFS test d'acyclicité + détection de cycle (via LCA)
- [x] Maximisation sur cycle (+ gestion δ = 0 par suppression d'une seule arête '-' à valeur min)
- [x] BFS test de connexité + affichage des sous-graphes
- [x] Complétion pour connexité non dégénérée (arêtes de coût croissant, valeur 0)
- [x] Calcul des potentiels E, F par propagation
- [x] Table coûts potentiels + coûts marginaux
- [x] Orchestration marche-pied avec potentiel (boucle jusqu'à optimal)
- [x] Onglet Résolution fonctionnel : upload/saisie + choix algo + trace complète
- [x] Bouton "Télécharger la trace" avec nommage `{groupe}-{equipe}-traceN-{no|bh}.txt`
- [ ] **PROCHAINE ÉTAPE** : génération des 12 fichiers `problems/probleme_XX.txt`
- [ ] Onglet « Problèmes prédéfinis » (boutons + chargement + exécution)
- [ ] Onglet « Étude de complexité » (générateur aléatoire, mesures, Chart.js)
- [ ] Export CSV des résultats de complexité
- [ ] Relecture des cas limites (dégénérescence, marginaux ex-aequo)
- [ ] Vérification des formules pour les problèmes 11 et 12 (attente message user)

## Dernière tâche complétée

**Marche-pied avec potentiel entièrement fonctionnel** (étapes 7 à 11).
Testé avec succès sur :
- les 12 problèmes du sujet (lorsqu'on a pu les construire d'après le prompt
  utilisateur, dont les 11 et 12 selon formules données)
- 120 problèmes aléatoires carrés de tailles 5×5, 10×10, 15×15, 20×20
  (30 seeds chacun) → 120/120 convergent vers le même optimum pour NO et BH.

Correction de bug importante commise : la maximisation sur cycle supprime
désormais UNE SEULE arête '-' à valeur minimale (la première rencontrée).
Cela évite le cycling lorsque δ=0 (pivot de base sans changement de coût).

Fichier `app.js` à ~1000 lignes, syntaxe validée avec `node --check`.

## Tâche en cours / à reprendre

**Étape 12 : générer les 12 fichiers `problems/probleme_XX.txt`**.

- Créer le dossier `problems/`.
- Générer 12 fichiers `.txt` au format attendu par `lireFichierTxt`.
- Les données sont documentées dans le prompt initial (12 problèmes).
- Pour les problèmes 11 et 12, utiliser les formules données :
  - **Pb 11 (20×10)** : `a_{i,j} = 10(i-1) + j` pour `i ∈ [1,20]`, `j ∈ [1,10]`,
    avec exception `a_{5,2} = 41` (pas 42). `P_i = 10·i`,
    `C = [120, 140, 160, 180, 200, 220, 240, 260, 280, 300]`.
  - **Pb 12 (10×16)** : `a_{i,j} = (21 - 2i)·10 + (17 - j)`. `P_i = 160 ∀i`,
    `C_j = 100 ∀j`. Σ P = 1600 = Σ C ✓.
- User a dit : « vérifie les formules en générant puis recoupe avec les annexes
  que je te fournirai dans un 2e message ». **Si l'user n'a pas encore donné
  les valeurs exactes**, partir des formules ci-dessus et noter dans le code
  un commentaire pour dire que ces valeurs sont à re-vérifier.

Après ça :
- Brancher l'onglet « Problèmes prédéfinis » sur ces 12 fichiers (via fetch
  interne ou via données en dur si CORS pose problème en `file://`).
- **Astuce** : pour éviter les soucis CORS quand on ouvre `index.html` en
  `file://`, mieux vaut embarquer aussi les 12 problèmes comme DONNÉES
  EN DUR dans `app.js` (objet `PROBLEMES_PREDEFINIS`), et laisser aussi les
  fichiers `.txt` dans `problems/` pour le rendu final.

## Prochaine tâche (après étape 12)

**Étape 13 : onglet « Problèmes prédéfinis »**
- Pour chaque problème, une carte avec :
  - N° et dimensions (ex. « Pb 5 — 3×3 »),
  - Bouton « Voir le .txt » qui télécharge le `.txt`,
  - Bouton « Résoudre (NO) » qui lance le marche-pied depuis Nord-Ouest,
    affiche le résultat dans l'onglet Résolution et rend la trace
    téléchargeable,
  - Bouton « Résoudre (BH) » idem.
- Affichage grille.

Puis **étape 14** : trace déjà téléchargeable (fait). À tester visuellement
dans le navigateur.

Puis **étape 15-16** : onglet complexité + export CSV.

## Décisions d'architecture (ne pas remettre en cause sans raison)

- Une seule page, 3 onglets JS.
- Un seul `app.js` (pas de modules, site 100 % statique).
- Tables alignées via `<table>` stylé en monospace + largeurs fixes ET
  fonction `formaterMatriceTexte` avec padding espace pour les traces.
- Caractères box-drawing `─┼─╫─` pour séparer les tables en texte.
- Graphe biparti représenté implicitement par la matrice `proposition`
  (`null` = pas d'arête, nombre = quantité, y compris 0 pour arête
  dégénérée).
- Sommets numérotés 0..n-1 = fournisseurs, n..n+m-1 = clients.
- Convention maximisation : UNE SEULE arête '-' à valeur min est supprimée
  par pivot (évite le cycling en cas d'égalité multiple).
- Convention pénalité Balas-Hammer : en cas d'une seule case dispo dans une
  ligne/colonne, pénalité = cette case (usage courant).

## Bugs connus / points en suspens

- **Aucun bug ouvert**. Tous les tests (12 problèmes du sujet + 120
  problèmes aléatoires) convergent vers l'optimal.
- **À faire** : tester visuellement dans le navigateur. Jusqu'à présent,
  tous les tests ont été faits en Node via `indirect eval` sur le code
  tronqué avant la partie DOM.

## Questions ouvertes pour le user

- Confirmation des valeurs exactes pour les problèmes 11 et 12 (user a dit
  qu'il enverrait un 2e message).
- Si l'étude de complexité doit conserver les valeurs `n = 10, 40, 100,
  400, 1000, 4000, 10000` (sujet) ou se contenter des plus petites (plus
  réalistes en JS navigateur). Actuellement l'UI propose par défaut
  `10, 40, 100, 400, 1000` pour rester raisonnable, extensible via le champ.

## Structure actuelle du dépôt

```
.
├── .git/
├── .gitignore
├── README.md
├── CONTEXT.md
├── PROGRESS.md
├── index.html        (3 onglets navigables)
├── style.css         (tables alignées monospace)
└── app.js            (~1000 lignes : parsing + algos + marche-pied + UI résolution)
```

Manque :
- `problems/` (à créer à l'étape 12)
- Branchement UI pour l'onglet « Problèmes prédéfinis »
- Branchement UI pour l'onglet « Étude de complexité »

## Commits réalisés

```
c86b6f8  feat: marche-pied complet (BFS, cycle, connexite, potentiels, orchestration)
e86e6da  feat: parsing .txt, affichage aligne, Nord-Ouest, cout total, Balas-Hammer
13f053f  feat: squelette HTML/CSS/JS avec navigation 3 onglets
469ab42  docs: ajout fichiers de suivi PROGRESS.md et CONTEXT.md
35c79c8  chore: initialisation du projet
```
