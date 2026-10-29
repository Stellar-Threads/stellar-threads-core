/**
 * Master Test Orchestrator for Stellar Threads Core
 * Executes both Rust contract unit suites and Node.js/TypeScript backend test suites.
 */
const { execSync } = require('child_process');
const path = require('path');

console.log('\n======================================================');
console.log('🧵 STELLAR THREADS — UNIFIED TEST SUITE VALIDATION');
console.log('======================================================\n');

try {
  console.log('[1/2] Executing Soroban Smart Contract Test Suites (cargo test)...');
  execSync('cargo test', {
    cwd: path.join(__dirname, '../contracts'),
    stdio: 'inherit'
  });
  console.log('✅ Smart contract tests passed successfully.\n');

  console.log('[2/2] Executing Backend TypeScript Vitest Suites (npm test)...');
  execSync('npm test', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('✅ Backend Vitest tests passed successfully.\n');

  console.log('======================================================');
  console.log('🎉 ALL CONTRACT & BACKEND TEST SUITES 100% GREEN');
  console.log('======================================================\n');
} catch (err) {
  console.error('\n❌ Test suite execution failed:', err.message);
  process.exit(1);
}
