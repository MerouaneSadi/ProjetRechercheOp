# CONTEXT — Projet Recherche Opérationnelle (Transport)

> Ce fichier sert de mémoire longue du projet. À lire en priorité au début de
> chaque nouvelle session avant de toucher au code.

## Objectif pédagogique

Projet S6 Efrei — implémenter un solveur de problèmes de transport équilibrés
par la méthode du **marche-pied avec potentiel**, à partir d'une proposition
initiale issue de **Nord-Ouest** ou **Balas-Hammer**. Fournir :

- les 12 traces d'exécution demandées (6 problèmes × 2 algos initiaux — en
  réalité 12 problèmes × 2 = 24 traces potentielles, mais le sujet demande
  « les 12 traces » dans les deux cas NO et BH, à clarifier à l'oral) ;
- un rapport de 5 pages max sur la complexité (Nord-Ouest vs Balas-Hammer).

## Le problème mathématique

- `n` fournisseurs avec provisions `Pᵢ`, `m` clients avec commandes `Cⱼ`.
- Matrice des coûts unitaires `A = (a_{i,j})`.
- Variables de décision : `b_{i,j}` ≥ 0 = quantité transportée de `i` vers `j`.
- Contraintes : `Σⱼ b_{i,j} = Pᵢ`, `Σᵢ b_{i,j} = Cⱼ`.
- Objectif : minimiser `Σᵢⱼ a_{i,j}·b_{i,j}`.
- **Cas équilibré uniquement** : `Σ Pᵢ = Σ Cⱼ`.

## Choix techniques

- **Pas de framework**. HTML + CSS + JS vanilla. Seul Chart.js (CDN) pour
  l'onglet « Étude de complexité ».
- **Page unique** avec 3 onglets gérés en JS (show/hide de `<section>`).
- **Tables alignées** : `<table>` stylé en `font-family: monospace` avec
  largeurs de colonnes fixes en `ch`, padding cohérent. Objectif explicite
  du sujet : les colonnes ne doivent JAMAIS se décaler. Pour les traces
  texte (téléchargement) on utilise un aligneur qui padde à droite/gauche
  avec des espaces.
- **Encodage UTF-8** partout.

## Conventions de nommage

- Fonctions en français, camelCase : `lireFichier`, `calculerCoutTotal`,
  `propositionNordOuest`, `propositionBalasHammer`, `marchePiedPotentiel`,
  `estAcyclique`, `estConnexe`, `detecterCycle`, `maximiserSurCycle`,
  `calculerPotentiels`, `afficherTable`, etc.
