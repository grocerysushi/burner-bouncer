# burner-bouncer

[![CI](https://github.com/grocerysushi/burner-bouncer/actions/workflows/ci.yml/badge.svg)](https://github.com/grocerysushi/burner-bouncer/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/burner-bouncer.svg)](https://www.npmjs.com/package/burner-bouncer)
[![JSR](https://jsr.io/badges/@grocerysushi/burner-bouncer)](https://jsr.io/@grocerysushi/burner-bouncer)
[![PyPI version](https://img.shields.io/pypi/v/burner-bouncer.svg)](https://pypi.org/project/burner-bouncer/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Detect disposable / burner email addresses instantly. Zero runtime dependencies. Ships as both an **npm package** (TypeScript, ESM + CJS), a **JSR package** (Deno/Bun), and a **Python package**, backed by a single shared blocklist of 500+ real disposable-email domains.

---

## Why Burner Bouncer?

- **No external requests** — the blocklist is bundled at install time; nothing is phoned home at runtime.
- **Dual ecosystem** — identical API surface in JavaScript/TypeScript and Python so you can use the same library across your stack.
- **Always typed** — full TypeScript types and a typed Python dataclass result, no `any` guessing.
- **Tiny** — the entire JS bundle is under 10 kB gzipped.
- **500+ domains** — covers Mailinator, Guerrilla Mail, YOPmail, 10MinuteMail, Temp-Mail, Maildrop, and hundreds more.
- **CLI included** — run `npx burner-bouncer check <email>` with no install.
- **Weekly auto-sync** — a GitHub Actions workflow opens PRs to keep the blocklist fresh from upstream sources.

---

## JavaScript / TypeScript

### Installation

```bash
npm install burner-bouncer
# or
pnpm add burner-bouncer
# or
yarn add burner-bouncer
```

### Deno / JSR

```bash
deno add @grocerysushi/burner-bouncer
```

### CLI (no install required)

```bash
npx burner-bouncer check user@mailinator.com
npx burner-bouncer check a@mailinator.com b@gmail.com
npx burner-bouncer check user@company.com --dns   # also verify MX record
npx burner-bouncer blocklist                       # print all blocked domains
```

### Usage

```ts
import {
  isDisposable, check, checkMany, getDomain, getBlocklist,
  isFreeProvider, isRoleAddress, suggest, getFreeProviders, checkWithDns,
} from 'burner-bouncer';

// Quick boolean check
isDisposable('user@mailinator.com');   // true
isDisposable('user@gmail.com');        // false
isDisposable('notanemail');            // false

// Free provider detection (Gmail, Yahoo, Hotmail, etc.)
isFreeProvider('user@gmail.com');      // true
isFreeProvider('user@company.com');    // false

// Role address detection (admin, noreply, support, etc.)
isRoleAddress('admin@example.com');    // true
isRoleAddress('john@example.com');     // false

// Typo suggestion
suggest('user@gmial.com');             // 'user@gmail.com'
suggest('user@gmail.com');             // null (already correct)

// Full result object
check('test@mailinator.com');
// {
//   email: 'test@mailinator.com',
//   domain: 'mailinator.com',
//   isDisposable: true,
//   isFreeProvider: false,
//   isRoleAddress: false,
//   reason: 'blocklist'
// }

check('admin@gmail.com');
// { ..., isDisposable: false, isFreeProvider: true, isRoleAddress: true, reason: null }

check('notanemail');
// { email: 'notanemail', domain: null, isDisposable: false, ..., reason: 'invalid_email' }

// Batch check
checkMany(['a@mailinator.com', 'b@gmail.com', 'bad']);

// MX record validation (async, requires network)
const result = await checkWithDns('user@gmail.com');
result.hasMx; // true

// Retrieve lists
getBlocklist();      // ['10minutemail.com', ...]
getFreeProviders();  // ['aol.com', 'gmail.com', ...]
```

### JS API Reference

| Function | Signature | Description |
|---|---|---|
| `isDisposable` | `(email: string) => boolean` | Returns `true` if the email's domain is on the blocklist. |
| `isFreeProvider` | `(email: string) => boolean` | Returns `true` if the domain is a known free email provider (Gmail, Yahoo, etc.). |
| `isRoleAddress` | `(email: string) => boolean` | Returns `true` if the local part is a role prefix (admin, noreply, support, etc.). |
| `suggest` | `(email: string) => string \| null` | Returns a corrected email if the domain looks like a typo, otherwise `null`. |
| `check` | `(email: string) => CheckResult` | Returns a full result object. |
| `checkMany` | `(emails: string[]) => CheckResult[]` | Runs `check` on each email. |
| `checkWithDns` | `(email: string) => Promise<DnsCheckResult>` | Like `check` but also verifies MX records via DNS. |
| `getDomain` | `(email: string) => string \| null` | Extracts and lowercases the domain. Returns `null` for invalid emails. |
| `getBlocklist` | `() => string[]` | Returns a sorted copy of all blocked domains. |
| `getFreeProviders` | `() => string[]` | Returns a sorted copy of all known free provider domains. |

#### `CheckResult` interface

```ts
interface CheckResult {
  email: string;
  domain: string | null;
  isDisposable: boolean;
  isFreeProvider: boolean;
  isRoleAddress: boolean;
  reason: 'blocklist' | 'invalid_email' | null;
}

interface DnsCheckResult extends CheckResult {
  hasMx: boolean | null;  // null when email is invalid
}
```

---

## Python

### Installation

```bash
pip install burner-bouncer
```

### Usage

```python
from burner_bouncer import (
    is_disposable, check, check_many, get_domain, get_blocklist,
    is_free_provider, is_role_address, suggest, get_free_providers,
    check_with_dns,
)

# Quick boolean checks
is_disposable("user@mailinator.com")   # True
is_free_provider("user@gmail.com")     # True
is_role_address("admin@example.com")   # True
suggest("user@gmial.com")              # 'user@gmail.com'

# Full result dataclass
result = check("test@mailinator.com")
result.is_disposable    # True
result.is_free_provider # False
result.is_role_address  # False
result.reason           # 'blocklist'
result.to_dict()

# MX validation
result = check_with_dns("user@gmail.com")
result.has_mx  # True

# Batch check
results = check_many(["a@mailinator.com", "b@gmail.com", "bad"])

# Retrieve lists
get_blocklist()       # ['10minutemail.com', ...]
get_free_providers()  # ['aol.com', 'gmail.com', ...]
```

### Python API Reference

| Function | Signature | Description |
|---|---|---|
| `is_disposable` | `(email: str) -> bool` | Returns `True` if the email's domain is on the blocklist. |
| `is_free_provider` | `(email: str) -> bool` | Returns `True` if the domain is a known free email provider. |
| `is_role_address` | `(email: str) -> bool` | Returns `True` if the local part is a role prefix. |
| `suggest` | `(email: str) -> Optional[str]` | Returns a corrected email for likely typos, otherwise `None`. |
| `check` | `(email: str) -> CheckResult` | Returns a `CheckResult` dataclass instance. |
| `check_many` | `(emails: List[str]) -> List[CheckResult]` | Runs `check` on each email. |
| `check_with_dns` | `(email: str) -> DnsCheckResult` | Like `check` but also verifies MX records. |
| `get_domain` | `(email: str) -> Optional[str]` | Extracts and lowercases the domain. |
| `get_blocklist` | `() -> List[str]` | Returns a sorted list of all blocked domains. |
| `get_free_providers` | `() -> List[str]` | Returns a sorted list of all free provider domains. |

#### `CheckResult` dataclass

```python
@dataclass
class CheckResult:
    email: str
    domain: Optional[str]
    is_disposable: bool
    is_free_provider: bool
    is_role_address: bool
    reason: Optional[str]  # 'blocklist' | 'invalid_email' | None

    def to_dict(self) -> dict: ...

@dataclass
class DnsCheckResult:
    # all CheckResult fields +
    has_mx: Optional[bool]  # None when email is invalid
```

---

## Repository Structure

```
burner-bouncer/
├── data/
│   └── disposable_domains.json   # Shared blocklist (500+ domains)
├── js/
│   ├── src/
│   │   ├── index.ts              # JS/TS library source
│   │   └── cli.ts                # CLI entrypoint (npx burner-bouncer)
│   ├── tests/
│   │   └── index.test.ts         # Jest test suite
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
├── python/
│   ├── burner_bouncer/
│   │   └── __init__.py           # Python library source
│   ├── tests/
│   │   └── test_burner_bouncer.py
│   └── pyproject.toml
├── scripts/
│   └── sync-blocklist.js         # Auto-sync blocklist from upstream sources
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── submit-domain.yml     # "Submit a domain" form
│   └── workflows/
│       ├── ci.yml                # CI: test JS + Python on every push/PR
│       ├── publish.yml           # Publish to npm + JSR + PyPI on version tag
│       └── sync-blocklist.yml    # Weekly blocklist sync
├── jsr.json                      # JSR (Deno registry) config
├── CONTRIBUTING.md
├── .gitignore
├── LICENSE
└── README.md
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full details. The short version:

1. Add domains to `data/disposable_domains.json` (sorted, deduplicated, lowercase)
2. Run `cd js && npm test` and `cd python && pytest`
3. Open a pull request — use the **Submit a domain** issue template for new domains

---

## License

[MIT](./LICENSE) © 2025 burner-bouncer contributors
