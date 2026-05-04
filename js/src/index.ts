import blocklist from '../../data/disposable_domains.json';

export interface CheckResult {
  email: string;
  domain: string | null;
  isDisposable: boolean;
  reason: 'blocklist' | 'invalid_email' | null;
}

const BLOCKLIST: Set<string> = new Set((blocklist as string[]).map((d) => d.toLowerCase()));

export function getDomain(email: string): string | null {
  const normalized = email.toLowerCase().trim();
  const parts = normalized.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes('.')) return null;
  return parts[1];
}

export function isDisposable(email: string): boolean {
  const domain = getDomain(email);
  if (!domain) return false;
  return BLOCKLIST.has(domain);
}

export function check(email: string): CheckResult {
  const domain = getDomain(email);
  if (!domain) {
    return { email, domain: null, isDisposable: false, reason: 'invalid_email' };
  }
  const disposable = BLOCKLIST.has(domain);
  return {
    email,
    domain,
    isDisposable: disposable,
    reason: disposable ? 'blocklist' : null,
  };
}

export function checkMany(emails: string[]): CheckResult[] {
  return emails.map(check);
}

export function getBlocklist(): string[] {
  return Array.from(BLOCKLIST).sort();
}
