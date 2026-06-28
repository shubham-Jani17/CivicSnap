from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any

from backend.services.firebase import FirebaseService
from backend.config import logger

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Security dependency to verify incoming Firebase bearer token in HTTP requests.
    Raises 401 Unauthorized if verification fails or is absent.
    """
    token = credentials.credentials
    decoded_token = FirebaseService.verify_token(token)
    
    if not decoded_token:
        logger.warning("Rejected request: Invalid or expired Firebase ID Token.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or malformed authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return decoded_token