- Variables de données :
  - `n`, `m` : dimensions
  - `couts` : matrice `n × m` des coûts unitaires (`a_{i,j}`)
  - `provisions` : vecteur `P` de taille `n`
  - `commandes` : vecteur `C` de taille `m`
  - `proposition` : matrice `n × m` des `b_{i,j}` (null = pas d'arête,
    nombre = quantité sur l'arête, y compris 0 pour arête dégénérée)
  - `potentielsE` : vecteur de taille `n` (`Eᵢ` côté fournisseurs)
  - `potentielsF` : vecteur de taille `m` (`Fⱼ` côté clients)
  - `coutsPotentiels` : matrice `n × m` des `Eᵢ + Fⱼ`
  - `coutsMarginaux` : matrice `n × m` des `a_{i,j} - (Eᵢ + Fⱼ)`
- Une « arête » de la proposition = un couple `(i, j)` tel que
  `proposition[i][j] !== null`. C'est la présence de l'arête qui compte pour
  le graphe biparti, pas la valeur (une arête dégénérée vaut 0 mais existe).

## Modèle de graphe biparti

Le graphe de transport associé à une proposition a `n + m` sommets :
- sommets `f_0, ..., f_{n-1}` (fournisseurs, indexés 0-based en interne)
- sommets `c_0, ..., c_{m-1}` (clients)

Une arête `(f_i, c_j)` existe si et seulement si `proposition[i][j] !== null`.

Pour les parcours BFS, on représente le graphe par listes d'adjacence
construites à la volée depuis `proposition`.

## Les 12 problèmes de test (annexe)

Fichiers `problems/probleme_NN.txt` avec `NN` ∈ `01..12`. Dimensions :

| N° | n × m   | remarques                                 |
|----|---------|-------------------------------------------|
| 1  | 2 × 2   | basique                                   |
| 2  | 2 × 2   | basique                                   |
| 3  | 2 × 2   | P=(600,500) C=(100,1000)                  |
| 4  | 2 × 2   | coûts en croix                            |
| 5  | 3 × 3   | classique                                 |
| 6  | 3 × 4   |                                           |
| 7  | 4 × 2   | P déséquilibrées                          |
| 8  | 5 × 2   |                                           |
| 9  | 7 × 3   |                                           |
| 10 | 3 × 7   | coûts très hétérogènes                    |
| 11 | 20 × 10 | `a_{i,j} = 10(i-1)+j` sauf `a_{5,2}=41`   |
| 12 | 10 × 16 | `a_{i,j} = (21-2i)·10 + (17-j)`, P=C=const |

**À vérifier** : pour 11 et 12, l'utilisateur a indiqué qu'il donnera les
valeurs exactes dans un second message. En attendant on génère par formule
avec les exceptions notées.

## Algorithmes à implémenter

1. `lireFichierTxt(texte)` → `{n, m, couts, provisions, commandes}`
2. `afficherMatrice(matriceOuProposition, titres?)` → HTML table
3. `propositionNordOuest(n, m, provisions, commandes)` → `proposition`
4. `propositionBalasHammer(couts, provisions, commandes)` → `proposition`
   + exposer les étapes (pénalités, ligne/colonne max, arête choisie)
5. `calculerCoutTotal(couts, proposition)` → nombre
6. `estAcyclique(proposition)` via BFS, renvoie `{acyclique, cycle?}`
7. `maximiserSurCycle(proposition, cycle, couts)` → `{proposition', aretesSupprimees}`
8. `estConnexe(proposition)` via BFS, renvoie `{connexe, composantes?}`
9. `completerPourConnexite(proposition, couts)` ajoute arêtes de coût croissant
10. `calculerPotentiels(proposition, couts)` → `{E, F}`
11. `coutsPotentielsEtMarginaux(E, F, couts)` → `{potentiels, marginaux}`
12. `marchePiedPotentiel(entree, propositionInit)` orchestre le tout
13. `genererProblemeAleatoire(n)` pour l'onglet complexité
14. `mesurer(fn, ...)` retourne `{resultat, temps}` via `performance.now()`

## Cas limites à gérer

- **Dégénérescence** : proposition avec moins de `n+m-1` arêtes. On ajoute des
  arêtes de valeur 0 selon des coûts croissants jusqu'à connexité non
  dégénérée.
- **δ = 0** (amélioration du sujet) : maximiser sur cycle ne change rien ; on
  conserve l'arête améliorante, on supprime les arêtes ajoutées au dernier
  test de connexité et on relance le complément.
- **Cycles multiples après maximisation** : re-détecter puis re-maximiser en
  boucle avant le test de connexité.
- **Marginaux également négatifs** : choisir le plus négatif ; à égalité,
  choisir le plus petit `i` puis `j` (déterministe).

## Onglet « Étude de complexité »

- Valeurs de `n` : 10, 40, 100, 400, 1000, 4000, 10000.
- 100 runs par valeur.
- Mesures : `θ_NO`, `θ_BH`, `t_NO` (marche-pied depuis NO), `t_BH` (idem BH).
- Graphes : 6 nuages + enveloppe supérieure + ratio.
- **Garde-fou** : pour `n ≥ 1000`, proposer une option
  « skip marche-pied / limiter itérations » car le marche-pied en JS peut
  être très long. Option « nombre de runs » configurable (défaut 100, mais
  baisser automatiquement pour `n ≥ 4000`).
- Bouton « Exporter CSV ».

## Format des traces téléchargées

Nom : `{groupe}-{equipe}-trace{N°probleme}-{no|bh}.txt`.
Défaut : `2-4-traceX-no.txt` (ou équivalent), champs groupe/équipe saisissables
dans l'UI.

Contenu : texte monospace contenant, à chaque itération :
- matrice des coûts (une seule fois en tête)
- proposition avec coût total
- résultat du test d'acyclicité (+ cycle s'il existe)
- éventuelles modifications (arêtes ajoutées/supprimées)
- potentiels Eᵢ, Fⱼ
- tables coûts potentiels et coûts marginaux
- arête améliorante choisie ou `OPTIMAL`.

## Structure des fichiers (cible)

```
index.html
style.css
app.js
problems/
  probleme_01.txt
  ...
  probleme_12.txt
CONTEXT.md
PROGRESS.md
README.md
.gitignore
```

## Décisions d'architecture déjà prises

- Tout dans un seul `app.js` (pas de modules ES, pour rester 100 % statique
  sans serveur).
- État global minimal : un objet `etat` qui contient l'entrée courante et
  la trace en cours.
- Séparation nette entre **calcul** (fonctions pures renvoyant des données)
  et **affichage** (fonctions qui prennent ces données et produisent du
  HTML ou du texte).
- **Pas d'`alert()`** : tout s'affiche dans des zones du DOM.

## Workflow git

- Branche unique `main`.
- Commits atomiques en français, format conventionnel
  (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `style:`).
- PROGRESS.md mis à jour très souvent, mini-commit `docs: update progress`
  après chaque étape.
