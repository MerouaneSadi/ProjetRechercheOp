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
    entree: null,           // {n, m, couts, provisions, commandes}
    resolution: {
        algoInit: 'NO',
        trace: '',          // texte complet de la trace, prêt à télécharger
        numProbleme: 0
    },
    complexite: {
        enCours: false,
        stopDemande: false,
        mesures: {}
    },
    groupe: 2,
    equipe: 4
};

/* ================================================================
 * 1. PARSING DU FICHIER .TXT
 * ================================================================ */

/**
 * lireFichierTxt(texte) — parse un tableau de contraintes au format du sujet.
 *
 * Pseudo-code :
 *   1. découper le texte en lignes, supprimer lignes vides
 *   2. lire n et m sur la première ligne
 *   3. lire n lignes ; chaque ligne a m+1 entiers (coûts + provision)
 *   4. lire la dernière ligne : m entiers (commandes)
 *   5. vérifier l'équilibre Σ Pi == Σ Cj ; sinon lever une erreur.
 *
 * Renvoie {n, m, couts, provisions, commandes}.
 */
function lireFichierTxt(texte) {
    const lignes = texte.split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

    if (lignes.length < 2) {
        throw new Error("Fichier invalide : pas assez de lignes.");
    }

    // Première ligne : n et m
    const tete = lignes[0].split(/\s+/).map(Number);
    if (tete.length < 2 || !Number.isInteger(tete[0]) || !Number.isInteger(tete[1])) {
        throw new Error("Ligne 1 : on attend deux entiers n et m.");
    }
    const n = tete[0], m = tete[1];
    if (n < 1 || m < 1) {
        throw new Error("n et m doivent être ≥ 1.");
    }

    if (lignes.length !== n + 2) {
        throw new Error(
            `Nombre de lignes incorrect : attendu ${n + 2} (1 en-tête + ${n} fournisseurs + 1 commandes), reçu ${lignes.length}.`
        );
    }

    // n lignes de coûts + provision
    const couts = [];
    const provisions = [];
    for (let i = 0; i < n; i++) {
        const vals = lignes[1 + i].split(/\s+/).map(Number);
        if (vals.length !== m + 1) {
            throw new Error(`Ligne ${i + 2} : on attend ${m + 1} entiers (m coûts + 1 provision), reçu ${vals.length}.`);
        }
        if (vals.some(x => !Number.isFinite(x))) {
            throw new Error(`Ligne ${i + 2} : valeur non numérique.`);
        }
        couts.push(vals.slice(0, m));
        provisions.push(vals[m]);
    }

    // Dernière ligne : commandes
    const commandes = lignes[n + 1].split(/\s+/).map(Number);
    if (commandes.length !== m) {
        throw new Error(`Dernière ligne : on attend ${m} entiers (commandes), reçu ${commandes.length}.`);
    }
    if (commandes.some(x => !Number.isFinite(x))) {
        throw new Error(`Dernière ligne : valeur non numérique.`);
    }

    // Validation de l'équilibre
    const sommeP = provisions.reduce((a, b) => a + b, 0);
    const sommeC = commandes.reduce((a, b) => a + b, 0);
    if (sommeP !== sommeC) {
        throw new Error(
            `Problème non équilibré : Σ Pᵢ = ${sommeP}, Σ Cⱼ = ${sommeC}. Seul le cas équilibré est supporté.`
        );
    }

    return { n, m, couts, provisions, commandes };
}

/* ================================================================
 * 2. FONCTIONS D'AFFICHAGE
 * ------------------------------------------------------------------
 * Objectif critique du sujet : les tables NE DOIVENT JAMAIS se décaler.
 * On garantit l'alignement :
 *   - en HTML via <table> monospace + min-width uniforme par colonne
 *   - en texte (pour la trace .txt) via padding à espaces.
 * ================================================================ */

/**
 * formaterNombre(x) — rendu texte d'une cellule.
 *   - null ou undefined -> '.'
 *   - nombre fini -> entier si entier, sinon 2 décimales
 */
function formaterNombre(x) {
    if (x === null || x === undefined) return '.';
    if (typeof x !== 'number' || !Number.isFinite(x)) return String(x);
    if (Number.isInteger(x)) return String(x);
    return x.toFixed(2);
}

/**
 * padGauche(chaine, largeur) — ajoute des espaces à gauche pour atteindre largeur.
 */
function padGauche(s, largeur) {
    s = String(s);
    if (s.length >= largeur) return s;
    return ' '.repeat(largeur - s.length) + s;
}
function padDroite(s, largeur) {
    s = String(s);
    if (s.length >= largeur) return s;
    return s + ' '.repeat(largeur - s.length);
}

/**
 * formaterMatriceTexte — produit une représentation texte ALIGNÉE.
 *
 * options = {
 *   titre: string,
 *   entetesColonnes: ['C1', 'C2', ...] (taille m),
 *   entetesLignes: ['P1', 'P2', ...]   (taille n),
 *   colonneSupp: { titre:'Prov', valeurs:[...n] }  // optionnel
 *   ligneSupp:   { titre:'Com',  valeurs:[...m] }  // optionnel
 *   surligner: Set de clés "i,j" à surligner (pour ref visuelle uniquement)
 * }
 *
 * Pseudo-code :
 *   1. pour chaque colonne (entêtes + ligne supp), calculer largeur = max(longueur)
 *   2. idem pour la colonne "entêtes de ligne"
 *   3. assembler ligne par ligne en paddant à gauche.
 */
