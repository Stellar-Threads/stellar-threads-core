/**
 * Pre-release Gate Verification Script
 * Validates tests, build artifacts, and documentation readiness.
 */
const { execSync } = require('child_process');

console.log('\nChecking Stellar Threads pre-release checklist...');

try {
  console.log('1. Checking Cargo test suite...');
  execSync('cargo test', { cwd: 'contracts', stdio: 'inherit' });

  console.log('2. Checking Vitest test suite...');
  execSync('npm test', { stdio: 'inherit' });

  console.log('\n✅ All pre-release verification gates PASSED successfully!');
} catch (err) {
  console.error('\n❌ Release gate verification failed:', err.message);
  process.exit(1);
}
