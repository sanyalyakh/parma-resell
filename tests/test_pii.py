import os
import pytest
from cryptography.exceptions import InvalidTag
from app.pii import PIIProtector


def test_roundtrip_and_random_nonce():
    p = PIIProtector(os.urandom(32), os.urandom(32))
    value = "Иван"
    a = p.encrypt("user-1", "first_name", value)
    b = p.encrypt("user-1", "first_name", value)
    assert a != b
    assert p.decrypt("user-1", "first_name", a) == value
    with pytest.raises(InvalidTag):
        p.decrypt("user-2", "first_name", a)
    with pytest.raises(InvalidTag):
        p.decrypt("user-1", "last_name", a)


def test_lookup_and_missing_values():
    p = PIIProtector(os.urandom(32), os.urandom(32))
    assert p.lookup("phone", "+79990000001") == p.lookup("phone", "+79990000001")
    assert p.lookup("phone", "x") != p.lookup("email", "x")
    assert p.encrypt("user-1", "email", None) is None
    assert p.lookup("email", None) is None
    with pytest.raises(ValueError):
        PIIProtector(bytes(32), bytes(32))