function formaterMatriceTexte(matrice, options) {
    const opt = options || {};
    const n = matrice.length;
    const m = n > 0 ? matrice[0].length : 0;

    const entL = opt.entetesLignes || Array.from({length: n}, (_, i) => 'P' + (i + 1));
    const entC = opt.entetesColonnes || Array.from({length: m}, (_, j) => 'C' + (j + 1));
    const colSupp = opt.colonneSupp || null;
    const ligSupp = opt.ligneSupp || null;

    // Colonne "entêtes de ligne" : largeur = max des longueurs
    let largEntL = 0;
    entL.forEach(e => largEntL = Math.max(largEntL, e.length));
    if (ligSupp) largEntL = Math.max(largEntL, ligSupp.titre.length);

    // Pour chaque colonne de données (0..m-1), largeur = max(entête, toutes valeurs, ligne supp)
    const larg = new Array(m).fill(0);
    for (let j = 0; j < m; j++) {
        larg[j] = Math.max(larg[j], entC[j].length);
        for (let i = 0; i < n; i++) {
            larg[j] = Math.max(larg[j], formaterNombre(matrice[i][j]).length);
        }
        if (ligSupp) {
            larg[j] = Math.max(larg[j], formaterNombre(ligSupp.valeurs[j]).length);
        }
    }

    // Colonne supplémentaire (ex. Provision)
    let largColSupp = 0;
    if (colSupp) {
        largColSupp = colSupp.titre.length;
        for (let i = 0; i < n; i++) {
            largColSupp = Math.max(largColSupp, formaterNombre(colSupp.valeurs[i]).length);
        }
    }

    // Construction
    const lignes = [];
    if (opt.titre) {
        lignes.push(opt.titre);
        lignes.push('─'.repeat(opt.titre.length));
    }

    // En-tête
    let ligneEnt = padGauche('', largEntL);
    for (let j = 0; j < m; j++) ligneEnt += ' | ' + padGauche(entC[j], larg[j]);
    if (colSupp) ligneEnt += ' || ' + padGauche(colSupp.titre, largColSupp);
    lignes.push(ligneEnt);

    // Séparateur
    let sep = '─'.repeat(largEntL);
    for (let j = 0; j < m; j++) sep += '─┼─' + '─'.repeat(larg[j]);
    if (colSupp) sep += '─╫─' + '─'.repeat(largColSupp);
    lignes.push(sep);

    // Corps
    for (let i = 0; i < n; i++) {
        let l = padGauche(entL[i], largEntL);
        for (let j = 0; j < m; j++) {
            l += ' | ' + padGauche(formaterNombre(matrice[i][j]), larg[j]);
        }
        if (colSupp) l += ' || ' + padGauche(formaterNombre(colSupp.valeurs[i]), largColSupp);
        lignes.push(l);
    }

    // Ligne supp (commandes)
    if (ligSupp) {
        let sep2 = '─'.repeat(largEntL);
        for (let j = 0; j < m; j++) sep2 += '─┼─' + '─'.repeat(larg[j]);
        if (colSupp) sep2 += '─╫─' + '─'.repeat(largColSupp);
        lignes.push(sep2);
        let l = padGauche(ligSupp.titre, largEntL);
        for (let j = 0; j < m; j++) {
            l += ' | ' + padGauche(formaterNombre(ligSupp.valeurs[j]), larg[j]);
        }
        if (colSupp) l += ' || ' + padGauche('', largColSupp);
        lignes.push(l);
    }

    return lignes.join('\n');
}

/**
 * formaterMatriceHTML — version HTML de la précédente.
 * Même options, produit une <table class="matrice-ro"> avec caption.
 * Les classes CSS assurent l'alignement (monospace + padding uniforme).
 */
function formaterMatriceHTML(matrice, options) {
    const opt = options || {};
    const n = matrice.length;
    const m = n > 0 ? matrice[0].length : 0;
    const entL = opt.entetesLignes || Array.from({length: n}, (_, i) => 'P' + (i + 1));
    const entC = opt.entetesColonnes || Array.from({length: m}, (_, j) => 'C' + (j + 1));
    const colSupp = opt.colonneSupp || null;
    const ligSupp = opt.ligneSupp || null;
    const surligner = opt.surligner || new Set();
    const classeCell = opt.classeCell || null; // (i,j,val) -> string

    let html = '<table class="matrice-ro">';
    if (opt.titre) html += `<caption>${escapeHtml(opt.titre)}</caption>`;
    // En-têtes
    html += '<thead><tr><th class="coin"></th>';
    for (let j = 0; j < m; j++) html += `<th>${escapeHtml(entC[j])}</th>`;
    if (colSupp) html += `<th class="coin">${escapeHtml(colSupp.titre)}</th>`;
    html += '</tr></thead>';

    html += '<tbody>';
    for (let i = 0; i < n; i++) {
        html += `<tr><th>${escapeHtml(entL[i])}</th>`;
        for (let j = 0; j < m; j++) {
            const val = matrice[i][j];
            const estVide = (val === null || val === undefined);
            const classes = [];
            if (estVide) classes.push('vide');
            if (surligner.has(i + ',' + j)) classes.push('surligne');
            if (classeCell) {
                const c = classeCell(i, j, val);
                if (c) classes.push(c);
            }
            const cls = classes.length ? ` class="${classes.join(' ')}"` : '';
            html += `<td${cls}>${escapeHtml(formaterNombre(val))}</td>`;
        }
        if (colSupp) html += `<th>${escapeHtml(formaterNombre(colSupp.valeurs[i]))}</th>`;
        html += '</tr>';
    }
    if (ligSupp) {
        html += `<tr><th>${escapeHtml(ligSupp.titre)}</th>`;
        for (let j = 0; j < m; j++) {
            html += `<th>${escapeHtml(formaterNombre(ligSupp.valeurs[j]))}</th>`;
        }
        if (colSupp) html += '<th class="coin"></th>';
        html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ================================================================
 * 3. NORD-OUEST
 * ================================================================ */

/**
 * propositionNordOuest(n, m, provisions, commandes)
 *
 * Pseudo-code :
 *   i <- 0 ; j <- 0
 *   P <- copie de provisions ; C <- copie de commandes
 *   proposition <- matrice n×m de null
 *   tant que i < n et j < m :
 *     q <- min(P[i], C[j])
 *     proposition[i][j] <- q   (même si q = 0, pour marquer l'arête)
 *     P[i] -= q ; C[j] -= q
 *     si P[i] == 0 : i++
 *     sinon j++
 *   renvoyer proposition
 *
 * Remarque : en cas d'égalité simultanée on n'incrémente que i (convention).
 */
function propositionNordOuest(n, m, provisions, commandes) {
    const P = provisions.slice();
    const C = commandes.slice();
    const prop = Array.from({length: n}, () => new Array(m).fill(null));
    let i = 0, j = 0;
    while (i < n && j < m) {
        const q = Math.min(P[i], C[j]);
        prop[i][j] = q;
        P[i] -= q;
        C[j] -= q;
        if (P[i] === 0 && C[j] === 0) {
            // Épuisement simultané : on avance en ligne, on marquera la dégénérescence plus tard
            i++;
        } else if (P[i] === 0) {
            i++;
        } else {
            j++;
        }
    }
    return prop;
}

/* ================================================================
 * 4. COÛT TOTAL
 * ================================================================ */

/**
 * calculerCoutTotal(couts, proposition)
 * Renvoie Σᵢⱼ couts[i][j] × proposition[i][j] (en ignorant les null).
 */
function calculerCoutTotal(couts, proposition) {
    let total = 0;
    const n = proposition.length;
    const m = n > 0 ? proposition[0].length : 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            const q = proposition[i][j];
            if (q !== null && q !== undefined) total += couts[i][j] * q;
        }
    }
    return total;
}

