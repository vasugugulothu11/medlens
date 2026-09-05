import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Patient, MedicalReport, LabResult, Inconsistency
from app.schemas import InconsistencyRequest, InconsistencyRead
from app.services.llm import detect_inconsistencies

router = APIRouter(prefix="/api/inconsistencies", tags=["Clinical Inconsistencies & Safety"])

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

@router.get("/patient/{patient_id}", response_model=List[InconsistencyRead])
def list_inconsistencies(patient_id: int, db: Session = Depends(get_db)):
    """
    List all detected potential inconsistencies for a patient.
    """
    items = (
        db.query(Inconsistency)
        .filter(Inconsistency.patient_id == patient_id)
        .order_by(Inconsistency.created_at.desc())
        .all()
    )
    return [
        InconsistencyRead(
            id=item.id,
            patient_id=item.patient_id,
            type=item.type,
            description=item.description,
            severity=item.severity,
            fact_a=item.fact_a,
            fact_b=item.fact_b,
            source_a=item.source_a,
            source_b=item.source_b,
            created_at=item.created_at
        )
        for item in items
    ]

@router.post("/detect", response_model=List[InconsistencyRead], status_code=status.HTTP_201_CREATED)
def detect_patient_inconsistencies(payload: InconsistencyRequest, db: Session = Depends(get_db)):
    """
    Evaluates patient profile against reports to detect allergy-medication, diagnosis, or lab discrepancies.
    Saves new findings to the database with source references.
    """
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Load reports and lab results
    reports = (
        db.query(MedicalReport)
        .filter(MedicalReport.patient_id == payload.patient_id)
        .order_by(MedicalReport.created_at.desc())
        .all()
    )

    reports_data = []
    for r in reports:
        lab_items = db.query(LabResult).filter(LabResult.report_id == r.id).all()
        reports_data.append({
            "id": r.id,
            "report_date": r.report_date,
            "raw_text": r.raw_text[:1000],  # Bound text length for prompt efficiency
            "results": [
                {
                    "test_name": lr.test_name,
                    "value": lr.value,
                    "units": lr.units,
                    "reference_range": lr.reference_range,
                    "status": lr.status
                }
                for lr in lab_items
            ]
        })

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

    ai_output = detect_inconsistencies(patient_dict, reports_data)
    conflicts = ai_output.get("conflicts", [])

    # Optional: Clear existing or append new inconsistencies
    # For demo simplicity, clear older inconsistencies to prevent duplicates on multiple runs
    db.query(Inconsistency).filter(Inconsistency.patient_id == payload.patient_id).delete()

    created_rows = []
    for c in conflicts:
        inc_row = Inconsistency(
            patient_id=patient.id,
            type=c.get("type", "other"),
            description=c.get("description", "Potential discrepancy detected"),
            severity=c.get("severity", "medium"),
            fact_a=c.get("fact_a", "Intake Profile"),
            fact_b=c.get("fact_b", "Medical Record"),
            source_a=c.get("source_a", "Patient Intake"),
            source_b=c.get("source_b", "Medical Report")
        )
        db.add(inc_row)
        created_rows.append(inc_row)

    db.commit()

    for cr in created_rows:
        db.refresh(cr)

    return [
        InconsistencyRead(
            id=item.id,
            patient_id=item.patient_id,
            type=item.type,
            description=item.description,
            severity=item.severity,
            fact_a=item.fact_a,
            fact_b=item.fact_b,
            source_a=item.source_a,
            source_b=item.source_b,
            created_at=item.created_at
        )
        for item in created_rows
    ]
