package fr.efrei.ro.transport.algo;

import fr.efrei.ro.transport.io.TraceWriter;
import fr.efrei.ro.transport.model.Edge;
import fr.efrei.ro.transport.model.TransportPlan;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public final class BalasHammer {

    public static TransportPlan initialPlan(int[][] costs, int[] supply, int[] demand, TraceWriter trace) {
        int n = supply.length;
        int m = demand.length;

        int[] P = supply.clone();
        int[] C = demand.clone();
        boolean[] rowActive = new boolean[n];
        boolean[] colActive = new boolean[m];
        Arrays.fill(rowActive, true);
        Arrays.fill(colActive, true);

        TransportPlan plan = new TransportPlan(n, m);
        int step = 0;

        while (any(rowActive) && any(colActive)) {
            step++;

            Integer[] penRow = new Integer[n];
            Integer[] penCol = new Integer[m];

            for (int i = 0; i < n; i++) {
                if (!rowActive[i]) continue;
                int[] mins = twoSmallestInRow(costs, i, colActive);
                if (mins[0] == Integer.MAX_VALUE) continue;
                penRow[i] = (mins[1] == Integer.MAX_VALUE) ? mins[0] : (mins[1] - mins[0]);
            }

            for (int j = 0; j < m; j++) {
                if (!colActive[j]) continue;
                int[] mins = twoSmallestInCol(costs, j, rowActive);
                if (mins[0] == Integer.MAX_VALUE) continue;
                penCol[j] = (mins[1] == Integer.MAX_VALUE) ? mins[0] : (mins[1] - mins[0]);
            }

            int max = Integer.MIN_VALUE;
            for (Integer v : penRow) if (v != null) max = Math.max(max, v);
            for (Integer v : penCol) if (v != null) max = Math.max(max, v);

            List<Integer> rowsMax = new ArrayList<>();
            List<Integer> colsMax = new ArrayList<>();
            for (int i = 0; i < n; i++) if (penRow[i] != null && penRow[i] == max) rowsMax.add(i);
            for (int j = 0; j < m; j++) if (penCol[j] != null && penCol[j] == max) colsMax.add(j);

            boolean chooseRow = !rowsMax.isEmpty(); // convention: lignes d’abord
            int idx = chooseRow ? rowsMax.get(0) : colsMax.get(0);

            int iChosen = -1, jChosen = -1, cMin = Integer.MAX_VALUE;
            if (chooseRow) {
                iChosen = idx;
                for (int j = 0; j < m; j++) if (colActive[j] && costs[iChosen][j] < cMin) {
                    cMin = costs[iChosen][j];
                    jChosen = j;
                }
            } else {
                jChosen = idx;
                for (int i = 0; i < n; i++) if (rowActive[i] && costs[i][jChosen] < cMin) {
                    cMin = costs[i][jChosen];
                    iChosen = i;
                }
            }

            int q = Math.min(P[iChosen], C[jChosen]);
            plan.set(iChosen, jChosen, q);
            P[iChosen] -= q;
            C[jChosen] -= q;

            if (trace != null) {
                String lc = chooseRow ? "ligne P" + (idx + 1) : "colonne C" + (idx + 1);
                String ex = (rowsMax.size() + colsMax.size() > 1)
                        ? " (ex-aequo: " + pretty(rowsMax, colsMax) + ")"
                        : "";
                trace.line("Étape " + step + " : pénalité max = " + max + " sur " + lc + ex
                        + " ; case choisie " + new Edge(iChosen, jChosen)
                        + " ; quantité = " + q);
            }

            if (P[iChosen] == 0 && C[jChosen] == 0) {
                rowActive[iChosen] = false; // convention
                if (!any(rowActive)) colActive[jChosen] = false;
            } else if (P[iChosen] == 0) rowActive[iChosen] = false;
            else if (C[jChosen] == 0) colActive[jChosen] = false;
        }

        return plan;
    }

    private static boolean any(boolean[] a) {
        for (boolean x : a) if (x) return true;
        return false;
    }

    private static int[] twoSmallestInRow(int[][] costs, int i, boolean[] colActive) {
        int min1 = Integer.MAX_VALUE, min2 = Integer.MAX_VALUE;
        for (int j = 0; j < colActive.length; j++) if (colActive[j]) {
            int v = costs[i][j];
            if (v < min1) {
                min2 = min1;
                min1 = v;
            } else if (v < min2) {
                min2 = v;
            }
        }
        return new int[]{min1, min2};
    }

    private static int[] twoSmallestInCol(int[][] costs, int j, boolean[] rowActive) {
        int min1 = Integer.MAX_VALUE, min2 = Integer.MAX_VALUE;
        for (int i = 0; i < rowActive.length; i++) if (rowActive[i]) {
            int v = costs[i][j];
            if (v < min1) {
                min2 = min1;
                min1 = v;
            } else if (v < min2) {
                min2 = v;
            }
        }
        return new int[]{min1, min2};
    }

    private static String pretty(List<Integer> rows, List<Integer> cols) {
        List<String> out = new ArrayList<>();
        for (int r : rows) out.add("L" + (r + 1));
        for (int c : cols) out.add("C" + (c + 1));
        return String.join(", ", out);
    }
}

