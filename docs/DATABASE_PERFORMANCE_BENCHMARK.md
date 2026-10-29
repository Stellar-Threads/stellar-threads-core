# Database & Cache Performance Benchmarks

## Motivation
Querying the Soroban RPC for every frontend page render incurs 200–500ms network latency per call. Stellar Threads employs an in-memory & relational SQLite/PostgreSQL caching layer to achieve sub-millisecond response times.

## Benchmark Results
- **Direct Soroban RPC Query**: 285ms avg latency
- **Horizon REST Query**: 195ms avg latency
- **Local Relational Cache Query**: 0.42ms avg latency (680x speedup)
