package fr.efrei.ro.transport.display;

import fr.efrei.ro.transport.model.TransportPlan;

import java.util.ArrayList;
import java.util.List;

public final class TableFormatter {

    public static String formatIntMatrix(
            int[][] mat,
            String title,
            String[] rowHeaders,
            String[] colHeaders,
            int[] rightCol,
            String rightTitle,
            int[] bottomRow,
            String bottomTitle
    ) {
        int n = mat.length;
        int m = (n == 0) ? 0 : mat[0].length;

        List<List<String>> cells = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            List<String> row = new ArrayList<>();
            for (int j = 0; j < m; j++) row.add(String.valueOf(mat[i][j]));
            cells.add(row);
        }
        return formatGrid(cells, title, rowHeaders, colHeaders, toStrings(rightCol), rightTitle, toStrings(bottomRow), bottomTitle);
    }

    public static String formatPlan(
            TransportPlan plan,
            String title,
            String[] rowHeaders,
            String[] colHeaders,
            int[] supply,
            int[] demand
    ) {
        int n = plan.n;
        int m = plan.m;

        List<List<String>> cells = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            List<String> row = new ArrayList<>();
            for (int j = 0; j < m; j++) {
                Integer q = plan.get(i, j);
                row.add(q == null ? "." : String.valueOf(q));
            }
            cells.add(row);
        }
        return formatGrid(cells, title, rowHeaders, colHeaders, toStrings(supply), "Prov", toStrings(demand), "Com");
    }

    public static String formatDoubleMatrix(Double[][] mat, String title) {
        int n = mat.length;
        int m = (n == 0) ? 0 : mat[0].length;
        List<List<String>> cells = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            List<String> row = new ArrayList<>();
            for (int j = 0; j < m; j++) row.add(mat[i][j] == null ? "." : asNumber(mat[i][j]));
            cells.add(row);
        }
        String[] rh = headers("P", n);
        String[] ch = headers("C", m);
        return formatGrid(cells, title, rh, ch, null, null, null, null);
    }

    private static String formatGrid(
            List<List<String>> cells,
            String title,
            String[] rowHeaders,
            String[] colHeaders,
            String[] rightCol,
            String rightTitle,
            String[] bottomRow,
            String bottomTitle
    ) {
        int n = cells.size();
        int m = (n == 0) ? 0 : cells.get(0).size();

        int wRowH = 0;
        if (rowHeaders != null) for (String s : rowHeaders) wRowH = Math.max(wRowH, s.length());
        if (bottomTitle != null) wRowH = Math.max(wRowH, bottomTitle.length());

        int[] w = new int[m];
        for (int j = 0; j < m; j++) w[j] = colHeaders[j].length();
        for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) w[j] = Math.max(w[j], cells.get(i).get(j).length());
        if (bottomRow != null) for (int j = 0; j < m; j++) w[j] = Math.max(w[j], bottomRow[j].length());

        int wRight = 0;
        if (rightCol != null) {
            wRight = rightTitle.length();
            for (String s : rightCol) wRight = Math.max(wRight, s.length());
        }

        StringBuilder sb = new StringBuilder();
        if (title != null && !title.isBlank()) {
            sb.append(title).append("\n");
            sb.append("─".repeat(title.length())).append("\n");
        }

        sb.append(padLeft("", wRowH));
        for (int j = 0; j < m; j++) sb.append(" | ").append(padLeft(colHeaders[j], w[j]));
        if (rightCol != null) sb.append(" || ").append(padLeft(rightTitle, wRight));
        sb.append("\n");

        sb.append("─".repeat(wRowH));
        for (int j = 0; j < m; j++) sb.append("─┼─").append("─".repeat(w[j]));
        if (rightCol != null) sb.append("─╫─").append("─".repeat(wRight));
        sb.append("\n");

        for (int i = 0; i < n; i++) {
            sb.append(padLeft(rowHeaders[i], wRowH));
            for (int j = 0; j < m; j++) sb.append(" | ").append(padLeft(cells.get(i).get(j), w[j]));
            if (rightCol != null) sb.append(" || ").append(padLeft(rightCol[i], wRight));
            sb.append("\n");
        }

        if (bottomRow != null) {
            sb.append("─".repeat(wRowH));
            for (int j = 0; j < m; j++) sb.append("─┼─").append("─".repeat(w[j]));
            if (rightCol != null) sb.append("─╫─").append("─".repeat(wRight));
            sb.append("\n");

            sb.append(padLeft(bottomTitle, wRowH));
            for (int j = 0; j < m; j++) sb.append(" | ").append(padLeft(bottomRow[j], w[j]));
            if (rightCol != null) sb.append(" || ").append(padLeft("", wRight));
            sb.append("\n");
        }

        return sb.toString();
    }

    private static String padLeft(String s, int w) {
        if (s == null) s = "";
        if (s.length() >= w) return s;
        return " ".repeat(w - s.length()) + s;
    }

    private static String[] headers(String prefix, int k) {
        String[] h = new String[k];
        for (int i = 0; i < k; i++) h[i] = prefix + (i + 1);
        return h;
    }

    private static String[] toStrings(int[] a) {
        if (a == null) return null;
        String[] s = new String[a.length];
        for (int i = 0; i < a.length; i++) s[i] = String.valueOf(a[i]);
        return s;
    }

    private static String asNumber(double x) {
        if (Math.rint(x) == x) return String.valueOf((long) x);
        return String.format(java.util.Locale.US, "%.2f", x);
    }
}

