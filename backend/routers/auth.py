from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from backend.schemas.auth import UserProfile
from backend.services.firebase import FirebaseService
from backend.dependencies import get_current_user
from backend.config import logger

router = APIRouter(prefix="/api", tags=["Citizen Authentication & Profiles"])

@router.get("/auth/profile", response_model=UserProfile)
async def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Retrieves or auto-bootstraps the active citizen profile in Firestore.
    Runs verification on the client Firebase token first.
    """
    uid = current_user.get("uid")
    profile = FirebaseService.get_user_profile(uid)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error building or retrieving user citizen profile."
        )
    
    return UserProfile(
        uid=profile.get("uid"),
        email=profile.get("email"),
        name=profile.get("name"),
        picture=profile.get("picture"),
        soundEnabled=profile.get("soundEnabled", True),
        actionPoints=profile.get("actionPoints", 0)
    )

@router.put("/auth/profile")
async def update_my_profile(updates: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Updates the current citizen profile preferences (e.g., sound alerts, display names).
    """
    uid = current_user.get("uid")
    
    # Filter safe parameters to avoid malicious mutations of action points
    allowed_keys = {"name", "soundEnabled", "picture"}
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_keys}
    
    if not filtered_updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields provided for modification."
        )

    success = FirebaseService.update_user_profile(uid, filtered_updates)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile database update failed."
        )
        
    return {"success": True, "message": "Citizen profile synchronized."}

@router.get("/leaderboard", response_model=List[UserProfile])
async def get_civic_leaderboard(limit: int = 10):
    """
    Fetches top active citizens ranked by accumulated Action Points.
    Fosters community gamification and civic awareness.
    """
    raw_leaderboard = FirebaseService.get_leaderboard(limit)
    return [
        UserProfile(
            uid=item.get("uid"),
            email=item.get("email"),
            name=item.get("name"),
            picture=item.get("picture"),
            soundEnabled=item.get("soundEnabled", True),
            actionPoints=item.get("actionPoints", 0)
        )
        for item in raw_leaderboard
    ]
