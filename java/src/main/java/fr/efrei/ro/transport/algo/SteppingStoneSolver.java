package fr.efrei.ro.transport.algo;

import fr.efrei.ro.transport.display.TableFormatter;
import fr.efrei.ro.transport.graph.Cycle;
import fr.efrei.ro.transport.graph.GraphUtils;
import fr.efrei.ro.transport.io.TraceWriter;
import fr.efrei.ro.transport.model.Edge;
import fr.efrei.ro.transport.model.TransportPlan;
import fr.efrei.ro.transport.model.TransportProblem;

import java.util.*;

public final class SteppingStoneSolver {

    public static TransportPlan solve(TransportProblem pb, TransportPlan init, TraceWriter trace, int maxIter) {
        int n = pb.n;
        int m = pb.m;
        TransportPlan plan = init.copy();

        final boolean doTrace = (trace != null);
        if (doTrace) {
            trace.line("═══════════════════════════════════════════════════════════════");
            trace.line("MARCHE-PIED AVEC POTENTIEL");
            trace.line("═══════════════════════════════════════════════════════════════");
        }

        for (int iter = 1; iter <= maxIter; iter++) {
            long cost = plan.totalCost(pb.costs);
            if (doTrace) {
                trace.blank();
                trace.line("═══════════════════════════════════════════════════════════════");
                trace.line("ITÉRATION " + iter);
                trace.line("═══════════════════════════════════════════════════════════════");
                trace.block(TableFormatter.formatPlan(plan, "Proposition (itération " + iter + ")",
                        headers("P", n), headers("C", m), pb.supply, pb.demand));
                trace.line("Coût total : " + cost);
            }

            // 1) Briser tous les cycles existants (base doit être un arbre)
            for (int guard = 0; guard < 100; guard++) {
                Optional<Cycle> cyc = GraphUtils.findCycleBFS(plan);
                if (cyc.isEmpty()) {
                    if (doTrace) trace.line("Proposition acyclique : OK.");
                    break;
                }
                Cycle cycle = cyc.get();
                if (doTrace) {
                    trace.blank();
                    trace.line("Cycle détecté : " + prettyCycle(cycle, n));
                }
                PlanUpdate upd = maximizeOnCycle(plan, cycle, null, trace);
                plan = upd.plan;
            }

            // 2) Connexité : compléter par arêtes 0 de coût croissant
            List<List<Integer>> comps = GraphUtils.connectedComponents(plan);
            if (comps.size() > 1) {
                if (doTrace) {
                    trace.blank();
                    trace.line("Proposition non connexe : " + comps.size() + " composantes.");
                    for (int c = 0; c < comps.size(); c++) {
                        trace.line("  Composante " + (c + 1) + " : " + comps.get(c).stream()
                                .map(v -> GraphUtils.vertexName(v, n))
                                .reduce((a, b) -> a + ", " + b).orElse(""));
                    }
                }
                List<Edge> added = completeForConnectivity(plan, pb.costs, comps);
                if (doTrace) {
                    for (Edge e : added) trace.line("Arête ajoutée (valeur 0) : " + e + " coût " + pb.costs[e.i()][e.j()]);
                }
            } else {
                if (doTrace) trace.line("Proposition connexe : OK.");
            }

            // 3) Potentiels
            Potentials pot = computePotentials(plan, pb.costs);
            if (!pot.ok) {
                throw new IllegalStateException("Potentiels non calculables (base dégénérée).");
            }
            if (doTrace) {
                trace.blank();
                trace.line("Potentiels :");
                trace.line("  E = " + pot.prettyE());
                trace.line("  F = " + pot.prettyF());

                // 4) Tables coûts potentiels et marginaux (uniquement pour la trace)
                Double[][] cp = new Double[n][m];
                Double[][] marg = new Double[n][m];
                for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) {
                    cp[i][j] = pot.E[i] + pot.F[j];
                    marg[i][j] = (double) pb.costs[i][j] - cp[i][j];
                }
                trace.blank();
                trace.block(TableFormatter.formatDoubleMatrix(cp, "Coûts potentiels C^p_{i,j} = E_i + F_j"));
                trace.blank();
                trace.block(TableFormatter.formatDoubleMatrix(marg, "Coûts marginaux M_{i,j} = a_{i,j} − C^p_{i,j}"));
            }

            // 5) Optimalité + arête améliorante (marginal le plus négatif hors-base)
            Edge entering = null;
            double best = 0.0;
            for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) if (!plan.isBasic(i, j)) {
                double v = pb.costs[i][j] - (pot.E[i] + pot.F[j]);
                if (v < best) {
                    best = v;
                    entering = new Edge(i, j);
                }
            }
            if (entering == null) {
                if (doTrace) {
                    trace.blank();
                    trace.line("✔ Tous les marginaux sont ≥ 0 : OPTIMAL.");
                }
                break;
            }
            if (doTrace) {
                trace.blank();
                trace.line("Meilleure arête améliorante : " + entering + " avec marginal " + best);
            }

