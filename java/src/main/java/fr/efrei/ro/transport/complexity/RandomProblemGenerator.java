package fr.efrei.ro.transport.complexity;

import fr.efrei.ro.transport.model.TransportProblem;

import java.util.Random;

public final class RandomProblemGenerator {
    public static TransportProblem generate(int n, Random rng) {
        int[][] costs = new int[n][n];
        int[][] temp = new int[n][n];
        for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) {
            costs[i][j] = 1 + rng.nextInt(100);
            temp[i][j] = 1 + rng.nextInt(100);
        }
        int[] P = new int[n];
        int[] C = new int[n];
        for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) {
            P[i] += temp[i][j];
            C[j] += temp[i][j];
        }
        return new TransportProblem(n, n, costs, P, C);
    }
}

