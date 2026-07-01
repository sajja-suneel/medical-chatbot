# C:\Users\sajja\vscode\health\backend\app\utils\security.py
import hashlib
import os
from argon2 import PasswordHasher as Argon2Hasher
from argon2.exceptions import VerifyMismatchError


class PasswordHasher:
    """A service class to handle secure password hashing and verification
    using Argon2id, with backward compatibility for legacy PBKDF2 hashes.
    """

    def __init__(
        self,
        hash_name: str = "sha256",
        iterations: int = 100_000,
        salt_size: int = 16,
    ):
        # Initialize Argon2id hasher
        self.ph = Argon2Hasher()
        
        # Keep PBKDF2 legacy params for backward compatibility
        self.hash_name = hash_name
        self.iterations = iterations
        self.salt_size = salt_size

    def hash_password(self, password: str) -> str:
        """Hashes a password using Argon2id."""
        return self.ph.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifies a plain text password against Argon2id or legacy PBKDF2 hashes."""
        if not hashed_password:
            return False

        # Case 1: Argon2id hash (starts with $argon2)
        if hashed_password.startswith("$argon2"):
            try:
                # Argon2 automatically handles salt and iterations from the hash string
                return self.ph.verify(hashed_password, plain_password)
            except VerifyMismatchError:
                return False
            except Exception:
                return False

        # Case 2: Legacy PBKDF2 hash fallback
        elif ":" in hashed_password:
            try:
                salt_hex, hash_hex = hashed_password.split(":")
                salt = bytes.fromhex(salt_hex)
                expected_hash = bytes.fromhex(hash_hex)

                # Recompute the PBKDF2 hash using identical settings
                test_hash = hashlib.pbkdf2_hmac(
                    self.hash_name,
                    plain_password.encode("utf-8"),
                    salt,
                    self.iterations,
                )
                return hashlib.hmac.compare_digest(test_hash, expected_hash)
            except Exception:
                return False

        return False


# ==========================================================
# Compatibility Layer (Adapter) for Module-Level Imports
# ==========================================================
_hasher = PasswordHasher()
hash_password = _hasher.hash_password
verify_password = _hasher.verify_password


if __name__ == "__main__":
    # Example usage / validation:
    hasher = PasswordHasher()
    
    secret = "SuperSecurePassword123!"
    stored_string = hasher.hash_password(secret)
    print(f"Argon2id Hash Result: {stored_string}")
    
    # Validation
    is_valid = hasher.verify_password(secret, stored_string)
    print(f"Password Valid: {is_valid}")