/* ================================================================
 * Projet Recherche Opérationnelle — S6 Efrei
 * Résolution de problèmes de transport par la méthode du
 * marche-pied avec potentiel.
 *
 * Ce fichier contient TOUTE la logique du site :
 *   - Gestion des 3 onglets (Résolution / Problèmes / Complexité)
 *   - Parsing du fichier .txt
 *   - Affichage des tables (HTML + texte aligné pour la trace)
 *   - Algorithmes Nord-Ouest et Balas-Hammer
 *   - BFS (acyclicité, connexité), maximisation sur cycle
 *   - Calcul des potentiels et des coûts marginaux
 *   - Boucle du marche-pied
 *   - Étude de complexité (génération aléatoire, Chart.js, export CSV)
 *
 * Convention : commentaires et noms d'identifiants en français.
 * Indices internes : 0-based. Affichage : 1-based (P1, C1...).
 * ================================================================ */

'use strict';

/* ================================================================
 * ÉTAT GLOBAL
 * ================================================================ */

const etat = {
    // Entrée courante (onglet Résolution)
    entree: null,           // {n, m, couts, provisions, commandes}

    // Résultat de la dernière exécution
    resolution: {
        algoInit: 'NO',
        trace: '',          // texte complet de la trace, prêt à télécharger
        numProbleme: 0
    },

    // Onglet complexité
    complexite: {
        enCours: false,
        stopDemande: false,
        mesures: {}         // { n: { thetaNO:[], thetaBH:[], tNO:[], tBH:[] } }
    },

    // Identification par défaut pour le nommage des traces
    groupe: 2,
    equipe: 4
};

/* ================================================================
 * NAVIGATION ENTRE ONGLETS
 * ================================================================ */

function initNavigation() {
    const boutons = document.querySelectorAll('.btn-onglet');
    const sections = document.querySelectorAll('.onglet');

    boutons.forEach(btn => {
        btn.addEventListener('click', () => {
            const cible = btn.dataset.onglet;
            boutons.forEach(b => b.classList.toggle('actif', b === btn));
            sections.forEach(s => {
                s.classList.toggle('actif', s.id === 'onglet-' + cible);
            });
        });
    });
}

/* ================================================================
 * INITIALISATION AU CHARGEMENT
 * ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    // Les autres initialisations (parsing, résolution, complexité, problèmes)
    // seront branchées au fur et à mesure de l'implémentation.
});
