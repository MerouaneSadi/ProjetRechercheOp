# PROGRESS — Suivi d'avancement

> Mis à jour très souvent. En début de session, lire ce fichier AVANT de
> toucher au code.

**Dernière mise à jour** : 2026-04-23 (début de projet)

## Statut global

- [x] Initialisation git + `.gitignore` + `README.md`
- [x] Rédaction de `CONTEXT.md` et `PROGRESS.md`
- [ ] **EN COURS** : proposition d'architecture à l'utilisateur + attente feu vert
- [ ] Squelette `index.html` avec 3 onglets
- [ ] `style.css` (tables monospace alignées)
- [ ] Parsing `.txt` → structure en mémoire
- [ ] Fonction générique d'affichage de matrice/proposition (HTML + texte)
- [ ] Algorithme Nord-Ouest
- [ ] Calcul du coût total
- [ ] Algorithme Balas-Hammer (avec étapes visibles)
- [ ] BFS test d'acyclicité + détection de cycle
- [ ] Maximisation sur cycle (+ gestion δ = 0)
- [ ] BFS test de connexité + affichage sous-graphes
- [ ] Complétion pour connexité non dégénérée
- [ ] Calcul des potentiels E, F
- [ ] Table coûts potentiels + coûts marginaux
- [ ] Orchestration marche-pied avec potentiel (boucle)
- [ ] Génération des 12 fichiers `problems/probleme_XX.txt`
- [ ] Onglet « Problèmes prédéfinis » (boutons + chargement)
- [ ] Onglet « Résolution » (upload + saisie manuelle + choix algo)
- [ ] Génération et téléchargement de la trace
- [ ] Onglet « Étude de complexité » (générateur aléatoire, mesures, Chart.js)
- [ ] Export CSV des résultats de complexité
- [ ] Relecture des cas limites (dégénérescence, δ=0, marginaux ex-aequo)
- [ ] Vérification des formules pour les problèmes 11 et 12 (attente message user)

## Dernière tâche complétée

Rédaction initiale de `CONTEXT.md` et `PROGRESS.md`. Premier commit
`chore: initialisation du projet` effectué.

## Tâche en cours

**Proposer l'architecture au user et attendre son feu vert.**

Points à présenter :
1. Arborescence des fichiers.
2. Structure HTML (3 `<section>` toggleables via nav).
3. Modèle d'état JS (un objet `etat` avec sous-objets pour chaque onglet).
4. Séparation calcul / affichage.
5. Ordre d'implémentation proposé (déjà indiqué par l'user, à confirmer).
6. Questions ouvertes : vérification formules problèmes 11/12, noms de
   groupe/équipe à afficher par défaut sur les traces.

## Prochaine tâche

Après feu vert : créer le squelette `index.html` + `style.css` + `app.js`
minimal avec les 3 onglets navigables (sans logique métier). Commit
`feat: squelette HTML/CSS/JS avec navigation 3 onglets`.

## Décisions d'architecture (ne pas remettre en cause sans raison)

- Une seule page, 3 onglets JS.
- Un seul `app.js` (pas de modules, site 100 % statique).
- Tables alignées via `<table>` stylé en monospace + largeurs fixes.
- Traces téléchargées : texte pur, alignement par padding espace.
- Graphe biparti représenté implicitement par la matrice `proposition`
  (`null` = pas d'arête, nombre = quantité, y compris 0 pour arête
  dégénérée).

## Bugs connus / points en suspens

- (aucun pour l'instant)

## Questions ouvertes pour le user

- Confirmation du numéro de groupe et d'équipe par défaut pour le nommage
  des traces (cf. sujet : `2-4-traceX-no.txt`). Je prévois un champ
  saisissable dans l'UI avec valeurs par défaut `2` et `4`.
- Confirmation des valeurs exactes pour les problèmes 11 et 12 (user a
  indiqué qu'il enverrait un 2e message).
