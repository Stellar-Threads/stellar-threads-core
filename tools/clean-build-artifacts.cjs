/**
 * Clean Build & Test Artifacts
 */
const fs = require('fs');
const path = require('path');

const dirsToClean = [
  path.join(__dirname, '../dist'),
  path.join(__dirname, '../coverage'),
];

dirsToClean.forEach(d => {
  if (fs.existsSync(d)) {
    fs.rmSync(d, { recursive: true, force: true });
    console.log('Cleaned:', d);
  }
});

console.log('✅ Temporary build artifacts cleaned.');
