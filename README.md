# Projet RO — Problème de transport (Java / Maven / CLI)

Projet Java (CLI) qui résout des problèmes de transport **équilibrés** :
- proposition initiale **Nord-Ouest** ou **Balas-Hammer**
- optimisation par la méthode du **marche-pied (Stepping Stone) avec potentiels**
- génération de **traces texte** et **export CSV** pour l’étude de complexité

## Pré-requis

- **JDK 17**
- **Maven**

## Structure du repo (partie Java)

```
.
├── java/                # projet Maven (sources + jar)
├── traces/              # traces générées (24 fichiers NO/BH)
└── complexite/          # export CSV des mesures
```

## Build

Depuis la racine du repo :

```bash
cd java
mvn -q package
```

## Lancer la CLI

Depuis la racine du repo :

```bash
java -jar java/target/transport-ro-1.0.0.jar
```

## Problèmes fournis

Les 12 instances `probleme_01.txt` … `probleme_12.txt` sont chargées depuis :

- `java/src/main/resources/problems/`

## Générer les 24 traces (rendu)

Dans la CLI :
- `2) Générer les 24 traces`
- saisir `Groupe` puis `Équipe`

Les fichiers sont écrits dans `traces/` au format demandé :
- `GROUPE-EQUIPE-traceX-no.txt`
- `GROUPE-EQUIPE-traceX-bh.txt`

## Étude de complexité (export CSV)

Dans la CLI :
- `3) Étude de complexité (export CSV)`
- `1) Mode PDF` (tailles imposées + 100 runs) ou `2) Custom`

Sortie : `complexite/mesures.csv`

Schéma CSV :

```
n,run,thetaNO_ns,thetaBH_ns,tNO_ns,tBH_ns,totalNO_ns,totalBH_ns,maxIter,seed
```

