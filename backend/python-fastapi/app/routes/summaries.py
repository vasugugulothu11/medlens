import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Patient, MedicalReport, LabResult, Summary
from app.schemas import SummaryRequest, SummaryRead
from app.services.llm import generate_summary

router = APIRouter(prefix="/api/summaries", tags=["Patient Summaries & Question Builder"])

def _from_json_list(data_str: str) -> List[str]:
    if not data_str:
        return []
    try:
        parsed = json.loads(data_str)
        if isinstance(parsed, list):
            return parsed
        return [str(parsed)]
    except Exception:
        return [s.strip() for s in data_str.split("\n") if s.strip()]

def _serialize_summary(s: Summary) -> SummaryRead:
    return SummaryRead(
        id=s.id,
        patient_id=s.patient_id,
        summary_text=s.summary_text,
        questions=_from_json_list(s.questions_json),
        language=s.language or "en",
        created_at=s.created_at
    )

@router.get("/patient/{patient_id}", response_model=List[SummaryRead])
def list_summaries_for_patient(patient_id: int, db: Session = Depends(get_db)):
    """
    List all generated summaries for a given patient.
    """
    summaries = (
        db.query(Summary)
        .filter(Summary.patient_id == patient_id)
        .order_by(Summary.created_at.desc())
        .all()
    )
    return [_serialize_summary(s) for s in summaries]

@router.post("/generate", response_model=SummaryRead, status_code=status.HTTP_201_CREATED)
def generate_patient_summary(payload: SummaryRequest, db: Session = Depends(get_db)):
    """
    Generates a concise, patient-friendly explanation and questions for the clinician.
    Non-diagnostic, safe, traceable, and saved to database.
    """
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Load latest reports and lab results
    latest_report = (
        db.query(MedicalReport)
        .filter(MedicalReport.patient_id == payload.patient_id)
        .order_by(MedicalReport.created_at.desc())
        .first()
    )

    results_data = []
    if latest_report:
        lab_items = (
            db.query(LabResult)
            .filter(LabResult.report_id == latest_report.id)
            .all()
        )
        results_data = [
            {
                "test_name": lr.test_name,
                "value": lr.value,
                "units": lr.units,
                "reference_range": lr.reference_range,
                "status": lr.status,
                "confidence": lr.confidence
            }
            for lr in lab_items
        ]

    # Prepare patient dictionary
    patient_dict = {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "sex": patient.sex,
        "symptoms": patient.symptoms,
        "conditions": _from_json_list(patient.conditions),
        "allergies": _from_json_list(patient.allergies),
        "medications": _from_json_list(patient.medications),
        "notes": patient.notes
    }

    ai_output = generate_summary(patient_dict, results_data, language=payload.language or "en")

    # Persist summary
    summary_row = Summary(
        patient_id=patient.id,
        summary_text=ai_output.get("summaryText", ""),
        questions_json=json.dumps(ai_output.get("questionsForClinician", [])),
        language=payload.language or "en"
    )
    db.add(summary_row)
    db.commit()
    db.refresh(summary_row)

    return _serialize_summary(summary_row)
