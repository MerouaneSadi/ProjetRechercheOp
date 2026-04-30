# Transport RO (Java / Maven / CLI)

Sous-projet Java CLI qui lit des problèmes de transport équilibrés au format du sujet, construit une proposition initiale (Nord-Ouest ou Balas-Hammer) puis exécute la méthode du **marche-pied avec potentiels** avec des **traces texte alignées**.

## Build

```bash
mvn -q clean package
```

## Run

```bash
java -jar target/transport-ro-1.0.0.jar
```

## Problèmes fournis

Les 12 instances `probleme_01.txt` … `probleme_12.txt` sont chargées depuis :

- `src/main/resources/problems/`

## Sorties

- Les traces sont exportées dans `traces/` au format demandé :
  - `GROUPE-EQUIPE-traceX-no.txt`
  - `GROUPE-EQUIPE-traceX-bh.txt`

