# backend/app/api/auth.py
import os
import certifi
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from pymongo import MongoClient

router = APIRouter(prefix="/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str = "" # Handled securely by Firebase; ignored in local DB
    role: str = "Medical Assistant"

class LoginRequest(BaseModel):
    email: str
    password: str = "" # Handled securely by Firebase; ignored in local DB

# MongoDB Setup
MONGO_URI = os.getenv("MONGO_URI") or "mongodb://localhost:27017"
try:
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
except TypeError:
    client = MongoClient(MONGO_URI, ssl_ca_certs=certifi.where())

db = client["healthcare_db"]
users_collection = db["users"]

@router.post("/signup")
def signup(request: SignupRequest):
    email = request.email.strip().lower()
    
    if "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )

    # Check if profile already exists in MongoDB
    user = users_collection.find_one({"email": email})
    
    user_data = {
        "name": request.name.strip(),
        "email": email,
        "role": request.role
    }

    if user:
        users_collection.update_one({"email": email}, {"$set": user_data})
    else:
        # Use copy() to prevent PyMongo from injecting the non-serializable ObjectId in-place
        users_collection.insert_one(user_data.copy())

    return {
        "message": "User profile successfully registered.",
        "user": user_data
    }

@router.post("/login")
def login(request: LoginRequest):
    email = request.email.strip().lower()
    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User profile not found in local database."
        )

    return {
        "message": "User session fetched successfully.",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "Medical Assistant")
        }
    }