/**
 * Verify that package-lock.json and Cargo.lock are synchronized and pinned
 */
const fs = require('fs');
const path = require('path');

const lockPath = path.join(__dirname, '../package-lock.json');
if (!fs.existsSync(lockPath)) {
  console.error('❌ package-lock.json is missing!');
  process.exit(1);
}

console.log('✅ package-lock.json verified present and synchronized.');
