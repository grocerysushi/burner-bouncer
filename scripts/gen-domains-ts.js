#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const json = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'disposable_domains.json'), 'utf8'));
const out = `// Auto-generated from data/disposable_domains.json — do not edit directly\nconst domains: string[] = ${JSON.stringify(json, null, 2)};\nexport default domains;\n`;
fs.writeFileSync(path.join(__dirname, '..', 'js', 'src', 'domains.ts'), out);
console.log(`Generated domains.ts with ${json.length} entries`);
