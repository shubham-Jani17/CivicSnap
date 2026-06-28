import base64
import json
import logging
from typing import Dict, Any, Optional
from google import genai
from google.genai import types
from google.genai.errors import APIError

from backend.config import get_gemini_client, logger
from backend.schemas.issue import IssueAnalysisResult, Severity, Category

# Fallback mockup response in case of API Key absence or failures
MOCK_ANALYSIS = {
    "title": "Large Street Crater & Asphalt Erosion",
    "description": "A wide, hazardous crater measuring roughly 3 feet across. Exposed soil and deep fragmentation are visible, posing immediate dangers to cyclists, motorists, and pedestrians during night hours.",
    "category": "ROAD_HAZARD",
    "severity": "HIGH",
    "authority": "Department of Public Works",
    "summary": "This is a severe road crater and pavement failure on the street segment, causing local safety risks. Urgent maintenance and structural patch repairs are highly advised."
}

def clean_base64_image(image_base64: str) -> tuple[str, str]:
    """
    Cleans data URI prefix from base64 if present and extracts mime type.
    Returns: (mime_type, pure_base64_string)
    """
    if image_base64.startswith("data:"):
        header, encoded = image_base64.split(",", 1)
        mime_type = header.split(";")[0].split(":")[1]
        return mime_type, encoded
    return "image/jpeg", image_base64

async def analyze_civic_issue_bytes(image_bytes: bytes, mime_type: str, location_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyzes raw image bytes of a civic issue using Google Gemini 2.5/3.5 Flash.
    Returns a dictionary matching the IssueAnalysisResult schema.
    """
    client = get_gemini_client()
    
    if not client:
        logger.warning("Gemini Client not available. Utilizing demonstration mock analysis.")
        return {"isMock": True, "analysis": MOCK_ANALYSIS}

    try:
        # Build the image part for Google GenAI SDK
        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type=mime_type
        )

        prompt_text = f"""
        You are the backend AI triage coordinator for CivicSnap.
        Analyze the attached image which depicts a civic/community hazard or issue.
        
        Determine and extract:
        1. "title": A short, clean descriptive title identifying the hazard (e.g. "Pavement Failure", "Illegal Dumping").
        2. "description": A highly detailed, objective description of what is shown in the image and its immediate community impact.
        3. "category": The category or classification of the civic issue (e.g. "ROAD_HAZARD", "WASTE_MANAGEMENT", "INFRASTRUCTURE", "PARK_MAINTENANCE", etc.).
        4. "severity": The threat or urgency level posed by the hazard (e.g. "LOW", "MEDIUM", "HIGH", "CRITICAL").
        5. "authority": The local municipal agency or city department in charge of repair (e.g. "Department of Public Works", "Parks & Recreation Dept").
        6. "summary": A brief, concise 2-3 sentence executive summary of the civic hazard and repair recommendations. Mention "{location_name or 'our local community block'}" if relevant.
        
        Return the output as structured JSON matching the requested schema.
        """

        # Enforce exact response schema using types
        # Note: google-genai library supports Pydantic models directly as schema!
        config = types.GenerateContentConfig(
            temperature=0.2,
            response_mime_type="application/json",
            response_schema=IssueAnalysisResult,
        )

        logger.info("Dispatching image bytes analysis to Gemini Model...")
        
        # Use 'gemini-2.5-flash' which has excellent, stable JSON Schema & multimodal capabilities
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[image_part, prompt_text],
            config=config
        )

        if not response.text:
            raise ValueError("No text payload returned from Gemini AI.")

        parsed_json = json.loads(response.text.strip())
        logger.info("Successfully received structured analysis from Gemini.")
        
        return {
            "isMock": False,
            "analysis": parsed_json
        }

    except APIError as api_err:
        logger.error(f"Gemini API Error occurred: {api_err}")
        # Graceful fallback to avoid interrupting user flows
        return {
            "isMock": True,
            "error_details": str(api_err),
            "analysis": MOCK_ANALYSIS
        }
    except Exception as e:
        logger.error(f"Unexpected error in Gemini analysis service: {e}")
        return {
            "isMock": True,
            "error_details": str(e),
            "analysis": MOCK_ANALYSIS
        }

async def analyze_civic_issue(image_base64: str, location_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyzes an image of a civic issue using Google Gemini 2.5/3.5 Flash.
    Returns a dictionary matching the IssueAnalysisResult schema.
    """
    try:
        mime_type, pure_base64 = clean_base64_image(image_base64)
        image_bytes = base64.b64decode(pure_base64)
        return await analyze_civic_issue_bytes(image_bytes, mime_type, location_name)
    except Exception as e:
        logger.error(f"Failed to decode base64 for Gemini analysis: {e}")
        return {
            "isMock": True,
            "error_details": str(e),
            "analysis": MOCK_ANALYSIS
        }
