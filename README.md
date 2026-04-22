# Projet de Recherche Opérationnelle — Problèmes de Transport

Site web statique (HTML / CSS / JavaScript vanilla) qui résout des problèmes de
transport équilibrés par la méthode du marche-pied avec potentiel, à partir
d'une proposition initiale fournie par l'algorithme Nord-Ouest ou Balas-Hammer.

Projet réalisé dans le cadre du S6 à l'Efrei Paris.

## Lancer le site

Le site est 100 % statique. Il suffit d'ouvrir `index.html` dans un navigateur
récent (Chrome, Firefox, Edge). Aucun serveur n'est nécessaire.

> Note : pour lever les restrictions CORS sur certains navigateurs lors du
> chargement des problèmes pré-remplis, on peut à la place servir le dossier
> avec un mini serveur, par exemple :
>
> ```
> python -m http.server 8000
> ```
>
> puis ouvrir <http://localhost:8000>.

## Dépendances

Aucune dépendance à installer. Seul [Chart.js](https://www.chartjs.org/) est
chargé via CDN, uniquement sur l'onglet « Étude de complexité ».

## Structure des fichiers

```
.
├── index.html           # Page unique avec 3 onglets
├── style.css            # Styles (tables monospace à colonnes alignées)
├── app.js               # Toute la logique (parsing, algos, UI)
├── problems/            # Les 12 problèmes de test en .txt
├── CONTEXT.md           # Contexte du projet (pour reprise de session)
├── PROGRESS.md          # Suivi d'avancement
└── README.md
```

## Les 3 onglets

1. **Résolution** — upload d'un `.txt` ou saisie manuelle, choix de
   l'algorithme initial (Nord-Ouest ou Balas-Hammer), exécution complète du
   marche-pied avec potentiel, affichage pas-à-pas.
2. **Problèmes prédéfinis** — les 12 problèmes de l'annexe sont chargeables en
   un clic. Chaque exécution peut être exportée en trace `.txt`.
3. **Étude de complexité** — génération aléatoire de problèmes carrés,
   mesures de temps, nuages de points (Chart.js) et export CSV.

## Format du fichier `.txt`

```
n m
a_11 a_12 ... a_1m P_1
a_21 a_22 ... a_2m P_2
...
a_n1 a_n2 ... a_nm P_n
C_1  C_2  ... C_m
```

Seul le cas équilibré (Σ Pᵢ = Σ Cⱼ) est supporté.