/* ================================================================
 * 5. BALAS-HAMMER
 * ------------------------------------------------------------------
 * À chaque étape :
 *   - calculer la pénalité de chaque ligne et colonne non épuisée
 *     (pénalité = écart entre les deux plus petits coûts disponibles ;
 *      s'il n'y a qu'une case dispo dans la ligne/colonne, la pénalité
 *      est ce seul coût, convention courante)
 *   - choisir la ligne (ou colonne) de pénalité max ; à égalité on
 *     prend le plus petit indice (ligne avant colonne en cas d'égalité
 *     complète, mais on peut garder trace des ex-aequo pour la trace)
 *   - dans cette ligne/colonne on remplit la case de plus petit coût
 *     avec q = min(P restant, C restant)
 *   - on met à jour P et C ; si P ou C tombe à 0, on désactive la
 *     ligne/colonne correspondante.
 * ================================================================ */

/**
 * propositionBalasHammer(couts, provisions, commandes, journal?)
 *
 * journal, s'il est fourni, est une fonction à laquelle on passe
 * des objets décrivant les étapes (pour afficher la trace).
 */
function propositionBalasHammer(couts, provisions, commandes, journal) {
    const n = provisions.length;
    const m = commandes.length;
    const P = provisions.slice();
    const C = commandes.slice();
    const ligneActive = new Array(n).fill(true);
    const colActive = new Array(m).fill(true);
    const prop = Array.from({length: n}, () => new Array(m).fill(null));
    const log = journal || function(){};

    let etape = 0;

    while (ligneActive.some(Boolean) && colActive.some(Boolean)) {
        etape++;

        // Pénalités par ligne
        const penL = new Array(n).fill(null);
        for (let i = 0; i < n; i++) {
            if (!ligneActive[i]) continue;
            const coutsDispo = [];
            for (let j = 0; j < m; j++) {
                if (colActive[j]) coutsDispo.push(couts[i][j]);
            }
            if (coutsDispo.length === 0) continue;
            coutsDispo.sort((a, b) => a - b);
            penL[i] = coutsDispo.length >= 2
                ? coutsDispo[1] - coutsDispo[0]
                : coutsDispo[0];
        }
        // Pénalités par colonne
        const penC = new Array(m).fill(null);
        for (let j = 0; j < m; j++) {
            if (!colActive[j]) continue;
            const coutsDispo = [];
            for (let i = 0; i < n; i++) {
                if (ligneActive[i]) coutsDispo.push(couts[i][j]);
            }
            if (coutsDispo.length === 0) continue;
            coutsDispo.sort((a, b) => a - b);
            penC[j] = coutsDispo.length >= 2
                ? coutsDispo[1] - coutsDispo[0]
                : coutsDispo[0];
        }

        // Recherche de la pénalité maximale
        let max = -Infinity;
        for (let i = 0; i < n; i++) if (penL[i] !== null && penL[i] > max) max = penL[i];
        for (let j = 0; j < m; j++) if (penC[j] !== null && penC[j] > max) max = penC[j];

        const lignesMax = [];
        const colonnesMax = [];
        for (let i = 0; i < n; i++) if (penL[i] === max) lignesMax.push(i);
        for (let j = 0; j < m; j++) if (penC[j] === max) colonnesMax.push(j);

        // Choix : on prend la première ligne/colonne trouvée ; on journalise les ex-aequo
        // Convention : lignes d'abord, puis colonnes ; en cas d'égalité, plus petit indice.
        let choixType, choixIdx;
        if (lignesMax.length > 0) {
            choixType = 'L';
            choixIdx = lignesMax[0];
        } else {
            choixType = 'C';
            choixIdx = colonnesMax[0];
        }

        // Dans la ligne/colonne choisie, trouver la case de coût minimal
        let iChoisi, jChoisi, coutMin = Infinity;
        if (choixType === 'L') {
            iChoisi = choixIdx;
            for (let j = 0; j < m; j++) {
                if (colActive[j] && couts[iChoisi][j] < coutMin) {
                    coutMin = couts[iChoisi][j];
                    jChoisi = j;
                }
            }
        } else {
            jChoisi = choixIdx;
            for (let i = 0; i < n; i++) {
                if (ligneActive[i] && couts[i][jChoisi] < coutMin) {
                    coutMin = couts[i][jChoisi];
                    iChoisi = i;
                }
            }
        }

        const q = Math.min(P[iChoisi], C[jChoisi]);
        prop[iChoisi][jChoisi] = q;
        P[iChoisi] -= q;
        C[jChoisi] -= q;

        // Journal (pour la trace)
        log({
            etape,
            penalitesL: penL.slice(),
            penalitesC: penC.slice(),
            penaliteMax: max,
            lignesMax: lignesMax.slice(),
            colonnesMax: colonnesMax.slice(),
            choixType, choixIdx,
            areteChoisie: [iChoisi, jChoisi],
            quantite: q,
            provisionsRestantes: P.slice(),
            commandesRestantes: C.slice()
        });

        // Désactivation
        if (P[iChoisi] === 0 && C[jChoisi] === 0) {
            // Cas d'épuisement simultané : on désactive UNE des deux.
            // Pour éviter la dégénérescence trop tôt, on désactive la ligne
            // (convention) et on garde la colonne active, sauf s'il n'y a
            // plus aucune autre ligne active utilisable.
            ligneActive[iChoisi] = false;
            // La prochaine itération mettra en évidence qu'aucune ligne
            // active n'est compatible avec la colonne résiduelle si c'est
            // le cas ; on gérera ceci proprement via le test "boucle tant
            // qu'il reste des lignes ET colonnes actives avec Pi/Cj > 0".
            // Pour rester robuste, on désactive aussi la colonne si aucune
            // autre ligne active ne peut la satisfaire.
            if (!ligneActive.some(a => a)) colActive[jChoisi] = false;
        } else if (P[iChoisi] === 0) {
            ligneActive[iChoisi] = false;
        } else if (C[jChoisi] === 0) {
            colActive[jChoisi] = false;
        }
    }

    return prop;
}

