import pytest
from burner_bouncer import (
    is_disposable, check, check_many, get_domain, get_blocklist,
    is_free_provider, is_role_address, suggest, get_free_providers,
    check_with_dns, CheckResult,
)


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


def test_is_free_provider_known():
    assert is_free_provider("user@gmail.com") is True
    assert is_free_provider("user@yahoo.com") is True
    assert is_free_provider("user@hotmail.com") is True
    assert is_free_provider("user@protonmail.com") is True


def test_is_free_provider_not_free():
    assert is_free_provider("user@company.com") is False
    assert is_free_provider("user@mailinator.com") is False


def test_is_free_provider_invalid():
    assert is_free_provider("notanemail") is False


def test_is_role_address_known():
    assert is_role_address("admin@example.com") is True
    assert is_role_address("noreply@example.com") is True
    assert is_role_address("support@example.com") is True
    assert is_role_address("info@example.com") is True


def test_is_role_address_personal():
    assert is_role_address("john@example.com") is False
    assert is_role_address("alice@gmail.com") is False


def test_is_role_address_plus():
    assert is_role_address("admin+tag@example.com") is True


def test_suggest_typo():
    assert suggest("user@gmial.com") == "user@gmail.com"
    assert suggest("user@yaho.com") == "user@yahoo.com"


def test_suggest_correct_domain():
    assert suggest("user@gmail.com") is None


def test_suggest_invalid_email():
    assert suggest("notanemail") is None


def test_suggest_no_match():
    assert suggest("user@zzzzzzz.com") is None


def test_check_disposable():
    result = check("test@mailinator.com")
    assert isinstance(result, CheckResult)
    assert result.email == "test@mailinator.com"
    assert result.domain == "mailinator.com"
    assert result.is_disposable is True
    assert result.is_free_provider is False
    assert result.is_role_address is False
    assert result.reason == "blocklist"


def test_check_legitimate():
    result = check("user@gmail.com")
    assert result.domain == "gmail.com"
    assert result.is_disposable is False
    assert result.is_free_provider is True
    assert result.reason is None


def test_check_role_address():
    result = check("admin@example.com")
    assert result.is_role_address is True


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
    assert d["is_free_provider"] is False
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


def test_get_free_providers():
    fp = get_free_providers()
    assert isinstance(fp, list)
    assert "gmail.com" in fp
    assert "yahoo.com" in fp
    assert fp == sorted(fp)


def test_check_with_dns_valid():
    result = check_with_dns("user@gmail.com")
    assert result.has_mx is True or result.has_mx is False  # boolean either way


def test_check_with_dns_invalid():
    result = check_with_dns("notanemail")
    assert result.has_mx is None
