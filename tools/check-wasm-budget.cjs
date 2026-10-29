/**
 * Automated WASM Size Gate Validator
 * Verifies that compiled Soroban contract artifacts do not exceed SDF ledger limits (64KB budget).
 */
const fs = require('fs');
const path = require('path');

const MAX_WASM_BYTES = 65536; // 64KB target

console.log('Checking Soroban WASM build sizes against budget of ' + MAX_WASM_BYTES + ' bytes...');
const targetDir = path.join(__dirname, '../contracts/target/wasm32-unknown-unknown/release');

if (!fs.existsSync(targetDir)) {
  console.log('Notice: Release target directory not present yet; building will generate and gate artifacts.');
  process.exit(0);
}

const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.wasm') && !f.includes('.d'));
let failed = false;

files.forEach(file => {
  const stat = fs.statSync(path.join(targetDir, file));
  const size = stat.size;
  console.log(`Contract ${file}: ${size} bytes (${(size / 1024).toFixed(2)} KB)`);
  if (size > MAX_WASM_BYTES) {
    console.error(`❌ ${file} exceeds budget limit of ${MAX_WASM_BYTES} bytes!`);
    failed = true;
  }
});

if (failed) process.exit(1);
console.log('✅ All WASM contract files are within optimal Soroban budget.');
