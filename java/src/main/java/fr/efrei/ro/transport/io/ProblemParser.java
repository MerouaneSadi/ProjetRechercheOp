package fr.efrei.ro.transport.io;

import fr.efrei.ro.transport.model.TransportProblem;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public final class ProblemParser {

    public static TransportProblem parse(Path file) throws Exception {
        List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
        return parseLines(lines);
    }

    public static TransportProblem parseResource(String resourcePath) throws Exception {
        try (InputStream in = ProblemParser.class.getResourceAsStream(resourcePath)) {
            if (in == null) throw new IllegalArgumentException("Ressource introuvable: " + resourcePath);
            try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                List<String> lines = new ArrayList<>();
                String s;
                while ((s = br.readLine()) != null) lines.add(s);
                return parseLines(lines);
            }
        }
    }

    private static TransportProblem parseLines(List<String> raw) {
        List<String> lines = raw.stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
        if (lines.size() < 2) throw new IllegalArgumentException("Fichier invalide: pas assez de lignes.");

        int[] nm = parseInts(lines.get(0));
        if (nm.length < 2) throw new IllegalArgumentException("Ligne 1: on attend 'n m'.");
        int n = nm[0];
        int m = nm[1];
        if (lines.size() != n + 2) {
            throw new IllegalArgumentException("Nombre de lignes incorrect: attendu " + (n + 2) + ", reçu " + lines.size());
        }

        int[][] costs = new int[n][m];
        int[] supply = new int[n];

        for (int i = 0; i < n; i++) {
            int[] vals = parseInts(lines.get(1 + i));
            if (vals.length != m + 1) {
                throw new IllegalArgumentException("Ligne " + (i + 2) + ": attendu " + (m + 1) + " entiers.");
            }
            System.arraycopy(vals, 0, costs[i], 0, m);
            supply[i] = vals[m];
        }

        int[] demand = parseInts(lines.get(n + 1));
        if (demand.length != m) throw new IllegalArgumentException("Dernière ligne: attendu " + m + " entiers (commandes).");

        TransportProblem pb = new TransportProblem(n, m, costs, supply, demand);
        pb.requireBalanced();
        return pb;
    }

    private static int[] parseInts(String line) {
        String[] parts = line.trim().split("\\s+");
        int[] a = new int[parts.length];
        for (int i = 0; i < parts.length; i++) a[i] = Integer.parseInt(parts[i]);
        return a;
    }
}

