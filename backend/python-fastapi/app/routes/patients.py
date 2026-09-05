import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Patient
from app.schemas import PatientCreate, PatientUpdate, PatientRead

router = APIRouter(prefix="/api/patients", tags=["Patients"])

def _to_json_str(data) -> str:
    if isinstance(data, list):
        return json.dumps(data)
    if isinstance(data, str):
        try:
            # Check if already json
            parsed = json.loads(data)
            return json.dumps(parsed if isinstance(parsed, list) else [data])
        except Exception:
            return json.dumps([data] if data else [])
    return json.dumps([])

def _from_json_str(data_str: str) -> List[str]:
    if not data_str:
        return []
    try:
        parsed = json.loads(data_str)
        if isinstance(parsed, list):
            return parsed
        return [str(parsed)]
    except Exception:
        # Fallback to comma separated
        return [s.strip() for s in data_str.split(",") if s.strip()]

def _serialize_patient(patient: Patient) -> PatientRead:
    return PatientRead(
        id=patient.id,
        name=patient.name or "Anonymous Patient",
        age=patient.age,
        sex=patient.sex,
        symptoms=patient.symptoms,
        conditions=_from_json_str(patient.conditions),
        allergies=_from_json_str(patient.allergies),
        medications=_from_json_str(patient.medications),
        notes=patient.notes,
        created_at=patient.created_at
    )

@router.get("", response_model=List[PatientRead])
def list_patients(db: Session = Depends(get_db)):
    """
    List all registered patients.
    Supports multi-patient clinical management.
    """
    patients = db.query(Patient).order_by(Patient.created_at.desc()).all()
    return [_serialize_patient(p) for p in patients]

@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(patient_in: PatientCreate, db: Session = Depends(get_db)):
    """
    Register a new patient profile with demographics, symptoms, conditions, allergies, and medications.
    """
    db_patient = Patient(
        name=patient_in.name or "Anonymous Patient",
        age=patient_in.age,
        sex=patient_in.sex,
        symptoms=patient_in.symptoms,
        conditions=_to_json_str(patient_in.conditions),
        allergies=_to_json_str(patient_in.allergies),
        medications=_to_json_str(patient_in.medications),
        notes=patient_in.notes
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return _serialize_patient(db_patient)

@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """
    Retrieve single patient profile by ID.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")
    return _serialize_patient(patient)

@router.put("/{patient_id}", response_model=PatientRead)
def update_patient(patient_id: int, update_in: PatientUpdate, db: Session = Depends(get_db)):
    """
    Update an existing patient's clinical profile.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")

    patient.name = update_in.name or patient.name
    patient.age = update_in.age
    patient.sex = update_in.sex
    patient.symptoms = update_in.symptoms
    patient.conditions = _to_json_str(update_in.conditions)
    patient.allergies = _to_json_str(update_in.allergies)
    patient.medications = _to_json_str(update_in.medications)
    patient.notes = update_in.notes

    db.commit()
    db.refresh(patient)
    return _serialize_patient(patient)

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """
    Delete a patient record. Cascades to associated reports, results, summaries, and inconsistency records.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")
    
    db.delete(patient)
    db.commit()
    return None
