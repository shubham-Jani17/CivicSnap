from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserVerificationRequest(BaseModel):
    idToken: str = Field(..., description="Firebase Auth ID Token passed from the client")

class UserProfile(BaseModel):
    uid: str
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    soundEnabled: bool = True
    actionPoints: int = 100