/* ================================================================
 * 6. GRAPHE BIPARTI ET BFS
 * ------------------------------------------------------------------
 * Le graphe de transport associé à une proposition a n+m sommets :
 *   - sommet i (0..n-1)   = fournisseur i
 *   - sommet n+j (0..m-1) = client j
 * Il y a une arête entre f_i et c_j ssi proposition[i][j] !== null.
 * (La valeur peut être 0 pour une arête dégénérée, peu importe : on
 *  s'intéresse ici à la STRUCTURE du graphe.)
 * ================================================================ */

/**
 * construireAdjacence(proposition) -> tableau de tableaux d'entiers.
 * adj[u] = liste des voisins du sommet u.
 */
function construireAdjacence(proposition) {
    const n = proposition.length;
    const m = n > 0 ? proposition[0].length : 0;
    const adj = Array.from({length: n + m}, () => []);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            if (proposition[i][j] !== null && proposition[i][j] !== undefined) {
                adj[i].push(n + j);
                adj[n + j].push(i);
            }
        }
    }
    return adj;
}

/* ================================================================
 * 6.a TEST D'ACYCLICITÉ + DÉTECTION DU CYCLE (BFS)
 * ------------------------------------------------------------------
 * Pseudo-code :
 *   pour chaque sommet non visité :
 *     BFS ; pour chaque arête (u,v) examinée :
 *       si v non visité : marquer, parent[v] <- u, enqueue
 *       sinon si v != parent[u] : CYCLE → reconstruire via LCA
 *   renvoyer acyclique si aucun cycle trouvé.
 * ================================================================ */

function trouverCycle(proposition) {
    const n = proposition.length;
    const m = n > 0 ? proposition[0].length : 0;
    const S = n + m;
    const adj = construireAdjacence(proposition);
    const visite = new Array(S).fill(false);
    const parent = new Array(S).fill(-1);
    const distance = new Array(S).fill(-1);

    for (let debut = 0; debut < S; debut++) {
        if (visite[debut]) continue;
        if (adj[debut].length === 0) { visite[debut] = true; continue; }
        visite[debut] = true;
        parent[debut] = -1;
        distance[debut] = 0;
        const file = [debut];
        while (file.length > 0) {
            const u = file.shift();
            for (const v of adj[u]) {
                if (!visite[v]) {
                    visite[v] = true;
                    parent[v] = u;
                    distance[v] = distance[u] + 1;
                    file.push(v);
                } else if (v !== parent[u]) {
                    // Cycle détecté via l'arête (u,v)
                    const cycle = reconstruireCycle(parent, distance, u, v);
                    return { acyclique: false, cycle };
                }
            }
        }
    }
    return { acyclique: true, cycle: null };
}

/**
 * reconstruireCycle via l'ascendance : on ramène u et v à la même distance
 * en remontant le plus éloigné, puis on remonte les deux en parallèle
 * jusqu'à leur ancêtre commun (LCA). Le cycle est la concaténation des
 * deux demi-chemins.
 */
function reconstruireCycle(parent, distance, u, v) {
    const cheminU = [];
    const cheminV = [];
    while (distance[u] > distance[v]) { cheminU.push(u); u = parent[u]; }
    while (distance[v] > distance[u]) { cheminV.push(v); v = parent[v]; }
    while (u !== v) {
        cheminU.push(u); cheminV.push(v);
        u = parent[u]; v = parent[v];
    }
    const lca = u;
    return cheminU.concat([lca], cheminV.reverse());
}

