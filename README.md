# burner-bouncer

[![CI](https://github.com/grocerysushi/burner-bouncer/actions/workflows/ci.yml/badge.svg)](https://github.com/grocerysushi/burner-bouncer/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/burner-bouncer.svg)](https://www.npmjs.com/package/burner-bouncer)
[![PyPI version](https://img.shields.io/pypi/v/burner-bouncer.svg)](https://pypi.org/project/burner-bouncer/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Detect disposable / burner email addresses instantly. Zero runtime dependencies. Ships as both an **npm package** (TypeScript, ESM + CJS) and a **Python package**, backed by a single shared blocklist of 500+ real disposable-email domains.

---

## Why Burner Bouncer?

- **No external requests** — the blocklist is bundled at install time; nothing is phoned home at runtime.
- **Dual ecosystem** — identical API surface in JavaScript/TypeScript and Python so you can use the same library across your stack.
- **Always typed** — full TypeScript types and a typed Python dataclass result, no `any` guessing.
- **Tiny** — the entire JS bundle is under 10 kB gzipped.
- **500+ domains** — covers Mailinator, Guerrilla Mail, YOPmail, 10MinuteMail, Temp-Mail, Maildrop, and hundreds more.

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

### Usage

```ts
import { isDisposable, check, checkMany, getDomain, getBlocklist } from 'burner-bouncer';

// Quick boolean check
isDisposable('user@mailinator.com');   // true
isDisposable('user@gmail.com');        // false
isDisposable('notanemail');            // false

// Full result object
check('test@mailinator.com');
// {
//   email: 'test@mailinator.com',
//   domain: 'mailinator.com',
//   isDisposable: true,
//   reason: 'blocklist'
// }

check('user@gmail.com');
// { email: 'user@gmail.com', domain: 'gmail.com', isDisposable: false, reason: null }

check('notanemail');
// { email: 'notanemail', domain: null, isDisposable: false, reason: 'invalid_email' }

// Batch check
checkMany(['a@mailinator.com', 'b@gmail.com', 'bad']);
// [ { isDisposable: true, ... }, { isDisposable: false, ... }, { reason: 'invalid_email', ... } ]

// Extract domain
getDomain('User@YopMail.COM');  // 'yopmail.com'

// Retrieve the full sorted blocklist
getBlocklist();  // ['10minutemail.com', 'guerrillamail.com', ...]
```

### JS API Reference

| Function | Signature | Description |
|---|---|---|
| `isDisposable` | `(email: string) => boolean` | Returns `true` if the email's domain is on the blocklist. Returns `false` for invalid emails. |
| `check` | `(email: string) => CheckResult` | Returns a full result object with `email`, `domain`, `isDisposable`, and `reason`. |
| `checkMany` | `(emails: string[]) => CheckResult[]` | Runs `check` on each email and returns an array of results. |
| `getDomain` | `(email: string) => string \| null` | Extracts and lowercases the domain portion. Returns `null` for invalid emails. |
| `getBlocklist` | `() => string[]` | Returns a sorted copy of all blocked domains. |

#### `CheckResult` interface

```ts
interface CheckResult {
  email: string;
  domain: string | null;
  isDisposable: boolean;
  reason: 'blocklist' | 'invalid_email' | null;
}
```

| Field | Type | Description |
|---|---|---|
| `email` | `string` | The original input email. |
| `domain` | `string \| null` | The lowercased domain, or `null` if the email is invalid. |
| `isDisposable` | `boolean` | Whether the domain appears on the blocklist. |
| `reason` | `'blocklist' \| 'invalid_email' \| null` | `'blocklist'` if flagged, `'invalid_email'` if malformed, `null` if clean. |

---

## Python

### Installation

```bash
pip install burner-bouncer
```

### Usage

```python
from burner_bouncer import is_disposable, check, check_many, get_domain, get_blocklist

# Quick boolean check
is_disposable("user@mailinator.com")   # True
is_disposable("user@gmail.com")        # False
is_disposable("notanemail")            # False

# Full result dataclass
result = check("test@mailinator.com")
result.email          # 'test@mailinator.com'
result.domain         # 'mailinator.com'
result.is_disposable  # True
result.reason         # 'blocklist'
result.to_dict()
# {'email': 'test@mailinator.com', 'domain': 'mailinator.com',
#  'is_disposable': True, 'reason': 'blocklist'}

check("user@gmail.com").reason         # None
check("notanemail").reason             # 'invalid_email'

# Batch check
results = check_many(["a@mailinator.com", "b@gmail.com", "bad"])

# Extract domain
get_domain("User@YopMail.COM")  # 'yopmail.com'

# Retrieve the full sorted blocklist
get_blocklist()  # ['10minutemail.com', 'guerrillamail.com', ...]
```

### Python API Reference

| Function | Signature | Description |
|---|---|---|
| `is_disposable` | `(email: str) -> bool` | Returns `True` if the email's domain is on the blocklist. |
| `check` | `(email: str) -> CheckResult` | Returns a `CheckResult` dataclass instance. |
| `check_many` | `(emails: List[str]) -> List[CheckResult]` | Runs `check` on each email. |
| `get_domain` | `(email: str) -> Optional[str]` | Extracts and lowercases the domain. Returns `None` for invalid emails. |
| `get_blocklist` | `() -> List[str]` | Returns a sorted list of all blocked domains. |

#### `CheckResult` dataclass

```python
@dataclass
class CheckResult:
    email: str
    domain: Optional[str]
    is_disposable: bool
    reason: Optional[str]  # 'blocklist' | 'invalid_email' | None

    def to_dict(self) -> dict: ...
```

| Field | Type | Description |
|---|---|---|
| `email` | `str` | The original input email. |
| `domain` | `Optional[str]` | The lowercased domain, or `None` if the email is invalid. |
| `is_disposable` | `bool` | Whether the domain appears on the blocklist. |
| `reason` | `Optional[str]` | `'blocklist'` if flagged, `'invalid_email'` if malformed, `None` if clean. |

---

## Repository Structure

```
burner-bouncer/
├── data/
│   └── disposable_domains.json   # Shared blocklist (500+ domains)
├── js/
│   ├── src/
│   │   └── index.ts              # JS/TS library source
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
├── .github/
│   └── workflows/
│       ├── ci.yml                # CI: test JS + Python on every push/PR
│       └── publish.yml           # Publish to npm + PyPI on version tag
├── .gitignore
├── LICENSE
└── README.md
```

---

## Contributing

1. Fork the repository and create a feature branch.
2. Add domains to `data/disposable_domains.json` (keep it sorted and deduplicated).
3. Run the test suites: `cd js && npm test` and `cd python && pytest`.
4. Open a pull request — CI will run automatically.

---

## License

[MIT](./LICENSE) © 2025 burner-bouncer contributors
