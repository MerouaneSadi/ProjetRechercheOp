package fr.efrei.ro.transport.graph;

import fr.efrei.ro.transport.model.Edge;
import fr.efrei.ro.transport.model.TransportPlan;

import java.util.*;

public final class GraphUtils {

    public static List<Integer>[] adjacencyFromPlan(TransportPlan plan) {
        int n = plan.n;
        int m = plan.m;
        @SuppressWarnings("unchecked")
        List<Integer>[] adj = new List[n + m];
        for (int k = 0; k < n + m; k++) adj[k] = new ArrayList<>();

        for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) if (plan.isBasic(i, j)) {
            int u = i;
            int v = n + j;
            adj[u].add(v);
            adj[v].add(u);
        }
        return adj;
    }

    // BFS cycle detection in an undirected graph: revisit != parent => cycle.
    public static Optional<Cycle> findCycleBFS(TransportPlan plan) {
        int n = plan.n;
        int m = plan.m;
        int S = n + m;
        List<Integer>[] adj = adjacencyFromPlan(plan);

        boolean[] vis = new boolean[S];
        int[] parent = new int[S];
        int[] dist = new int[S];
        Arrays.fill(parent, -1);
        Arrays.fill(dist, -1);

        for (int start = 0; start < S; start++) {
            if (vis[start]) continue;
            if (adj[start].isEmpty()) {
                vis[start] = true;
                continue;
            }

            Queue<Integer> q = new ArrayDeque<>();
            vis[start] = true;
            dist[start] = 0;
            parent[start] = -1;
            q.add(start);

            while (!q.isEmpty()) {
                int u = q.remove();
                for (int v : adj[u]) {
                    if (!vis[v]) {
                        vis[v] = true;
                        parent[v] = u;
                        dist[v] = dist[u] + 1;
                        q.add(v);
                    } else if (v != parent[u]) {
                        return Optional.of(new Cycle(reconstructCycle(parent, dist, u, v)));
                    }
                }
            }
        }
        return Optional.empty();
    }

    private static List<Integer> reconstructCycle(int[] parent, int[] dist, int u, int v) {
        List<Integer> pathU = new ArrayList<>();
        List<Integer> pathV = new ArrayList<>();

        while (dist[u] > dist[v]) {
            pathU.add(u);
            u = parent[u];
        }
        while (dist[v] > dist[u]) {
            pathV.add(v);
            v = parent[v];
        }

        while (u != v) {
            pathU.add(u);
            pathV.add(v);
            u = parent[u];
            v = parent[v];
        }
        int lca = u;
        pathU.add(lca);
        Collections.reverse(pathV);
        pathU.addAll(pathV);
        return pathU;
    }

    public static List<List<Integer>> connectedComponents(TransportPlan plan) {
        int n = plan.n;
        int m = plan.m;
        int S = n + m;
        List<Integer>[] adj = adjacencyFromPlan(plan);
        boolean[] vis = new boolean[S];

        List<List<Integer>> comps = new ArrayList<>();
        for (int start = 0; start < S; start++) {
            if (vis[start]) continue;

            List<Integer> comp = new ArrayList<>();
            Queue<Integer> q = new ArrayDeque<>();
            vis[start] = true;
            q.add(start);

            while (!q.isEmpty()) {
                int u = q.remove();
                comp.add(u);
                for (int v : adj[u]) if (!vis[v]) {
                    vis[v] = true;
                    q.add(v);
                }
            }
            comps.add(comp);
        }
        return comps;
    }

    public static String vertexName(int v, int n) {
        if (v < n) return "P" + (v + 1);
        return "C" + (v - n + 1);
    }

    public static List<Edge> cycleToEdges(Cycle cycle, int n) {
        List<Integer> vs = cycle.vertices();
        int k = vs.size();
        List<Edge> edges = new ArrayList<>();
        for (int idx = 0; idx < k; idx++) {
            int a = vs.get(idx);
            int b = vs.get((idx + 1) % k);
            if (a < n && b >= n) edges.add(new Edge(a, b - n));
            else if (b < n && a >= n) edges.add(new Edge(b, a - n));
            else throw new IllegalStateException("Cycle non biparti.");
        }
        return edges;
    }
}

