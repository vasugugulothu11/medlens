from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Patient, MedicalReport, LabResult
from app.schemas import (
    MedicalReportCreate, MedicalReportRead, ProcessReportRequest,
    ExtractReportRequest, ExtractReportResponse,
    ComputeStatusRequest, ComputeStatusResponse, ComputedLabItem,
    LabResultRead, LabResultUpdate
)
from app.services.llm import extract_lab_results
from app.services.range_engine import compute_status

router = APIRouter(prefix="/api/reports", tags=["Medical Reports & Lab Extraction"])

@router.get("/patient/{patient_id}", response_model=List[MedicalReportRead])
def list_reports_for_patient(patient_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all medical reports for a patient, ordered by creation date, with nested lab results.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    reports = (
        db.query(MedicalReport)
        .options(joinedload(MedicalReport.lab_results))
        .filter(MedicalReport.patient_id == patient_id)
        .order_by(MedicalReport.created_at.desc())
        .all()
    )
    
    # Map to schema
    output = []
    for r in reports:
        output.append(MedicalReportRead(
            id=r.id,
            patient_id=r.patient_id,
            report_date=r.report_date,
            raw_text=r.raw_text,
            created_at=r.created_at,
            results=[LabResultRead.from_orm(lr) for lr in r.lab_results]
        ))
    return output

@router.post("/patient/{patient_id}/upload", response_model=MedicalReportRead, status_code=status.HTTP_201_CREATED)
def upload_report_raw(patient_id: int, payload: MedicalReportCreate, db: Session = Depends(get_db)):
    """
    Stores raw medical report text without immediate parsing.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    report = MedicalReport(
        patient_id=patient_id,
        report_date=payload.report_date or datetime.utcnow().strftime("%Y-%m-%d"),
        raw_text=payload.raw_text
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return MedicalReportRead(
        id=report.id,
        patient_id=report.patient_id,
        report_date=report.report_date,
        raw_text=report.raw_text,
        created_at=report.created_at,
        results=[]
    )

@router.post("/extract", response_model=ExtractReportResponse)
def extract_labs_stateless(payload: ExtractReportRequest):
    """
    Calls AI extraction service on raw text without writing to database.
    Allows frontend preview/dry-run before persisting.
    """
    extracted = extract_lab_results(payload.reportText)
    return ExtractReportResponse(
        results=extracted.get("results", []),
        processingNotes=extracted.get("processingNotes")
    )

@router.post("/compute-status", response_model=ComputeStatusResponse)
def compute_status_stateless(payload: ComputeStatusRequest):
    """
    Runs deterministic range engine on test items using ONLY printed reference ranges.
    Returns items with low/normal/high/range_unavailable status.
    """
    enriched = []
    for item in payload.results:
        stat = compute_status(item.value, item.reference_range)
        enriched.append(ComputedLabItem(
            test_name=item.test_name,
            value=item.value,
            units=item.units,
            reference_range=item.reference_range,
            date=item.date,
            remarks=item.remarks,
            source_snippet=item.source_snippet,
            confidence=item.confidence,
            status=stat
        ))
    return ComputeStatusResponse(results=enriched)

@router.post("/patient/{patient_id}/process", response_model=MedicalReportRead, status_code=status.HTTP_201_CREATED)
def process_and_save_report(patient_id: int, payload: ProcessReportRequest, db: Session = Depends(get_db)):
    """
    High-level clinical pipeline:
    1. Saves immutable raw medical report.
    2. Calls Gemini AI for structured lab extraction.
    3. Runs deterministic status computation using ONLY printed reference ranges.
    4. Persists LabResults linked to the report.
    5. Returns fully populated report with results.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 1. Create Report
    report = MedicalReport(
        patient_id=patient_id,
        report_date=payload.report_date or datetime.utcnow().strftime("%Y-%m-%d"),
        raw_text=payload.raw_text
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # 2. Extract with AI
    extraction = extract_lab_results(payload.raw_text)
    raw_results = extraction.get("results", [])

    # 3. Deterministically compute status and persist
    db_results = []
    for res in raw_results:
        val = str(res.get("value", ""))
        ref = res.get("reference_range")
        stat = compute_status(val, ref)

        lab_row = LabResult(
            report_id=report.id,
            test_name=str(res.get("test_name", "Unknown Test")),
            value=val,
            units=res.get("units"),
            reference_range=ref,
            date=res.get("date"),
            remarks=res.get("remarks"),
            status=stat,
            source_snippet=str(res.get("source_snippet", payload.raw_text[:80])),
            confidence=str(res.get("confidence", "medium")),
            verification_status="unverified"
        )
        db.add(lab_row)
        db_results.append(lab_row)

    db.commit()

    # Reload report with lab results
    for lr in db_results:
        db.refresh(lr)

    return MedicalReportRead(
        id=report.id,
        patient_id=report.patient_id,
        report_date=report.report_date,
        raw_text=report.raw_text,
        created_at=report.created_at,
        results=[LabResultRead.from_orm(lr) for lr in db_results]
    )

@router.patch("/results/{result_id}", response_model=LabResultRead)
def update_lab_result(result_id: int, payload: LabResultUpdate, db: Session = Depends(get_db)):
    """
    Allows user/clinician verification, manual correction of values, or updating status.
    Provides complete traceability for reviewable clinical records.
    """
    result = db.query(LabResult).filter(LabResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Lab result not found")

    if payload.value is not None:
        result.value = payload.value
    if payload.reference_range is not None:
        result.reference_range = payload.reference_range
        # Recompute status with new reference range
        result.status = compute_status(result.value, result.reference_range)
    if payload.verification_status is not None:
        result.verification_status = payload.verification_status

    db.commit()
    db.refresh(result)
    return LabResultRead.from_orm(result)
