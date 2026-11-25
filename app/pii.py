"""Versioned authenticated encryption and keyed lookup indexes for user PII."""
import base64
import hashlib
import hmac
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


class PIIProtector:
    FIELDS = frozenset(("phone", "email", "first_name", "last_name"))

    def __init__(self, encryption_key, lookup_key):
        if len(encryption_key) != 32 or len(lookup_key) != 32:
            raise ValueError("PII keys must each contain 32 bytes")
        if hmac.compare_digest(encryption_key, lookup_key):
            raise ValueError("PII keys must be independent")
        self._cipher = AESGCM(encryption_key)
        self._lookup_key = lookup_key

    @classmethod
    def from_env(cls):
        def key(name):
            return base64.b64decode(os.environ[name], validate=True)
        return cls(key("PII_ENCRYPTION_KEY"), key("PII_LOOKUP_KEY"))

    def _aad(self, user_id, field):
        if field not in self.FIELDS or not user_id:
            raise ValueError("Invalid PII context")
        return f"parma:user:v1:{user_id}:{field}".encode("utf-8")

    def encrypt(self, user_id, field, value):
        if value is None:
            return None
        nonce = os.urandom(12)
        ciphertext = self._cipher.encrypt(nonce, value.encode("utf-8"), self._aad(user_id, field))
        return "v1:" + base64.b64encode(nonce + ciphertext).decode("ascii")

    def decrypt(self, user_id, field, value):
        if value is None:
            return None
        if not value.startswith("v1:"):
            raise ValueError("Unsupported PII ciphertext version")
        raw = base64.b64decode(value[3:], validate=True)
        return self._cipher.decrypt(raw[:12], raw[12:], self._aad(user_id, field)).decode("utf-8")

    def lookup(self, field, normalized_value):
        if field not in ("phone", "email"):
            raise ValueError("Unsupported lookup field")
        if normalized_value is None:
            return None
        message = f"parma:lookup:v1:{field}:{normalized_value}".encode("utf-8")
        return hmac.new(self._lookup_key, message, hashlib.sha256).hexdigest()
