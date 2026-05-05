#!/usr/bin/env node
import { check, checkWithDns, getBlocklist } from './index';

const args = process.argv.slice(2);
const cmd = args[0];

function printResult(r: ReturnType<typeof check> & { hasMx?: boolean | null }) {
  const flag = (v: boolean) => (v ? '✓' : '✗');
  console.log(`Email:        ${r.email}`);
  console.log(`Domain:       ${r.domain ?? '(invalid)'}`);
  console.log(`Disposable:   ${flag(r.isDisposable)} ${r.isDisposable ? '[BLOCKED]' : ''}`);
  console.log(`Free provider:${flag(r.isFreeProvider)}`);
  console.log(`Role address: ${flag(r.isRoleAddress)}`);
  if ('hasMx' in r) console.log(`Has MX:       ${r.hasMx === null ? 'N/A' : flag(r.hasMx as boolean)}`);
  console.log(`Reason:       ${r.reason ?? 'none'}`);
}

async function main() {
  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(`burner-bouncer CLI

Usage:
  burner-bouncer check <email> [--dns]   Check one or more emails
  burner-bouncer blocklist               Print all blocked domains
  burner-bouncer --help                  Show this help

Examples:
  burner-bouncer check user@mailinator.com
  burner-bouncer check a@mailinator.com b@gmail.com
  burner-bouncer check user@gmail.com --dns
`);
    process.exit(0);
  }

  if (cmd === 'blocklist') {
    getBlocklist().forEach((d) => console.log(d));
    process.exit(0);
  }

  if (cmd === 'check') {
    const emails = args.slice(1).filter((a) => !a.startsWith('--'));
    const useDns = args.includes('--dns');
    if (emails.length === 0) {
      console.error('Error: provide at least one email address.');
      process.exit(1);
    }
    for (const email of emails) {
      if (emails.length > 1) console.log(`\n--- ${email} ---`);
      if (useDns) {
        const result = await checkWithDns(email);
        printResult(result);
      } else {
        printResult(check(email));
      }
    }
    process.exit(0);
  }

  console.error(`Unknown command: ${cmd}. Run --help for usage.`);
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