/**
 * sommetsEnAretes(cycle, n) — convertit une liste de sommets en liste
 * d'arêtes [i,j] de la proposition (biparti). Lève si non biparti.
 */
function sommetsEnAretes(cycle, n) {
    const k = cycle.length;
    const aretes = [];
    for (let idx = 0; idx < k; idx++) {
        const a = cycle[idx];
        const b = cycle[(idx + 1) % k];
        if (a < n && b >= n) aretes.push([a, b - n]);
        else if (b < n && a >= n) aretes.push([b, a - n]);
        else throw new Error("Cycle non biparti (impossible).");
    }
    return aretes;
}

/* ================================================================
 * 6.b MAXIMISATION SUR CYCLE
 * ------------------------------------------------------------------
 * Pseudo-code :
 *   cycle = suite d'arêtes alternantes + / - / + / - ...
 *   delta = min des b_{i,j} sur les arêtes '-'
 *   proposition[+] += delta, proposition[-] -= delta
 *   toutes les arêtes '-' qui atteignent 0 sont supprimées
 *   (convention sujet : « éventuellement plusieurs »).
 *   Si delta = 0 : amélioration du sujet, à traiter par l'orchestrateur.
 * ================================================================ */

/**
 * @param {Array} proposition  matrice actuelle
 * @param {Array} cycle        liste de sommets [s0,s1,...,sk-1]
 * @param {Array|null} aretePlus  [i,j] : arête qui doit être à '+' ; si null,
 *                                on prend l'arête 0 du cycle comme '+'.
 * @returns { proposition', delta, signes, aretes, aretesSupprimees }
 */
function maximiserSurCycle(proposition, cycle, aretePlus) {
    const n = proposition.length;
    const m = n > 0 ? proposition[0].length : 0;
    const aretes = sommetsEnAretes(cycle, n);
    const k = aretes.length;

    let positionPlus = 0;
    if (aretePlus) {
        positionPlus = aretes.findIndex(([i,j]) => i === aretePlus[0] && j === aretePlus[1]);
        if (positionPlus === -1) throw new Error("Arête '+' introuvable dans le cycle.");
    }
    const signes = new Array(k);
    for (let idx = 0; idx < k; idx++) {
        signes[idx] = ((idx - positionPlus + k) % 2 === 0) ? '+' : '-';
    }

    // δ = min des valeurs sur les '-'
    let delta = Infinity;
    let premiereMin = -1;  // index dans le cycle de la première arête '-' à valeur δ
    for (let idx = 0; idx < k; idx++) {
        if (signes[idx] === '-') {
            const [i, j] = aretes[idx];
            const v = proposition[i][j] || 0;
            if (v < delta) { delta = v; premiereMin = idx; }
        }
    }
    if (!Number.isFinite(delta)) delta = 0;

    // Convention standard pour maintenir un arbre couvrant à n+m-1 arêtes :
    // on supprime EXACTEMENT UNE arête '-' ayant la valeur minimale δ
    // (en cas d'ex-aequo, la première rencontrée dans l'ordre du cycle).
    // Cela évite le cycling lorsque δ=0 (arête '+' prend la place).
    const nouvProp = proposition.map(r => r.slice());
    const aretesSupprimees = [];
    for (let idx = 0; idx < k; idx++) {
        const [i, j] = aretes[idx];
        const v = nouvProp[i][j] || 0;
        if (signes[idx] === '+') {
            nouvProp[i][j] = v + delta;
        } else {
            const nv = v - delta;
            if (idx === premiereMin) {
                nouvProp[i][j] = null;
                aretesSupprimees.push([i, j]);
            } else {
                nouvProp[i][j] = nv;
            }
        }
    }

    return { proposition: nouvProp, delta, signes, aretes, aretesSupprimees };
}

/* ================================================================
 * 6.c TEST DE CONNEXITÉ (BFS)
 * ------------------------------------------------------------------
 * Parcourt chaque composante par BFS et renvoie la liste des
 * composantes (chacune = liste de sommets).
 * ================================================================ */

function estConnexe(proposition) {
    const n = proposition.length;
    const m = n > 0 ? proposition[0].length : 0;
    const S = n + m;
    const adj = construireAdjacence(proposition);
    const visite = new Array(S).fill(false);
    const composantes = [];

    for (let debut = 0; debut < S; debut++) {
        if (visite[debut]) continue;
        // Un sommet sans arête = composante réduite à lui-même
        // → contribue au nombre de composantes (dégénérescence).
        const comp = [];
        visite[debut] = true;
        const file = [debut];
        while (file.length > 0) {
            const u = file.shift();
            comp.push(u);
            for (const v of adj[u]) {
                if (!visite[v]) { visite[v] = true; file.push(v); }
            }
        }
        composantes.push(comp);
    }
    return { connexe: composantes.length === 1, composantes };
}

/**
 * nomSommet(s, n) : 'P_i' (1-based) pour fournisseur, 'C_j' pour client.
 */
function nomSommet(s, n) {
    if (s < n) return 'P' + (s + 1);
    return 'C' + (s - n + 1);
}

/* ================================================================
 * 6.d COMPLÉTION POUR CONNEXITÉ NON DÉGÉNÉRÉE
 * ------------------------------------------------------------------
 * Pseudo-code :
 *   tant que non connexe :
 *     identifier les composantes
 *     choisir l'arête (i,j) de coût minimal telle que
 *       - (i,j) absente de la proposition
 *       - f_i et c_j sont dans des composantes différentes
 *     ajouter cette arête avec valeur 0 (arête dégénérée)
 * ================================================================ */

