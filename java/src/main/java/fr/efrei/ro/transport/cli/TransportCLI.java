package fr.efrei.ro.transport.cli;

import fr.efrei.ro.transport.algo.BalasHammer;
import fr.efrei.ro.transport.algo.NorthwestCorner;
import fr.efrei.ro.transport.algo.SteppingStoneSolver;
import fr.efrei.ro.transport.complexity.ComplexityStudy;
import fr.efrei.ro.transport.display.TableFormatter;
import fr.efrei.ro.transport.io.ProblemParser;
import fr.efrei.ro.transport.io.TraceWriter;
import fr.efrei.ro.transport.model.TransportPlan;
import fr.efrei.ro.transport.model.TransportProblem;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

public final class TransportCLI {

    public void run(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);

        while (true) {
            System.out.println();
            System.out.println("=== Projet RO — Problème de transport (CLI) ===");
            System.out.println("1) Résoudre un problème (fichier / resource)");
            System.out.println("2) Générer les 24 traces (problems 01..12, NO+BH)");
            System.out.println("3) Étude de complexité (export CSV)");
            System.out.println("0) Quitter");
            String choice = readChoice(sc, ">", new String[]{"0", "1", "2", "3"});

            if (choice.equals("0")) return;
            if (choice.equals("1")) resolveOne(sc);
            else if (choice.equals("2")) batchTraces(sc);
            else if (choice.equals("3")) complexity(sc);
        }
    }

    private void resolveOne(Scanner sc) throws Exception {
        System.out.println("Charger depuis: 1) fichier  2) resource src/main/resources/problems/");
        String mode = readChoice(sc, ">", new String[]{"1", "2"});

        TransportProblem pb;
        int numPb = 0;

        if (mode.equals("1")) {
            Path p = readPath(sc, "Chemin fichier .txt");
            pb = tryParseFile(sc, p);
        } else {
            numPb = readIntInRange(sc, "Numéro problème (1..12)", 1, 12);
            pb = tryParseResource(sc, numPb);
        }

        int groupe = readInt(sc, "Groupe");
        int equipe = readInt(sc, "Équipe");

        System.out.println("Algo initial: 1) Nord-Ouest  2) Balas-Hammer");
        String a = readChoice(sc, ">", new String[]{"1", "2"});
        boolean useNO = a.equals("1");

        TraceWriter trace = new TraceWriter();
        trace.line("╔═══════════════════════════════════════════════════════════════╗");
        trace.line("║    RÉSOLUTION D'UN PROBLÈME DE TRANSPORT (Java)               ║");
        trace.line("╚═══════════════════════════════════════════════════════════════╝");
        trace.line("Taille : n=" + pb.n + " fournisseurs, m=" + pb.m + " clients");
        trace.line("Somme provisions : " + pb.totalSupply());
        trace.line("Somme commandes  : " + pb.totalDemand());
        trace.blank();

        trace.block(TableFormatter.formatIntMatrix(pb.costs, "Matrice des coûts unitaires",
                headers("P", pb.n), headers("C", pb.m), pb.supply, "Prov", pb.demand, "Com"));

        trace.blank();
        trace.line("───────────────────────────────────────────────────────────────");
        trace.line("PROPOSITION INITIALE : " + (useNO ? "Nord-Ouest" : "Balas-Hammer"));
        trace.line("───────────────────────────────────────────────────────────────");

        TransportPlan init = useNO
                ? NorthwestCorner.initialPlan(pb.n, pb.m, pb.supply, pb.demand)
                : BalasHammer.initialPlan(pb.costs, pb.supply, pb.demand, trace);

        trace.blank();
        trace.block(TableFormatter.formatPlan(init, "Proposition initiale",
                headers("P", pb.n), headers("C", pb.m), pb.supply, pb.demand));
        trace.line("Coût initial : " + init.totalCost(pb.costs));

        SteppingStoneSolver.solve(pb, init, trace, 200);

        System.out.println();
        System.out.println(trace.text());

        String algo = useNO ? "no" : "bh";
        String outName = groupe + "-" + equipe + "-trace" + (numPb == 0 ? "X" : numPb) + "-" + algo + ".txt";
        Path out = Path.of("traces").resolve(outName);
        trace.writeTo(out);
        System.out.println("Trace écrite: " + out.toAbsolutePath());
    }

    private void batchTraces(Scanner sc) throws Exception {
        int groupe = readInt(sc, "Groupe");
        int equipe = readInt(sc, "Équipe");

        for (int pbNum = 1; pbNum <= 12; pbNum++) {
            TransportProblem pb = tryParseResource(sc, pbNum);

            for (int k = 0; k < 2; k++) {
                boolean useNO = (k == 0);
                TraceWriter trace = new TraceWriter();

                trace.line("╔═══════════════════════════════════════════════════════════════╗");
                trace.line("║    RÉSOLUTION D'UN PROBLÈME DE TRANSPORT (Java)               ║");
                trace.line("╚═══════════════════════════════════════════════════════════════╝");
                trace.line("Problème " + pbNum + " — init " + (useNO ? "NO" : "BH"));
                trace.line("Taille : n=" + pb.n + " fournisseurs, m=" + pb.m + " clients");
                trace.line("Somme provisions : " + pb.totalSupply());
                trace.line("Somme commandes  : " + pb.totalDemand());
                trace.blank();

                trace.block(TableFormatter.formatIntMatrix(pb.costs, "Matrice des coûts unitaires",
                        headers("P", pb.n), headers("C", pb.m), pb.supply, "Prov", pb.demand, "Com"));

                trace.blank();
                trace.line("───────────────────────────────────────────────────────────────");
                trace.line("PROPOSITION INITIALE : " + (useNO ? "Nord-Ouest" : "Balas-Hammer"));
                trace.line("───────────────────────────────────────────────────────────────");

                TransportPlan init = useNO
                        ? NorthwestCorner.initialPlan(pb.n, pb.m, pb.supply, pb.demand)
                        : BalasHammer.initialPlan(pb.costs, pb.supply, pb.demand, trace);

                trace.blank();
                trace.block(TableFormatter.formatPlan(init, "Proposition initiale",
                        headers("P", pb.n), headers("C", pb.m), pb.supply, pb.demand));
                trace.line("Coût initial : " + init.totalCost(pb.costs));

                trace.blank();
                SteppingStoneSolver.solve(pb, init, trace, 200);

                String algo = useNO ? "no" : "bh";
                String outName = groupe + "-" + equipe + "-trace" + pbNum + "-" + algo + ".txt";
                Path out = Path.of("traces").resolve(outName);
                trace.writeTo(out);
                System.out.println("OK: " + outName);
            }
        }
        System.out.println("Terminé. Dossier: traces/");
    }

    private void complexity(Scanner sc) throws Exception {
        System.out.println("Mode complexité:");
        System.out.println("1) Mode PDF (n = 10,40,100,400,1000,4000,10000 ; 100 runs)");
        System.out.println("2) Custom");
        String mode = readChoice(sc, ">", new String[]{"1", "2"});

        int[] sizes;
        int runs;
        int maxIter;

        if (mode.equals("1")) {
            sizes = new int[]{10, 40, 100, 400, 1000, 4000, 10000};
            runs = 100;
            maxIter = readIntDefault(sc, "Max itérations marche-pied (défaut 200)", 200);
            System.out.println("OK — campagne PDF: sizes=" + Arrays.toString(sizes) + ", runs=" + runs + ", maxIter=" + maxIter);
        } else {
            sizes = readIntCsv(sc, "Tailles n (ex: 10,40,100)");
            runs = readInt(sc, "Runs par taille (ex: 100)");
            maxIter = readInt(sc, "Max itérations marche-pied (ex: 200)");
        }

        Path out = Path.of("complexite").resolve("mesures.csv");
        ComplexityStudy.run(sizes, runs, maxIter, out);
        System.out.println("CSV écrit: " + out.toAbsolutePath());
        System.out.println("Tu peux tracer les nuages/enveloppes dans Excel/LibreOffice/Python.");
    }

    private static String readChoice(Scanner sc, String prompt, String[] allowed) {
        while (true) {
            System.out.print(prompt + " ");
            String s = sc.nextLine().trim();
            for (String a : allowed) if (a.equals(s)) return s;
            System.out.println("Entrée invalide. Choix possibles: " + String.join("/", allowed));
        }
    }

    private static int readInt(Scanner sc, String label) {
        while (true) {
            System.out.print(label + ": ");
            String s = sc.nextLine().trim();
            try {
                return Integer.parseInt(s);
            } catch (NumberFormatException e) {
                System.out.println("Merci de saisir un entier.");
            }
        }
    }

    private static int readIntDefault(Scanner sc, String label, int def) {
        while (true) {
            System.out.print(label + ": ");
            String s = sc.nextLine().trim();
            if (s.isEmpty()) return def;
            try {
                return Integer.parseInt(s);
            } catch (NumberFormatException e) {
                System.out.println("Merci de saisir un entier (ou vide pour la valeur par défaut).");
            }
        }
    }

    private static int readIntInRange(Scanner sc, String label, int min, int max) {
        while (true) {
            int v = readInt(sc, label);
            if (v >= min && v <= max) return v;
            System.out.println("Valeur invalide. Intervalle attendu: [" + min + ".." + max + "].");
        }
    }

    private static int[] readIntCsv(Scanner sc, String label) {
        while (true) {
            System.out.print(label + ": ");
            String raw = sc.nextLine().trim();
            String[] parts = raw.split(",");
            List<Integer> out = new ArrayList<>();
            boolean ok = true;
            for (String p : parts) {
                String s = p.trim();
                if (!s.isEmpty()) {
                    try {
                        out.add(Integer.parseInt(s));
                    } catch (NumberFormatException e) {
                        ok = false;
                    }
                }
            }
            if (ok && !out.isEmpty()) {
                int[] a = new int[out.size()];
                for (int i = 0; i < out.size(); i++) a[i] = out.get(i);
                return a;
            }
            System.out.println("Entrée invalide. Exemple attendu: 10,40,100");
        }
    }

    private static Path readPath(Scanner sc, String label) {
        while (true) {
            System.out.print(label + ": ");
            String s = sc.nextLine().trim();
            if (s.isEmpty()) {
                System.out.println("Chemin vide.");
                continue;
            }
            try {
                return Path.of(s);
            } catch (Exception e) {
                System.out.println("Chemin invalide.");
            }
        }
    }

    private static TransportProblem tryParseFile(Scanner sc, Path p) {
        while (true) {
            try {
                return ProblemParser.parse(p);
            } catch (Exception e) {
                System.out.println("Impossible de lire le fichier: " + p);
                System.out.println("Détail: " + e.getMessage());
                p = readPath(sc, "Chemin fichier .txt");
            }
        }
    }

    private static TransportProblem tryParseResource(Scanner sc, int numPb) {
        while (true) {
            try {
                return ProblemParser.parseResource("/problems/probleme_" + String.format("%02d", numPb) + ".txt");
            } catch (Exception e) {
                System.out.println("Impossible de charger la ressource du problème " + numPb + ".");
                System.out.println("Détail: " + e.getMessage());
                numPb = readIntInRange(sc, "Numéro problème (1..12)", 1, 12);
            }
        }
    }

    private static String[] headers(String p, int k) {
        String[] a = new String[k];
        for (int i = 0; i < k; i++) a[i] = p + (i + 1);
        return a;
    }
}

