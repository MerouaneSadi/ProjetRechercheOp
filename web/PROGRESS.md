# PROGRESS — Suivi d'avancement

**Dernière mise à jour** : 2026-04-23 — projet essentiellement terminé

## Statut global

- [x] Initialisation git + `.gitignore` + `README.md`
- [x] Rédaction de `CONTEXT.md` et `PROGRESS.md`
- [x] Squelette `index.html` avec 3 onglets
- [x] `style.css` (tables monospace alignées, thème clair)
- [x] Parsing `.txt` → structure en mémoire (avec validation équilibre)
- [x] Fonction générique d'affichage de matrice/proposition (HTML + texte)
- [x] Algorithme Nord-Ouest
- [x] Calcul du coût total
- [x] Algorithme Balas-Hammer (avec étapes journalisées : pénalités, ex-aequo, arête)
- [x] BFS test d'acyclicité + détection de cycle (via reconstruction LCA)
- [x] Maximisation sur cycle (+ gestion δ = 0 par suppression d'une seule arête '-' à valeur min — évite le cycling)
- [x] BFS test de connexité + affichage des sous-graphes
- [x] Complétion pour connexité non dégénérée (arêtes de coût croissant, valeur 0)
- [x] Calcul des potentiels E, F par propagation itérative
- [x] Table coûts potentiels + coûts marginaux
- [x] Orchestration marche-pied avec potentiel (boucle jusqu'à optimal)
- [x] Onglet Résolution fonctionnel : upload/saisie + choix algo + trace complète
- [x] Bouton "Télécharger la trace" avec nommage `{groupe}-{equipe}-traceN-{no|bh}.txt`
- [x] Génération des 12 fichiers `problems/probleme_XX.txt`
- [x] Onglet « Problèmes prédéfinis » (12 cartes, résolution auto + auto-download de la trace)
- [x] Onglet « Étude de complexité » (générateur aléatoire + Chart.js + enveloppe sup.)
- [x] Export CSV des résultats de complexité
- [x] Relecture des cas limites (dégénérescence, marginaux ex-aequo, 1×1, P_i=0)
- [ ] Vérification finale des formules pour les problèmes 11 et 12 (user doit confirmer
      dans son 2e message — en attendant, formules du prompt initial appliquées)
- [ ] Test visuel dans un vrai navigateur (Chrome/Firefox) — à faire par l'utilisateur

## Résultats des tests

- **12 problèmes du sujet** : NO et BH convergent tous deux vers le même optimum :
  - Pb 1 (2×2) : 3000 — NO 2 iter, BH 1 iter
  - Pb 2 (2×2) : 2000 — NO 1 iter, BH 1 iter
  - Pb 3 (2×2) : 33 000 — NO 2 iter, BH 1 iter
  - Pb 4 (2×2) : 12 700 — NO 2 iter, BH 1 iter
  - Pb 5 (3×3) : 425 — NO 3 iter, BH 1 iter
  - Pb 6 (3×4) : 2880 — NO 5 iter, BH 3 iter
  - Pb 7 (4×2) : 16 000 — NO 2 iter, BH 1 iter
  - Pb 8 (5×2) : 17 600 — NO 3 iter, BH 1 iter
  - Pb 9 (7×3) : 5700 — NO 6 iter, BH 2 iter
  - Pb 10 (3×7) : 54 000 — NO 3 iter, BH 1 iter
  - Pb 11 (20×10) : 279 150 — NO 2 iter, BH 1 iter
  - Pb 12 (10×16) : 173 600 — NO/BH 1 iter (BH trouve directement l'optimum)
- **120 problèmes aléatoires** 5×5 à 20×20 (30 seeds par taille) : 120/120 convergent
- **Cas limites testés** : 1×1 OK, P_i=0 OK, déséquilibre correctement rejeté,
  format invalide correctement rejeté.

## Tâche en cours / à reprendre

**Projet terminé côté code.** Il reste à faire par l'utilisateur :
1. Ouvrir `index.html` dans un navigateur et tester visuellement les 3 onglets.
2. Générer les 24 traces pour le rendu (via l'onglet « Problèmes prédéfinis » :
   cliquer « Résoudre (NO) » puis « Résoudre (BH) » pour chacun des 12 problèmes.
   Chaque clic télécharge automatiquement la trace.
3. Rédiger le rapport de 5 pages sur la complexité (à partir des données
   exportables en CSV depuis l'onglet « Étude de complexité »).

## Décisions d'architecture finales

- Une seule page, 3 onglets JS avec nav simple.
- Un seul `app.js` (~1600 lignes) — pas de modules, site 100 % statique,
  ouvrable en `file://` sans serveur.
- Tables alignées via `<table>` CSS monospace + fonction `formaterMatriceTexte`
  avec padding espace pour les traces `.txt`.
- Graphe biparti représenté implicitement par la matrice `proposition`
  (`null` = pas d'arête, nombre = quantité).
- Sommets numérotés 0..n-1 = fournisseurs, n..n+m-1 = clients.
- Convention maximisation : UNE SEULE arête '-' à valeur min est supprimée
  par pivot (évite le cycling en cas d'égalité multiple / δ=0).
- Les 12 problèmes sont à la fois dans `problems/probleme_XX.txt` ET en dur
  dans `app.js` sous `PROBLEMES_PREDEFINIS` (évite les soucis CORS en `file://`).

## Commits

```
d1981ed  feat: onglet etude de complexite avec Chart.js + export CSV
8fe3830  feat: 12 problemes predefinis (.txt + donnees en dur) et onglet dedie
20be911  docs: update progress - marche-pied termine, reste problemes+complexite
c86b6f8  feat: marche-pied complet (BFS, cycle, connexite, potentiels, orchestration)
e86e6da  feat: parsing .txt, affichage aligne, Nord-Ouest, cout total, Balas-Hammer
13f053f  feat: squelette HTML/CSS/JS avec navigation 3 onglets
469ab42  docs: ajout fichiers de suivi PROGRESS.md et CONTEXT.md
35c79c8  chore: initialisation du projet
```

## Structure finale

```
.
├── .git/
├── .gitignore
├── README.md           documentation utilisateur
├── CONTEXT.md          contexte technique (pour reprise de session)
├── PROGRESS.md         ce fichier
├── index.html          page unique, 3 onglets
├── style.css           styles (tables monospace alignées)
├── app.js              toute la logique (~1600 lignes)
└── problems/
    ├── probleme_01.txt ... probleme_12.txt
```