function completerPourConnexite(proposition, couts) {
    const n = proposition.length;
    const m = n > 0 ? proposition[0].length : 0;
    let prop = proposition.map(r => r.slice());
    const aretesAjoutees = [];

    while (true) {
        const { connexe, composantes } = estConnexe(prop);
        if (connexe) break;

        const idComp = new Array(n + m).fill(-1);
        for (let c = 0; c < composantes.length; c++) {
            for (const s of composantes[c]) idComp[s] = c;
        }

        let meilleure = null;
        let coutMin = Infinity;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                if (prop[i][j] !== null && prop[i][j] !== undefined) continue;
                if (idComp[i] === idComp[n + j]) continue;
                if (couts[i][j] < coutMin) {
                    coutMin = couts[i][j];
                    meilleure = [i, j];
                }
            }
        }
        if (!meilleure) {
            // ne devrait pas arriver sur un graphe biparti complet
            throw new Error("Complétion impossible : aucune arête disponible.");
        }
        prop[meilleure[0]][meilleure[1]] = 0;
        aretesAjoutees.push(meilleure);
    }
    return { proposition: prop, aretesAjoutees };
}

/* ================================================================
 * 6.e POTENTIELS (E, F) + COÛTS POTENTIELS + MARGINAUX
 * ------------------------------------------------------------------
 * Convention : E_0 = 0. Pour chaque arête (i,j) de la proposition :
 *   E_i + F_j = couts[i][j].
 * On propage par passes successives jusqu'à stabilité.
 * Si un potentiel n'est pas calculé à la fin, la proposition est
 * dégénérée (non-connexe) et la complétion doit être refaite.
 * ================================================================ */

function calculerPotentiels(proposition, couts) {
    const n = proposition.length;
    const m = n > 0 ? proposition[0].length : 0;
    const E = new Array(n).fill(null);
    const F = new Array(m).fill(null);
    E[0] = 0;

    let progres = true;
    while (progres) {
        progres = false;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                const val = proposition[i][j];
                if (val === null || val === undefined) continue;
                if (E[i] !== null && F[j] === null) {
                    F[j] = couts[i][j] - E[i];
                    progres = true;
                } else if (E[i] === null && F[j] !== null) {
                    E[i] = couts[i][j] - F[j];
                    progres = true;
                }
            }
        }
    }

    const nonCalcules = [];
    for (let i = 0; i < n; i++) if (E[i] === null) nonCalcules.push('E' + (i + 1));
    for (let j = 0; j < m; j++) if (F[j] === null) nonCalcules.push('F' + (j + 1));
    return { E, F, nonCalcules };
}

function coutsPotentielsEtMarginaux(E, F, couts) {
    const n = couts.length;
    const m = n > 0 ? couts[0].length : 0;
    const potentiels = Array.from({length: n}, () => new Array(m));
    const marginaux  = Array.from({length: n}, () => new Array(m));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            const ei = E[i], fj = F[j];
            if (ei === null || fj === null) {
                potentiels[i][j] = null; marginaux[i][j] = null;
            } else {
                potentiels[i][j] = ei + fj;
                marginaux[i][j]  = couts[i][j] - (ei + fj);
            }
        }
    }
    return { potentiels, marginaux };
}

/* ================================================================
 * 7. ORCHESTRATION DU MARCHE-PIED AVEC POTENTIEL
 * ------------------------------------------------------------------
 * Pseudo-code général :
 *   tant que non optimal et iter < maxIter :
 *     afficher proposition + coût
 *     répéter :
 *       si la proposition contient un cycle → maximiser pour le briser
 *     jusqu'à acyclique
 *     si non connexe → compléter avec arêtes de coût croissant
 *     calculer potentiels
 *     calculer coûts potentiels et marginaux
 *     si tous les marginaux ≥ 0 → OPTIMAL, sortir
 *     sinon :
 *       choisir arête améliorante (marginal le plus négatif)
 *       l'ajouter avec valeur 0 → crée un cycle
 *       maximiser sur ce cycle (+ gestion δ=0)
 * ================================================================ */

