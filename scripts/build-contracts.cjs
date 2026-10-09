const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const contracts = [
  'designer_registry',
  'product_passport',
  'fashion_escrow',
  'production_financing'
];

const contractsDir = path.resolve(__dirname, '..', 'contracts');

console.log('=== Compiling Soroban Contracts to WASM ===');

// 1. Temporarily update crate-type to cdylib
for (const c of contracts) {
  const cargoPath = path.join(contractsDir, c, 'Cargo.toml');
  let content = fs.readFileSync(cargoPath, 'utf8');
  content = content.replace('crate-type = ["rlib"]', 'crate-type = ["cdylib"]');
  fs.writeFileSync(cargoPath, content);
}

try {
  console.log('Running cargo build --target wasm32-unknown-unknown --release...');
  execSync('cargo build --target wasm32-unknown-unknown --release', {
    cwd: contractsDir,
    stdio: 'inherit'
  });
  console.log('WASM compilation successful.');
} finally {
  // Always restore to rlib
  for (const c of contracts) {
    const cargoPath = path.join(contractsDir, c, 'Cargo.toml');
    let content = fs.readFileSync(cargoPath, 'utf8');
    content = content.replace('crate-type = ["cdylib"]', 'crate-type = ["rlib"]');
    fs.writeFileSync(cargoPath, content);
  }
}

const outDir = path.join(contractsDir, 'target', 'wasm32-unknown-unknown', 'release');
for (const c of contracts) {
  const wasmName = `stellar_threads_${c}.wasm`;
  const wasmPath = path.join(outDir, wasmName);
  if (!fs.existsSync(wasmPath)) {
    throw new Error(`Expected WASM artifact not found at ${wasmPath}`);
  }
  const size = fs.statSync(wasmPath).size;
  console.log(`✓ ${wasmName}: ${size} bytes`);
}
