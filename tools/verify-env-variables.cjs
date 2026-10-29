/**
 * Startup Environment Variable Gating
 */
const { loadEnvConfig } = require('../dist/config/env');

console.log('Validating runtime environment configuration...');
try {
  const env = loadEnvConfig();
  console.log('✅ Environment configuration valid:');
  console.log('  - Stellar Network:', env.stellarNetwork);
  console.log('  - RPC URL:', env.sorobanRpcUrl);
  console.log('  - HTTP Port:', env.port);
} catch (err) {
  console.error('❌ Environment validation failed:', err.message);
  process.exit(1);
}
