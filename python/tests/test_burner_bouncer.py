import pytest
from burner_bouncer import is_disposable, check, check_many, get_domain, get_blocklist, CheckResult


def test_get_domain_valid():
    assert get_domain("user@mailinator.com") == "mailinator.com"


def test_get_domain_invalid():
    assert get_domain("notanemail") is None
    assert get_domain("@domain.com") is None
    assert get_domain("user@") is None
    assert get_domain("user@nodot") is None


def test_get_domain_case_insensitive():
    assert get_domain("USER@MAILINATOR.COM") == "mailinator.com"


def test_is_disposable_known_domains():
    assert is_disposable("test@mailinator.com") is True
    assert is_disposable("user@guerrillamail.com") is True
    assert is_disposable("foo@yopmail.com") is True


def test_is_disposable_real_domains():
    assert is_disposable("user@gmail.com") is False
    assert is_disposable("user@yahoo.com") is False
    assert is_disposable("user@outlook.com") is False


def test_is_disposable_case_insensitive():
    assert is_disposable("USER@MAILINATOR.COM") is True
    assert is_disposable("Test@YopMail.com") is True


def test_is_disposable_invalid_email():
    assert is_disposable("notanemail") is False


def test_check_disposable():
    result = check("test@mailinator.com")
    assert isinstance(result, CheckResult)
    assert result.email == "test@mailinator.com"
    assert result.domain == "mailinator.com"
    assert result.is_disposable is True
    assert result.reason == "blocklist"


def test_check_legitimate():
    result = check("user@gmail.com")
    assert result.domain == "gmail.com"
    assert result.is_disposable is False
    assert result.reason is None


def test_check_invalid_email():
    result = check("notanemail")
    assert result.domain is None
    assert result.is_disposable is False
    assert result.reason == "invalid_email"


def test_check_case_insensitive():
    result = check("USER@MAILINATOR.COM")
    assert result.is_disposable is True
    assert result.domain == "mailinator.com"


def test_check_to_dict():
    result = check("test@mailinator.com")
    d = result.to_dict()
    assert d["email"] == "test@mailinator.com"
    assert d["domain"] == "mailinator.com"
    assert d["is_disposable"] is True
    assert d["reason"] == "blocklist"


def test_check_many():
    results = check_many(["test@mailinator.com", "user@gmail.com", "bad"])
    assert len(results) == 3
    assert results[0].is_disposable is True
    assert results[1].is_disposable is False
    assert results[2].reason == "invalid_email"


def test_check_many_empty():
    assert check_many([]) == []


def test_get_blocklist():
    bl = get_blocklist()
    assert isinstance(bl, list)
    assert len(bl) > 100
    assert bl == sorted(bl)
    assert "mailinator.com" in bl
    assert "yopmail.com" in bl
