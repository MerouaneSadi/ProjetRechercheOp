package fr.efrei.ro.transport.model;

import java.util.Arrays;

public final class TransportProblem {
    public final int n;
    public final int m;
    public final int[][] costs; // a_{i,j}
    public final int[] supply;  // P_i
    public final int[] demand;  // C_j

    public TransportProblem(int n, int m, int[][] costs, int[] supply, int[] demand) {
        this.n = n;
        this.m = m;
        this.costs = costs;
        this.supply = supply;
        this.demand = demand;
    }

    public int totalSupply() {
        return Arrays.stream(supply).sum();
    }

    public int totalDemand() {
        return Arrays.stream(demand).sum();
    }

    public void requireBalanced() {
        int sp = totalSupply();
        int de = totalDemand();
        if (sp != de) {
            throw new IllegalArgumentException("Problème non équilibré: ΣP=" + sp + " ΣC=" + de);
        }
    }
}

