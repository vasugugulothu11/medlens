import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Patient, MedicalReport, LabResult
from app.schemas import AnatomyIssuesRequest, AnatomyResponse, AnatomyHighlight
from app.services.anatomy_mapper import map_patient_to_anatomy

router = APIRouter(prefix="/api/anatomy", tags=["3D Anatomy Mapping"])

def _from_json_list(data_str: str) -> List[str]:
    if not data_str:
        return []
    try:
        parsed = json.loads(data_str)
        if isinstance(parsed, list):
            return parsed
        return [str(parsed)]
    except Exception:
        return [s.strip() for s in data_str.split(",") if s.strip()]

@router.post("/issues", response_model=AnatomyResponse)
def get_anatomy_issues(payload: AnatomyIssuesRequest, db: Session = Depends(get_db)):
    """
    Computes 3D anatomical highlights for a patient based on:
    1. Diagnosed clinical conditions
    2. Reported symptoms
    3. Abnormal lab values from recent reports

    Matches target 3D meshes (heart, pancreas, kidneys, liver, lungs, brain, nerves, veins, etc.)
    with clear justifications and severity levels.
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

    lab_items = []
    if latest_report:
        results = db.query(LabResult).filter(LabResult.report_id == latest_report.id).all()
        lab_items = [
            {
                "test_name": lr.test_name,
                "value": lr.value,
                "units": lr.units,
                "reference_range": lr.reference_range,
                "status": lr.status
            }
            for lr in results
        ]

    conditions = _from_json_list(patient.conditions)
    symptoms = patient.symptoms or ""

    mapped_highlights = map_patient_to_anatomy(
        conditions=conditions,
        symptoms=symptoms,
        lab_results=lab_items
    )

    output_highlights = [
        AnatomyHighlight(
            structureId=h["structureId"],
            label=h["label"],
            severity=h["severity"],
            reason=h["reason"],
            system=h["system"],
            source=h["source"]
        )
        for h in mapped_highlights
    ]

    return AnatomyResponse(
        patient_id=patient.id,
        highlights=output_highlights,
        totalIssues=len(output_highlights)
    )
