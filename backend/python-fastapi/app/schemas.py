from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, Field

# --- Patient Schemas ---
class PatientProfile(BaseModel):
    name: Optional[str] = Field(default="Anonymous Patient", description="Patient name or identifier")
    age: int = Field(..., ge=0, le=130, description="Age in years")
    sex: str = Field(..., description="Sex: male, female, or other")
    symptoms: Optional[str] = Field(None, description="Patient-reported symptoms")
    conditions: List[str] = Field(default_factory=list, description="Known diagnosed conditions")
    allergies: List[str] = Field(default_factory=list, description="Documented drug or food allergies")
    medications: List[str] = Field(default_factory=list, description="Current medications & supplements")
    notes: Optional[str] = Field(None, description="Additional clinician or patient notes")

class PatientCreate(PatientProfile):
    pass

class PatientUpdate(PatientProfile):
    pass

class PatientRead(PatientProfile):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Lab Result Schemas ---
class LabResultBase(BaseModel):
    test_name: str
    value: str
    units: Optional[str] = None
    reference_range: Optional[str] = None
    date: Optional[str] = None
    remarks: Optional[str] = None
    status: str = Field(default="range_unavailable", description="low, normal, high, or range_unavailable")
    source_snippet: str = Field(..., description="Exact textual excerpt from the report for traceability")
    confidence: str = Field(default="medium", description="high, medium, low extraction certainty")
    verification_status: str = Field(default="unverified", description="unverified, user_verified, or flagged")

class LabResultCreate(LabResultBase):
    pass

class LabResultUpdate(BaseModel):
    value: Optional[str] = None
    reference_range: Optional[str] = None
    verification_status: Optional[str] = None

class LabResultRead(LabResultBase):
    id: int
    report_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Medical Report Schemas ---
class MedicalReportCreate(BaseModel):
    report_date: Optional[str] = None
    raw_text: str

class MedicalReportRead(BaseModel):
    id: int
    patient_id: int
    report_date: Optional[str] = None
    raw_text: str
    created_at: datetime
    results: List[LabResultRead] = Field(default_factory=list)

    class Config:
        from_attributes = True

class ProcessReportRequest(BaseModel):
    raw_text: str
    report_date: Optional[str] = None


# --- AI Service Request / Response Schemas ---
class ExtractReportRequest(BaseModel):
    reportText: str

class ExtractedLabItem(BaseModel):
    test_name: str
    value: str
    units: Optional[str] = None
    reference_range: Optional[str] = None
    date: Optional[str] = None
    remarks: Optional[str] = None
    source_snippet: str
    confidence: str = "medium"

class ExtractReportResponse(BaseModel):
    results: List[ExtractedLabItem]
    processingNotes: Optional[str] = None

class ComputeStatusRequest(BaseModel):
    results: List[ExtractedLabItem]

class ComputedLabItem(ExtractedLabItem):
    status: str

class ComputeStatusResponse(BaseModel):
    results: List[ComputedLabItem]


# --- Summary Schemas ---
class SummaryCreate(BaseModel):
    summary_text: str
    questions_json: str
    language: str = "en"

class SummaryRequest(BaseModel):
    patient_id: int
    language: Optional[str] = "en"

class SummaryResponse(BaseModel):
    summaryText: str
    questionsForClinician: List[str]
    disclaimer: str = "This summary is AI-generated and is not a medical diagnosis or treatment plan."

class SummaryRead(BaseModel):
    id: int
    patient_id: int
    summary_text: str
    questions: List[str]
    language: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Inconsistency Schemas ---
class ConflictItem(BaseModel):
    type: str  # allergy_medication, diagnosis_conflict, lab_value_conflict, other
    description: str
    severity: str  # high, medium, low
    fact_a: str
    fact_b: str
    source_a: str
    source_b: str

class InconsistencyRequest(BaseModel):
    patient_id: int

class InconsistencyResponse(BaseModel):
    conflicts: List[ConflictItem]
    explanation: Optional[str] = None

class InconsistencyRead(ConflictItem):
    id: int
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Anatomy Schemas ---
class AnatomyHighlight(BaseModel):
    structureId: str
    label: str
    severity: str  # high, medium, low
    reason: str
    system: str    # cardiovascular, endocrine, renal, nervous, respiratory, etc.
    source: str    # "Lab Result", "Reported Condition", "Reported Symptom"

class AnatomyIssuesRequest(BaseModel):
    patient_id: int

class AnatomyResponse(BaseModel):
    patient_id: int
    highlights: List[AnatomyHighlight]
    totalIssues: int
