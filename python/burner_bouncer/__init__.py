from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

_DATA_FILE = Path(__file__).parent.parent.parent / "data" / "disposable_domains.json"

def _load_blocklist() -> frozenset:
    with open(_DATA_FILE, "r", encoding="utf-8") as f:
        domains = json.load(f)
    return frozenset(d.lower() for d in domains)

_BLOCKLIST: frozenset = _load_blocklist()
_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


@dataclass
class CheckResult:
    email: str
    domain: Optional[str]
    is_disposable: bool
    reason: Optional[str]  # "blocklist" | "invalid_email" | None

    def to_dict(self) -> dict:
        return {
            "email": self.email,
            "domain": self.domain,
            "is_disposable": self.is_disposable,
            "reason": self.reason,
        }


def get_domain(email: str) -> Optional[str]:
    email = email.strip().lower()
    parts = email.split("@")
    if len(parts) != 2:
        return None
    local, domain = parts
    if not local or not domain or "." not in domain:
        return None
    return domain


def is_disposable(email: str) -> bool:
    domain = get_domain(email)
    if domain is None:
        return False
    return domain in _BLOCKLIST


def check(email: str) -> CheckResult:
    domain = get_domain(email)
    if domain is None:
        return CheckResult(email=email, domain=None, is_disposable=False, reason="invalid_email")
    disposable = domain in _BLOCKLIST
    return CheckResult(
        email=email,
        domain=domain,
        is_disposable=disposable,
        reason="blocklist" if disposable else None,
    )


def check_many(emails: List[str]) -> List[CheckResult]:
    return [check(e) for e in emails]


def get_blocklist() -> List[str]:
    return sorted(_BLOCKLIST)
