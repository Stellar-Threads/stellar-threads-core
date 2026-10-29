#!/usr/bin/env bash
set -euo pipefail

echo "=== Verifying Stellar Threads Contracts Release Build ==="
cargo check --workspace --all-targets
cargo test --workspace
echo "All Soroban contract suites verified successfully for Protocol 22."
