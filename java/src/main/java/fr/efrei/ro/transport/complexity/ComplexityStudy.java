package fr.efrei.ro.transport.complexity;

import fr.efrei.ro.transport.algo.BalasHammer;
import fr.efrei.ro.transport.algo.NorthwestCorner;
import fr.efrei.ro.transport.algo.SteppingStoneSolver;
import fr.efrei.ro.transport.model.TransportPlan;
import fr.efrei.ro.transport.model.TransportProblem;

import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Random;

public final class ComplexityStudy {

    public static void run(int[] sizes, int runs, int maxIter, Path csvOut) throws Exception {
        if (csvOut.getParent() != null) Files.createDirectories(csvOut.getParent());
        try (PrintWriter pw = new PrintWriter(Files.newBufferedWriter(csvOut, StandardCharsets.UTF_8))) {
            // Compat: les 8 premières colonnes restent inchangées, on ajoute maxIter et seed à la fin.
            pw.println("n,run,thetaNO_ns,thetaBH_ns,tNO_ns,tBH_ns,totalNO_ns,totalBH_ns,maxIter,seed");

            final long baseSeed = 0xC0FFEE;
            final long allStartNs = System.nanoTime();
            final int totalInstances = sizes.length * runs;
            int doneInstances = 0;

            System.out.printf("=== Étude de complexité ===%n");
            System.out.printf("Tailles: %d | Runs par taille: %d | maxIter: %d%n", sizes.length, runs, maxIter);
            System.out.printf("Total instances: %d%n", totalInstances);

            for (int n : sizes) {
                final long nStartNs = System.nanoTime();
                System.out.printf("%n[n=%d] Début (%d runs)%n", n, runs);
                for (int r = 1; r <= runs; r++) {
                    long seed = baseSeed + 1_000_003L * n + r;
                    Random rng = new Random(seed);
                    TransportProblem pb = RandomProblemGenerator.generate(n, rng);

                    long t0 = System.nanoTime();
                    TransportPlan no = NorthwestCorner.initialPlan(n, n, pb.supply, pb.demand);
                    long t1 = System.nanoTime();
                    long thetaNO = t1 - t0;

                    t0 = System.nanoTime();
                    TransportPlan bh = BalasHammer.initialPlan(pb.costs, pb.supply, pb.demand, null);
                    t1 = System.nanoTime();
                    long thetaBH = t1 - t0;

                    t0 = System.nanoTime();
                    SteppingStoneSolver.solve(pb, no, null, maxIter);
                    t1 = System.nanoTime();
                    long tNO = t1 - t0;

                    t0 = System.nanoTime();
                    SteppingStoneSolver.solve(pb, bh, null, maxIter);
                    t1 = System.nanoTime();
                    long tBH = t1 - t0;

                    pw.printf("%d,%d,%d,%d,%d,%d,%d,%d,%d,%d%n",
                            n, r,
                            thetaNO, thetaBH,
                            tNO, tBH,
                            thetaNO + tNO, thetaBH + tBH,
                            maxIter, seed);

                    doneInstances++;
                    // Affichage d'avancement (hors timings) pour savoir si ça tourne.
                    if (r == 1 || r == runs || (r % 10 == 0)) {
                        long nowNs = System.nanoTime();
                        long nElapsedNs = nowNs - nStartNs;
                        double avgPerRunNs = nElapsedNs / (double) r;
                        long nEtaNs = (long) (avgPerRunNs * (runs - r));

                        long allElapsedNs = nowNs - allStartNs;
                        double avgPerInstanceNs = allElapsedNs / (double) doneInstances;
                        long allEtaNs = (long) (avgPerInstanceNs * (totalInstances - doneInstances));

                        System.out.printf("[n=%d] run %d/%d (%.0f%%) | n: %s écoulé, ETA %s | total: %d/%d, ETA %s%n",
                                n, r, runs, (100.0 * r) / runs,
                                fmtDuration(nElapsedNs), fmtDuration(nEtaNs),
                                doneInstances, totalInstances, fmtDuration(allEtaNs));
                        System.out.flush();
                    }
                }
                System.out.printf("[n=%d] Terminé en %s%n", n, fmtDuration(System.nanoTime() - nStartNs));
            }
            System.out.printf("%nTerminé. Temps total: %s%n", fmtDuration(System.nanoTime() - allStartNs));
        }
    }

    private static String fmtDuration(long ns) {
        if (ns < 0) ns = 0;
        long s = ns / 1_000_000_000L;
        long h = s / 3600;
        long m = (s % 3600) / 60;
        long sec = s % 60;
        if (h > 0) return String.format("%dh%02dm%02ds", h, m, sec);
        if (m > 0) return String.format("%dm%02ds", m, sec);
        return String.format("%ds", sec);
    }
}

