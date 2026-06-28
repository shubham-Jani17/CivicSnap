from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Dict, Any, Optional

from backend.schemas.issue import IssueAnalysisRequest, IssueAnalysisResponse, IssueAnalysisResult
from backend.services.gemini import analyze_civic_issue, analyze_civic_issue_bytes
from backend.services.firebase import FirebaseService
from backend.dependencies import get_current_user
from backend.config import logger

router = APIRouter(prefix="/api/issues", tags=["Civic Issues"])

@router.post("/analyze/upload", response_model=IssueAnalysisResponse)
async def analyze_issue_upload(
    file: UploadFile = File(...),
    locationName: Optional[str] = Form(None)
):
    """
    Multimodal analysis route using multipart/form-data. Takes an uploaded image of a civic hazard
    and triages it using Gemini 2.5 Flash directly, returning structured JSON response without
    relying on base64 encoding or storage buckets.
    """
    logger.info(f"Received multipart request for civic issue analysis. Filename: {file.filename}, Location Context: {locationName or 'None'}")
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid file attachment was submitted in form-data."
        )

    try:
        # Read file stream bytes directly
        image_bytes = await file.read()
        mime_type = file.content_type or "image/jpeg"
        
        result = await analyze_civic_issue_bytes(image_bytes, mime_type, locationName)
        
        return IssueAnalysisResponse(
            success=True,
            isMock=result.get("isMock", False),
            analysis=result.get("analysis")
        )
    except Exception as e:
        logger.error(f"Error handling uploaded file in route: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process file upload: {str(e)}"
        )

@router.post("/analyze", response_model=IssueAnalysisResponse)
async def analyze_issue(payload: IssueAnalysisRequest):
    """
    Multimodal analysis route. Takes a base64 encoded picture of a civic hazard
    and triages it using Gemini 2.5 Flash, returning structured categorizations and letters.
    """
    logger.info(f"Received request for civic issue analysis. Location Context: {payload.locationName or 'None'}")
    
    if not payload.imageBase64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid base64 image data was submitted."
        )

    result = await analyze_civic_issue(payload.imageBase64, payload.locationName)
    
    return IssueAnalysisResponse(
        success=True,
        isMock=result.get("isMock", False),
        analysis=result.get("analysis")
    )

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new_issue(report: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Submits a newly triaged civic report to the community Firestore database.
    Secured by Firebase ID token validation.
    """
    uid = current_user.get("uid")
    logger.info(f"User {uid} is submitting a new civic report.")
    
    doc_id = FirebaseService.create_report(uid, report)
    if not doc_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save report to database."
        )
    
    return {"success": True, "id": doc_id, "message": "Report created successfully and points awarded!"}

@router.get("", response_model=List[Dict[str, Any]])
async def get_issues_feed():
    """Retrieves all reported community issues in the neighborhood sector."""
    return FirebaseService.get_all_issues()

@router.post("/{issue_id}/upvote")
async def upvote_issue(issue_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Toggles a user's endorsement (upvote) of a reported issue.
    Awards active civic points on completion.
    """
    uid = current_user.get("uid")
    logger.info(f"User {uid} toggled upvote on issue {issue_id}.")
    
    updated_issue = FirebaseService.toggle_upvote_issue(issue_id, uid)
    if not updated_issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with ID {issue_id} could not be located or updated."
        )
    
    return {"success": True, "issue": updated_issue}

@router.post("/{issue_id}/volunteer")
async def volunteer_for_event(issue_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Enrolls the current logged-in citizen into a community-led volunteering task.
    Highly rewards the active citizen with point boosts.
    """
    uid = current_user.get("uid")
    logger.info(f"User {uid} requested to volunteer for issue {issue_id}.")
    
    updated_issue = FirebaseService.join_volunteer_event(issue_id, uid)
    if not updated_issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unable to volunteer: Issue with ID {issue_id} not found."
        )
    
    return {"success": True, "issue": updated_issue}