            // 6) Ajouter arête (0) => cycle, puis maximiser
            plan.set(entering.i(), entering.j(), 0);
            Cycle cycle = GraphUtils.findCycleBFS(plan).orElseThrow(() -> new IllegalStateException("Aucun cycle après ajout?"));
            if (doTrace) trace.line("Cycle formé : " + prettyCycle(cycle, n));
            plan = maximizeOnCycle(plan, cycle, entering, trace).plan;
        }

        if (doTrace) {
            trace.blank();
            trace.line("═══════════════════════════════════════════════════════════════");
            trace.line("RÉSULTAT FINAL");
            trace.line("═══════════════════════════════════════════════════════════════");
            trace.block(TableFormatter.formatPlan(plan, "Proposition finale",
                    headers("P", n), headers("C", m), pb.supply, pb.demand));
            trace.line("Coût total final : " + plan.totalCost(pb.costs));
        }
        return plan;
    }

    private static String[] headers(String p, int k) {
        String[] a = new String[k];
        for (int i = 0; i < k; i++) a[i] = p + (i + 1);
        return a;
    }

    private static String prettyCycle(Cycle cycle, int n) {
        List<Integer> vs = cycle.vertices();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < vs.size(); i++) {
            if (i > 0) sb.append(" → ");
            sb.append(GraphUtils.vertexName(vs.get(i), n));
        }
        sb.append(" → ").append(GraphUtils.vertexName(vs.get(0), n));
        return sb.toString();
    }

    @SuppressWarnings("unused")
    private static List<Edge> completeForConnectivity(TransportPlan plan, int[][] costs, List<List<Integer>> comps) {
        // comps est fourni pour la trace, mais on recalcule en boucle pour tenir compte des ajouts.
        int n = plan.n;
        int m = plan.m;

        List<Edge> added = new ArrayList<>();
        while (true) {
            List<List<Integer>> now = GraphUtils.connectedComponents(plan);
            if (now.size() == 1) break;

            int[] id = new int[n + m];
            Arrays.fill(id, -1);
            for (int c = 0; c < now.size(); c++) for (int v : now.get(c)) id[v] = c;

            Edge best = null;
            int bestCost = Integer.MAX_VALUE;
            for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) {
                if (plan.isBasic(i, j)) continue;
                if (id[i] == id[n + j]) continue;
                if (costs[i][j] < bestCost) {
                    bestCost = costs[i][j];
                    best = new Edge(i, j);
                }
            }
            if (best == null) throw new IllegalStateException("Complétion impossible.");
            plan.set(best.i(), best.j(), 0);
            added.add(best);
        }
        return added;
    }

    private static final class Potentials {
        final Double[] E, F;
        final boolean ok;

        Potentials(Double[] E, Double[] F, boolean ok) {
            this.E = E;
            this.F = F;
            this.ok = ok;
        }

        String prettyE() {
            return arrayPretty("E", E);
        }

        String prettyF() {
            return arrayPretty("F", F);
        }

        private static String arrayPretty(String p, Double[] a) {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < a.length; i++) {
                if (i > 0) sb.append(", ");
                sb.append(p).append(i + 1).append("=").append(a[i]);
            }
            return sb.append("]").toString();
        }
    }

    private static Potentials computePotentials(TransportPlan plan, int[][] costs) {
        int n = plan.n;
        int m = plan.m;
        Double[] E = new Double[n];
        Double[] F = new Double[m];
        E[0] = 0.0;

        boolean progress = true;
        while (progress) {
            progress = false;
            for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) if (plan.isBasic(i, j)) {
                if (E[i] != null && F[j] == null) {
                    F[j] = costs[i][j] - E[i];
                    progress = true;
                } else if (E[i] == null && F[j] != null) {
                    E[i] = costs[i][j] - F[j];
                    progress = true;
                }
            }
        }

        for (Double x : E) if (x == null) return new Potentials(E, F, false);
        for (Double x : F) if (x == null) return new Potentials(E, F, false);
        return new Potentials(E, F, true);
    }

    private static final class PlanUpdate {
        final TransportPlan plan;

        PlanUpdate(TransportPlan p) {
            this.plan = p;
        }
    }

    private static PlanUpdate maximizeOnCycle(TransportPlan plan, Cycle cycle, Edge plusEdge, TraceWriter trace) {
        int n = plan.n;

        List<Edge> edges = GraphUtils.cycleToEdges(cycle, n);
        int k = edges.size();

        int posPlus = 0;
        if (plusEdge != null) {
            for (int t = 0; t < k; t++) if (edges.get(t).equals(plusEdge)) {
                posPlus = t;
                break;
            }
        }

        char[] sign = new char[k];
        for (int t = 0; t < k; t++) sign[t] = (((t - posPlus + k) % 2) == 0) ? '+' : '-';

        int delta = Integer.MAX_VALUE;
        int leavingIdx = -1;
        for (int t = 0; t < k; t++) if (sign[t] == '-') {
            Edge e = edges.get(t);
            int v = Optional.ofNullable(plan.get(e.i(), e.j())).orElse(0);
            if (v < delta) {
                delta = v;
                leavingIdx = t;
            }
        }
        if (delta == Integer.MAX_VALUE) delta = 0;

        if (trace != null) {
            StringBuilder cond = new StringBuilder();
            for (int t = 0; t < k; t++) {
                Edge e = edges.get(t);
                int v = Optional.ofNullable(plan.get(e.i(), e.j())).orElse(0);
                if (t > 0) cond.append(", ");
                cond.append(sign[t]).append(e).append("=").append(v);
            }
            trace.line("Conditions des cases : " + cond);
            trace.line("δ = " + delta);
        }

        // Mise à jour (on supprime UNE arête '-' de valeur minimale pour garder n+m-1 arêtes)
        for (int t = 0; t < k; t++) {
            Edge e = edges.get(t);
            int v = Optional.ofNullable(plan.get(e.i(), e.j())).orElse(0);
            if (sign[t] == '+') {
                plan.set(e.i(), e.j(), v + delta);
            } else {
                int nv = v - delta;
                if (t == leavingIdx) plan.set(e.i(), e.j(), null);
                else plan.set(e.i(), e.j(), nv);
            }
        }

        if (trace != null && leavingIdx >= 0) trace.line("Arête supprimée : " + edges.get(leavingIdx));
        return new PlanUpdate(plan);
    }
}

