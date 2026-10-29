#!/usr/bin/env bash
set -euo pipefail

echo "=== Stellar Threads Soroban WASM Size Profiler ==="

MAX_SIZE_BYTES=300000 # 300 KB ceiling for Protocol 22 release binaries

mkdir -p target/wasm32-unknown-unknown/release

contracts=("fashion_escrow" "designer_registry" "product_passport" "production_financing")

for contract in "${contracts[@]}"; do
    echo "Profiling $contract..."
    wasm_file="target/wasm32-unknown-unknown/release/${contract//-/_}.wasm"
    if [ -f "$wasm_file" ]; then
        size=$(stat -c%s "$wasm_file" 2>/dev/null || stat -f%z "$wasm_file" 2>/dev/null || wc -c < "$wasm_file")
        echo "Binary size: $size bytes (limit: $MAX_SIZE_BYTES bytes)"
        if [ "$size" -gt "$MAX_SIZE_BYTES" ]; then
            echo "ERROR: $contract exceeds size ceiling of $MAX_SIZE_BYTES bytes!"
            exit 1
        fi
    else
        echo "Note: $wasm_file not built yet. Run cargo build --target wasm32-unknown-unknown --release"
    fi
done

echo "WASM size check completed successfully."
