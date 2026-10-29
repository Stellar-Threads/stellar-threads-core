# Prometheus Alerting Rules — Stellar Threads Protocol

groups:
  - name: stellar_threads_solvency_and_rpc
    rules:
      - alert: StellarEscrowDeficitWarning
        expr: stellar_threads_escrow_deficit_stroops > 0
        for: 1m
        labels:
          severity: critical
          tier: smart-contracts
        annotations:
          summary: "Escrow backing deficit detected on Stellar ledger"
          description: "Calculated reserves in escrow contract are below committed supplier & buyer obligations."

      - alert: SorobanRpcCircuitBreakerOpen
        expr: stellar_threads_rpc_circuit_state == 0
        for: 30s
        labels:
          severity: page
          tier: infrastructure
        annotations:
          summary: "Primary Soroban RPC circuit tripped to OPEN"
          description: "Consecutive RPC failures exceeded threshold (5). Traffic failed over to fallback pool."

      - alert: ChannelAccountDepleted
        expr: stellar_threads_channel_available_count < 2
        for: 2m
        labels:
          severity: warning
          tier: settlement
        annotations:
          summary: "Parallel Stellar channel accounts exhausted"
          description: "High concurrency has locked available channels. New transactions may experience queue delays."

      - alert: MilestoneDisputeSpike
        expr: rate(stellar_threads_disputes_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
          tier: operations
        annotations:
          summary: "Unusual rate of escrow milestone disputes filed"
          description: "Dispute submission rate exceeded normal baseline threshold."