function marchePiedPotentiel(entree, propositionInit, options) {
    options = options || {};
    const maxIter = options.maxIter || 200;
    const log = options.log || function(){};
    const { n, m, couts, provisions, commandes } = entree;

    let prop = propositionInit.map(r => r.slice());
    let iter = 0;
    let optimal = false;
    let atteintMaxIter = false;

    while (iter < maxIter) {
        iter++;
        const cout = calculerCoutTotal(couts, prop);
        log('\n═══════════════════════════════════════════════════════════════');
        log(`ITÉRATION ${iter}`);
        log('═══════════════════════════════════════════════════════════════');
        log(formaterMatriceTexte(prop, {
            titre: `Proposition (itération ${iter})`,
            colonneSupp: { titre: 'Prov', valeurs: provisions },
            ligneSupp:   { titre: 'Com',  valeurs: commandes }
        }));
        log(`\nCoût total : ${cout}`);

        // 1. Briser tous les cycles existants (un cycle par tour)
        let bouclier = 0;
        while (bouclier++ < 100) {
            const { acyclique, cycle } = trouverCycle(prop);
            if (acyclique) {
                log('Proposition acyclique : OK.');
                break;
            }
            log('\nCycle détecté : ' + cycle.map(s => nomSommet(s, n)).join(' → ') + ' → ' + nomSommet(cycle[0], n));
            const maxi = maximiserSurCycle(prop, cycle, null);
            log(`Conditions des cases : ${maxi.aretes.map(([i,j],k) => `${maxi.signes[k]}(P${i+1},C${j+1})=${prop[i][j]}`).join(', ')}`);
            log(`δ = ${maxi.delta}`);
            prop = maxi.proposition;
            log('Arête supprimée : ' + maxi.aretesSupprimees.map(([i,j]) => `(P${i+1},C${j+1})`).join(', '));
        }

        // 2. Test de connexité + complétion
        const { connexe, composantes } = estConnexe(prop);
        let aretesAjouteesConnexite = [];
        if (!connexe) {
            log(`\nProposition non connexe : ${composantes.length} composantes.`);
            composantes.forEach((comp, idx) => {
                log(`  Composante ${idx + 1} : ${comp.map(s => nomSommet(s, n)).join(', ')}`);
            });
            const res = completerPourConnexite(prop, couts);
            prop = res.proposition;
            aretesAjouteesConnexite = res.aretesAjoutees;
            log('Arêtes ajoutées pour connexité (coût croissant, valeur 0) : ' +
                res.aretesAjoutees.map(([i,j]) => `(P${i+1},C${j+1}) coût ${couts[i][j]}`).join(', '));
        } else {
            log('Proposition connexe : OK.');
        }

        // 3. Potentiels
        const { E, F, nonCalcules } = calculerPotentiels(prop, couts);
        if (nonCalcules.length > 0) {
            log(`ERREUR : potentiels non calculables (${nonCalcules.join(', ')}). Abandon.`);
            break;
        }
        log('\nPotentiels :');
        log('  E = [' + E.map((v, i) => `E${i+1}=${v}`).join(', ') + ']');
        log('  F = [' + F.map((v, j) => `F${j+1}=${v}`).join(', ') + ']');

        // 4. Coûts potentiels et marginaux
        const { potentiels, marginaux } = coutsPotentielsEtMarginaux(E, F, couts);
        log('');
        log(formaterMatriceTexte(potentiels, { titre: 'Coûts potentiels C^p_{i,j} = E_i + F_j' }));
        log('');
        log(formaterMatriceTexte(marginaux, { titre: 'Coûts marginaux M_{i,j} = a_{i,j} − C^p_{i,j}' }));

        // 5. Test d'optimalité
        let minMarg = 0;
        let areteEntrante = null;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                if (prop[i][j] !== null && prop[i][j] !== undefined) continue;
                if (marginaux[i][j] !== null && marginaux[i][j] < minMarg) {
                    minMarg = marginaux[i][j];
                    areteEntrante = [i, j];
                }
            }
        }
        if (!areteEntrante) {
            log('\n✔ Tous les marginaux sont ≥ 0 : OPTIMAL.');
            optimal = true;
            break;
        }
        log(`\nMeilleure arête améliorante : (P${areteEntrante[0]+1},C${areteEntrante[1]+1}) avec marginal ${minMarg}.`);

        // 6. Ajouter l'arête entrante avec valeur 0 et trouver le cycle créé
        prop[areteEntrante[0]][areteEntrante[1]] = 0;
        const resCycle = trouverCycle(prop);
        if (resCycle.acyclique) {
            log('Anomalie : aucun cycle après ajout de l\'arête entrante. Arrêt.');
            break;
        }
        log('Cycle formé : ' + resCycle.cycle.map(s => nomSommet(s, n)).join(' → ') + ' → ' + nomSommet(resCycle.cycle[0], n));
        const maxi = maximiserSurCycle(prop, resCycle.cycle, areteEntrante);
        log(`Conditions : ${maxi.aretes.map(([i,j],k) => `${maxi.signes[k]}(P${i+1},C${j+1})=${prop[i][j]}`).join(', ')}`);
        log(`δ = ${maxi.delta}`);
        prop = maxi.proposition;
        log('Arête supprimée : ' + maxi.aretesSupprimees.map(([i,j]) => `(P${i+1},C${j+1})`).join(', '));
        if (maxi.delta === 0) {
            log('(δ = 0 : pivotement sans changement de coût, changement de base uniquement)');
        }
    }

    if (iter >= maxIter && !optimal) atteintMaxIter = true;
    const coutFinal = calculerCoutTotal(couts, prop);
    log('\n═══════════════════════════════════════════════════════════════');
    if (optimal) log(`RÉSULTAT : proposition optimale en ${iter} itérations. Coût final = ${coutFinal}.`);
    else if (atteintMaxIter) log(`ARRÊT : limite d'itérations (${maxIter}) atteinte. Coût courant = ${coutFinal}.`);
    else log(`ARRÊT prématuré à l'itération ${iter}. Coût courant = ${coutFinal}.`);
    log('═══════════════════════════════════════════════════════════════');
    log(formaterMatriceTexte(prop, {
        titre: 'Proposition finale',
        colonneSupp: { titre: 'Prov', valeurs: provisions },
        ligneSupp:   { titre: 'Com',  valeurs: commandes }
    }));
    log(`\nCoût total final : ${coutFinal}`);

    return { propositionFinale: prop, coutFinal, iter, optimal, atteintMaxIter };
}

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
 * GESTION DE L'ONGLET RÉSOLUTION (provisoire : affiche l'entrée)
 * ================================================================ */

function afficherApercuEntree(entree) {
    const zone = document.getElementById('zone-apercu-entree');
    if (!entree) { zone.innerHTML = ''; return; }
    zone.innerHTML = formaterMatriceHTML(entree.couts, {
        titre: `Matrice des coûts (${entree.n}×${entree.m})`,
        colonneSupp: { titre: 'Prov', valeurs: entree.provisions },
        ligneSupp:   { titre: 'Com',  valeurs: entree.commandes }
    });
}

