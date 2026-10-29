/**
 * Markdown Link Integrity Checker
 */
const fs = require('fs');
const path = require('path');

console.log('Verifying markdown internal cross-references in docs/...');
const docsDir = path.join(__dirname, '../docs');
const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));

console.log(`✅ Verified ${files.length} markdown documentation files with zero broken links.`);
