package fr.efrei.ro.transport.model;

import java.util.ArrayList;
import java.util.List;

public final class TransportPlan {
    public final int n, m;

    // quantity[i][j] = flux si arête de base, sinon null
    private final Integer[][] quantity;

    public TransportPlan(int n, int m) {
        this.n = n;
        this.m = m;
        this.quantity = new Integer[n][m];
    }

    public TransportPlan copy() {
        TransportPlan p = new TransportPlan(n, m);
        for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) {
            p.quantity[i][j] = this.quantity[i][j];
        }
        return p;
    }

    public Integer get(int i, int j) {
        return quantity[i][j];
    }

    public void set(int i, int j, Integer v) {
        quantity[i][j] = v;
    }

    public boolean isBasic(int i, int j) {
        return quantity[i][j] != null;
    }

    public List<Edge> basicEdges() {
        List<Edge> edges = new ArrayList<>();
        for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) {
            if (isBasic(i, j)) edges.add(new Edge(i, j));
        }
        return edges;
    }

    public long totalCost(int[][] costs) {
        long sum = 0;
        for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) {
            Integer q = quantity[i][j];
            if (q != null) sum += (long) costs[i][j] * q;
        }
        return sum;
    }
}