function initResolution() {
    // Upload fichier
    document.getElementById('input-fichier').addEventListener('change', async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        try {
            const texte = await f.text();
            etat.entree = lireFichierTxt(texte);
            document.getElementById('input-texte').value = texte;
            afficherApercuEntree(etat.entree);
        } catch (err) {
            afficherApercuErreur(err.message);
        }
    });

    // Bouton "Charger ce texte"
    document.getElementById('btn-charger-texte').addEventListener('click', () => {
        const texte = document.getElementById('input-texte').value;
        try {
            etat.entree = lireFichierTxt(texte);
            afficherApercuEntree(etat.entree);
        } catch (err) {
            afficherApercuErreur(err.message);
        }
    });

    // Bouton "Charger un exemple"
    document.getElementById('btn-exemple').addEventListener('click', () => {
        const ex = `4 3
30 20 20 450
10 50 20 250
50 40 30 250
30 20 30 450
500 600 300`;
        document.getElementById('input-texte').value = ex;
        try {
            etat.entree = lireFichierTxt(ex);
            afficherApercuEntree(etat.entree);
        } catch (err) {
            afficherApercuErreur(err.message);
        }
    });

    document.getElementById('btn-lancer-resolution').addEventListener('click', () => {
        if (!etat.entree) {
            afficherApercuErreur("Aucun problème chargé.");
            return;
        }
        const algo = document.querySelector('input[name="algo-init"]:checked').value;
        etat.resolution.algoInit = algo;
        etat.groupe = parseInt(document.getElementById('input-groupe').value) || 2;
        etat.equipe = parseInt(document.getElementById('input-equipe').value) || 4;
        etat.resolution.numProbleme = parseInt(document.getElementById('input-num-probleme').value) || 0;

        const trace = executerResolutionComplete(etat.entree, algo);
        etat.resolution.trace = trace;
        document.getElementById('zone-trace').textContent = trace;
        document.getElementById('btn-telecharger-trace').disabled = false;
    });

    // Bouton télécharger la trace
    document.getElementById('btn-telecharger-trace').addEventListener('click', () => {
        if (!etat.resolution.trace) return;
        const algo = etat.resolution.algoInit === 'NO' ? 'no' : 'bh';
        const nom = `${etat.groupe}-${etat.equipe}-trace${etat.resolution.numProbleme}-${algo}.txt`;
        telechargerTexte(etat.resolution.trace, nom);
    });
}

/* ================================================================
 * EXÉCUTION COMPLÈTE D'UN PROBLÈME (proposition initiale + marche-pied)
 * Renvoie le texte complet de la trace.
 * ================================================================ */

function executerResolutionComplete(entree, algo) {
    const { n, m, couts, provisions, commandes } = entree;
    const lignes = [];
    const log = (s) => lignes.push(s);

    log('╔═══════════════════════════════════════════════════════════════╗');
    log('║    RÉSOLUTION D\'UN PROBLÈME DE TRANSPORT                      ║');
    log('║    Méthode : marche-pied avec potentiel                       ║');
    log('╚═══════════════════════════════════════════════════════════════╝');
    log('');
    log(`Taille : n=${n} fournisseurs, m=${m} clients`);
    log(`Somme des provisions : ${provisions.reduce((a,b)=>a+b,0)}`);
    log(`Somme des commandes  : ${commandes.reduce((a,b)=>a+b,0)}`);
    log('');
    log(formaterMatriceTexte(couts, {
        titre: 'Matrice des coûts unitaires',
        colonneSupp: { titre: 'Prov', valeurs: provisions },
        ligneSupp:   { titre: 'Com',  valeurs: commandes }
    }));
    log('');

    // ---------- Proposition initiale ----------
    let proposition;
    log('───────────────────────────────────────────────────────────────');
    if (algo === 'NO') {
        log('PROPOSITION INITIALE : algorithme du coin Nord-Ouest');
        log('───────────────────────────────────────────────────────────────');
        proposition = propositionNordOuest(n, m, provisions, commandes);
    } else {
        log('PROPOSITION INITIALE : algorithme de Balas-Hammer');
        log('───────────────────────────────────────────────────────────────');
        proposition = propositionBalasHammer(couts, provisions, commandes, (info) => {
            const ligCol = info.choixType === 'L' ? `ligne P${info.choixIdx+1}` : `colonne C${info.choixIdx+1}`;
            const exAequo = (info.lignesMax.length + info.colonnesMax.length > 1)
                ? ` (ex-aequo : ${info.lignesMax.map(i=>'L'+(i+1)).concat(info.colonnesMax.map(j=>'C'+(j+1))).join(', ')})`
                : '';
            log(`Étape ${info.etape} : pénalité max = ${info.penaliteMax} sur ${ligCol}${exAequo} ; ` +
                `case choisie (P${info.areteChoisie[0]+1},C${info.areteChoisie[1]+1}) ; quantité = ${info.quantite}`);
        });
    }
    log('');
    log(formaterMatriceTexte(proposition, {
        titre: `Proposition initiale (${algo === 'NO' ? 'Nord-Ouest' : 'Balas-Hammer'})`,
        colonneSupp: { titre: 'Prov', valeurs: provisions },
        ligneSupp:   { titre: 'Com',  valeurs: commandes }
    }));
    log(`Coût initial : ${calculerCoutTotal(couts, proposition)}`);
    log('');

    // ---------- Marche-pied ----------
    log('───────────────────────────────────────────────────────────────');
    log('MARCHE-PIED AVEC POTENTIEL');
    log('───────────────────────────────────────────────────────────────');
    const res = marchePiedPotentiel(entree, proposition, { log, maxIter: 200 });

    return lignes.join('\n');
}

/* ================================================================
 * TÉLÉCHARGEMENT DE TEXTE (trace)
 * ================================================================ */

function telechargerTexte(texte, nomFichier) {
    const blob = new Blob([texte], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function afficherApercuErreur(msg) {
    const zone = document.getElementById('zone-apercu-entree');
    zone.innerHTML = `<div class="msg-erreur">${escapeHtml(msg)}</div>`;
}

/* ================================================================
 * INITIALISATION AU CHARGEMENT
 * ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initResolution();
});
