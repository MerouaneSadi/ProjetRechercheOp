package fr.efrei.ro.transport.model;

public record Edge(int i, int j) {
    @Override
    public String toString() {
        return "(P" + (i + 1) + ",C" + (j + 1) + ")";
    }
}

