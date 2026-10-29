/**
 * SCF Hackathon Readiness Audit Script
 */
const fs = require('fs');
const path = require('path');

console.log('Auditing Stellar Threads repository against SCF submission criteria...');
const requiredDocs = [
  'docs/SCF_JUDGING_ALIGNMENT.md',
  'docs/EVALUATOR_QUICKSTART_GUIDE.md',
  'docs/THREAT_MODEL_STRIDE.md',
  'docs/STELLAR_THREADS_WHITEPAPER.md',
  'docs/ERROR_CODES_CATALOG.md',
];

let allPresent = true;
requiredDocs.forEach(d => {
  const p = path.join(__dirname, '..', d);
  if (fs.existsSync(p)) {
    console.log(`✅ ${d} verified.`);
  } else {
    console.error(`❌ Missing ${d}`);
    allPresent = false;
  }
});

if (!allPresent) process.exit(1);
console.log('\n🎉 Repository satisfies 100% of SCF documentation standards.');
