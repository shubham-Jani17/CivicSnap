from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Category(str, Enum):
    ROAD_HAZARD = "ROAD_HAZARD"
    WASTE_MANAGEMENT = "WASTE_MANAGEMENT"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    PARK_MAINTENANCE = "PARK_MAINTENANCE"

class VolunteerEvent(BaseModel):
    title: str = Field(..., description="Actionable volunteering project title")
    description: str = Field(..., description="Details of the volunteer work")

class IssueAnalysisResult(BaseModel):
    title: str = Field(..., description="Short title identifying the hazard")
    description: str = Field(..., description="Detailed objective description of the visual damage")
    category: str = Field(..., description="The category or classification of the civic issue")
    severity: str = Field(..., description="The severity level or priority level (e.g. LOW, MEDIUM, HIGH, CRITICAL)")
    authority: str = Field(..., description="The municipal authority or public works department in charge of repair")
    summary: str = Field(..., description="Concise summary of the civic hazard and its impact")

class IssueAnalysisRequest(BaseModel):
    imageBase64: str = Field(..., description="Base64 encoded image string or data URI")
    locationName: Optional[str] = Field(None, description="Descriptive address or coordinates")

class IssueAnalysisResponse(BaseModel):
    success: bool
    isMock: Optional[bool] = False
    analysis: IssueAnalysisResult
