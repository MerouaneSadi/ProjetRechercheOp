package fr.efrei.ro.transport.algo;

import fr.efrei.ro.transport.model.TransportPlan;

public final class NorthwestCorner {

    public static TransportPlan initialPlan(int n, int m, int[] supply, int[] demand) {
        int[] P = supply.clone();
        int[] C = demand.clone();
        TransportPlan plan = new TransportPlan(n, m);

        int i = 0, j = 0;
        while (i < n && j < m) {
            int q = Math.min(P[i], C[j]);
            plan.set(i, j, q);
            P[i] -= q;
            C[j] -= q;

            if (P[i] == 0 && C[j] == 0) i++; // convention identique à ton JS
            else if (P[i] == 0) i++;
            else j++;
        }
        return plan;
    }
}

