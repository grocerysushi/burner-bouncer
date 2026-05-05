#!/usr/bin/env node
/**
 * Syncs the blocklist from two upstream sources and merges with our existing list.
 * Sources:
 *   - ivolo/disposable-email-domains (raw txt, one domain per line)
 *   - disposable-email-domains/disposable-email-domains (domains.txt)
 *
 * Usage: node scripts/sync-blocklist.js [--dry-run]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BLOCKLIST_PATH = path.join(__dirname, '..', 'data', 'disposable_domains.json');

const SOURCES = [
  'https://raw.githubusercontent.com/ivolo/disposable-email-domains/master/index.json',
  'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf',
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseDomains(text) {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return text
    .split('\n')
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && !l.startsWith('#') && l.includes('.'));
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const existing = JSON.parse(fs.readFileSync(BLOCKLIST_PATH, 'utf8'));
  const combined = new Set(existing.map((d) => d.toLowerCase()));
  const before = combined.size;

  for (const url of SOURCES) {
    console.log(`Fetching ${url}...`);
    try {
      const text = await fetch(url);
      const domains = parseDomains(text);
      for (const d of domains) combined.add(d);
      console.log(`  → ${domains.length} domains loaded`);
    } catch (e) {
      console.error(`  ✗ Failed: ${e.message}`);
    }
  }

  const sorted = Array.from(combined).sort();
  const added = sorted.length - before;
  console.log(`\nBefore: ${before} | After: ${sorted.length} | Added: ${added}`);

  if (dryRun) {
    console.log('Dry run — no files written.');
    return;
  }

  fs.writeFileSync(BLOCKLIST_PATH, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`Written to ${BLOCKLIST_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
