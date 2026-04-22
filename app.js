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

    // Bouton lancer (provisoire : pour l'instant juste NO ou BH + coût, pas le marche-pied)
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

        const { n, m, couts, provisions, commandes } = etat.entree;
        let proposition;
        let traceEtapes = [];
        if (algo === 'NO') {
            proposition = propositionNordOuest(n, m, provisions, commandes);
            traceEtapes.push('--- Proposition initiale : Nord-Ouest ---');
        } else {
            proposition = propositionBalasHammer(couts, provisions, commandes, (info) => {
                traceEtapes.push(
                    `Étape BH n°${info.etape} : ` +
                    `pénalité max = ${info.penaliteMax}, ` +
                    `choix ${info.choixType}${info.choixIdx + 1}, ` +
                    `case (${info.areteChoisie[0] + 1},${info.areteChoisie[1] + 1}), ` +
                    `quantité = ${info.quantite}`
                );
            });
            traceEtapes.unshift('--- Proposition initiale : Balas-Hammer ---');
        }
        const cout = calculerCoutTotal(couts, proposition);

        const trace = []
            .concat(
                `=== PROBLÈME ===`,
                formaterMatriceTexte(couts, {
                    titre: `Matrice des coûts (${n}×${m})`,
                    colonneSupp: { titre: 'Prov', valeurs: provisions },
                    ligneSupp:   { titre: 'Com',  valeurs: commandes }
                }),
                '',
                traceEtapes.join('\n'),
                '',
                formaterMatriceTexte(proposition, {
                    titre: 'Proposition initiale',
                    colonneSupp: { titre: 'Prov', valeurs: provisions },
                    ligneSupp:   { titre: 'Com',  valeurs: commandes }
                }),
                '',
                `Coût total : ${cout}`,
                '',
                '(marche-pied avec potentiel à venir dans les prochaines étapes)'
            ).join('\n');

        etat.resolution.trace = trace;
        document.getElementById('zone-trace').textContent = trace;
        document.getElementById('btn-telecharger-trace').disabled = false;
    });
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
