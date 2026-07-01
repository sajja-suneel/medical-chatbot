# backend/app/utils/firebase_verifier.py
import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

# Ensure environment variables from .env are loaded
load_dotenv()

security_bearer = HTTPBearer()

# Fallback to "firebase-service-account.json" if environment variable is None or empty
firebase_key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH") or "firebase-service-account.json"

# Initialize the Firebase Admin SDK singleton
if not firebase_admin._apps:
    try:
        if os.path.exists(firebase_key_path):
            cred = credentials.Certificate(firebase_key_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK successfully initialized using service account JSON key.")
        else:
            firebase_admin.initialize_app()
            print("Firebase Admin SDK initialized using default credentials.")
    except Exception as e:
        print(f"Failed to initialize Firebase Admin SDK: {e}")


def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer)
) -> dict:
    """FastAPI dependency to decode and cryptographically verify the Firebase ID Token."""
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID Token has expired."
        )
    except auth.InvalidIdTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase ID Token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Firebase Authentication failed: {str(e)}"
        )


get_current_user = verify_firebase_token