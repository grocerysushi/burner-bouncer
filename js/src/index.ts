import blocklist from './domains.ts';

export interface CheckResult {
  email: string;
  domain: string | null;
  isDisposable: boolean;
  isFreeProvider: boolean;
  isRoleAddress: boolean;
  reason: 'blocklist' | 'invalid_email' | null;
}

export interface DnsCheckResult extends CheckResult {
  hasMx: boolean | null;
}

const BLOCKLIST: Set<string> = new Set(blocklist.map((d) => d.toLowerCase()));

const FREE_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.co.jp',
  'yahoo.fr', 'yahoo.de', 'yahoo.es', 'yahoo.it', 'yahoo.com.au', 'yahoo.ca',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.es',
  'hotmail.it', 'outlook.com', 'outlook.co.uk', 'outlook.fr', 'live.com',
  'live.co.uk', 'live.fr', 'msn.com', 'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'protonmail.com', 'proton.me', 'pm.me', 'zoho.com',
  'fastmail.com', 'fastmail.fm', 'tutanota.com', 'tutanota.de', 'tuta.io',
  'gmx.com', 'gmx.net', 'gmx.de', 'gmx.fr', 'web.de', 'mail.com',
  'yandex.com', 'yandex.ru', 'rambler.ru', 'mail.ru', 'inbox.com',
  'rediffmail.com', 'sina.com', 'qq.com', '163.com', '126.com',
]);

const ROLE_PREFIXES = new Set([
  'admin', 'administrator', 'webmaster', 'hostmaster', 'postmaster',
  'noreply', 'no-reply', 'donotreply', 'do-not-reply',
  'support', 'help', 'helpdesk', 'service', 'contact',
  'info', 'information', 'hello', 'hi',
  'sales', 'marketing', 'billing', 'payments', 'accounts',
  'security', 'abuse', 'spam', 'phishing',
  'jobs', 'careers', 'hr', 'recruiting', 'recruitment',
  'legal', 'compliance', 'privacy', 'gdpr',
  'press', 'media', 'pr', 'news',
  'dev', 'devops', 'ops', 'sre', 'engineering', 'tech',
  'api', 'system', 'bot', 'robot', 'daemon', 'mailer',
  'notifications', 'alerts', 'updates', 'newsletter',
]);

const COMMON_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'protonmail.com', 'aol.com', 'live.com', 'me.com', 'msn.com',
];

export function getDomain(email: string): string | null {
  const normalized = email.toLowerCase().trim();
  const parts = normalized.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes('.')) return null;
  return parts[1];
}

export function getLocal(email: string): string | null {
  const normalized = email.toLowerCase().trim();
  const parts = normalized.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes('.')) return null;
  return parts[0];
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function isFreeProvider(email: string): boolean {
  const domain = getDomain(email);
  if (!domain) return false;
  return FREE_PROVIDERS.has(domain);
}

export function isRoleAddress(email: string): boolean {
  const local = getLocal(email);
  if (!local) return false;
  const base = local.split('+')[0].split('.')[0];
  return ROLE_PREFIXES.has(base);
}

export function suggest(email: string): string | null {
  const domain = getDomain(email);
  if (!domain) return null;
  if (COMMON_DOMAINS.includes(domain)) return null;
  const local = getLocal(email)!;
  let best: string | null = null;
  let bestDist = Infinity;
  for (const candidate of COMMON_DOMAINS) {
    const dist = levenshtein(domain, candidate);
    if (dist > 0 && dist < bestDist && dist <= 2) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best ? `${local}@${best}` : null;
}

export function isDisposable(email: string): boolean {
  const domain = getDomain(email);
  if (!domain) return false;
  return BLOCKLIST.has(domain);
}

export function check(email: string): CheckResult {
  const domain = getDomain(email);
  if (!domain) {
    return { email, domain: null, isDisposable: false, isFreeProvider: false, isRoleAddress: false, reason: 'invalid_email' };
  }
  const disposable = BLOCKLIST.has(domain);
  return {
    email,
    domain,
    isDisposable: disposable,
    isFreeProvider: FREE_PROVIDERS.has(domain),
    isRoleAddress: isRoleAddress(email),
    reason: disposable ? 'blocklist' : null,
  };
}

export function checkMany(emails: string[]): CheckResult[] {
  return emails.map(check);
}

export function getBlocklist(): string[] {
  return Array.from(BLOCKLIST).sort();
}

export function getFreeProviders(): string[] {
  return Array.from(FREE_PROVIDERS).sort();
}

export async function checkWithDns(email: string): Promise<DnsCheckResult> {
  const base = check(email);
  if (!base.domain) {
    return { ...base, hasMx: null };
  }
  try {
    const dns = await import('node:dns/promises');
    const records = await dns.resolveMx(base.domain);
    return { ...base, hasMx: records.length > 0 };
  } catch {
    return { ...base, hasMx: false };
  }
}
