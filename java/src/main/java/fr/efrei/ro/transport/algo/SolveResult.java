package fr.efrei.ro.transport.algo;

import fr.efrei.ro.transport.model.TransportPlan;

public final class SolveResult {

    private final TransportPlan plan;
    private final boolean optimal;

    public SolveResult(TransportPlan plan, boolean optimal) {
        this.plan = plan;
        this.optimal = optimal;
    }

    public TransportPlan getPlan() {
        return plan;
    }

    public boolean isOptimal() {
        return optimal;
    }
}