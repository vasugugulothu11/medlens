from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Patient(Base):
    """
    Patient profile model.
    Stores demographic data, user-reported symptoms, existing conditions, allergies, and medications.
    
    Security & Production Note:
    - In production, add encryption-at-rest for PII/PHI (e.g. AWS KMS / Google Tink / SQLAlchemy-Utils).
    - Add user_id / organization_id for multi-tenant isolation and strict RBAC.
    """
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True, default="Anonymous Patient")
    age = Column(Integer, nullable=False)
    sex = Column(String(50), nullable=False)  # "male", "female", "other"
    symptoms = Column(Text, nullable=True)
    conditions = Column(Text, nullable=True)   # Stored as JSON string
    allergies = Column(Text, nullable=True)    # Stored as JSON string
    medications = Column(Text, nullable=True)  # Stored as JSON string
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships with cascade deletion
    reports = relationship("MedicalReport", back_populates="patient", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="patient", cascade="all, delete-orphan")
    inconsistencies = relationship("Inconsistency", back_populates="patient", cascade="all, delete-orphan")


class MedicalReport(Base):
    """
    Raw clinical document uploaded or pasted into MedLens.
    Retains immutable raw_text for complete provenance and auditability.
    """
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    report_date = Column(String(100), nullable=True)
    raw_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="reports")
    lab_results = relationship("LabResult", back_populates="report", cascade="all, delete-orphan")


class LabResult(Base):
    """
    Structured lab result extracted by AI and computed via deterministic range logic.
    Provides clear traceability to source snippet, confidence level, and clinician verification.
    """
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("medical_reports.id", ondelete="CASCADE"), nullable=False)
    test_name = Column(String(255), nullable=False)
    value = Column(String(100), nullable=False)
    units = Column(String(100), nullable=True)
    reference_range = Column(String(255), nullable=True)
    date = Column(String(100), nullable=True)
    remarks = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="range_unavailable")  # "low", "normal", "high", "range_unavailable"
    source_snippet = Column(Text, nullable=False)
    confidence = Column(String(50), nullable=False, default="medium")  # "high", "medium", "low"
    verification_status = Column(String(50), nullable=False, default="unverified")  # "unverified", "user_verified", "flagged"
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    report = relationship("MedicalReport", back_populates="lab_results")


class Summary(Base):
    """
    Patient-friendly explanation and neutral questions for the clinician.
    Non-diagnostic, cautiously worded, and designed for shared doctor-patient decision making.
    """
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    summary_text = Column(Text, nullable=False)
    questions_json = Column(Text, nullable=False)  # JSON array of question strings
    language = Column(String(50), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="summaries")


class Inconsistency(Base):
    """
    Cross-checks patient intake (allergies, medications, conditions) against lab reports.
    Identifies potential conflicts (e.g. prescribed medication vs declared allergy, conflicting lab trends).
    """
    __tablename__ = "inconsistencies"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(100), nullable=False)  # "allergy_medication", "diagnosis_conflict", "lab_value_conflict", "other"
    description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False, default="medium")  # "high", "medium", "low"
    fact_a = Column(Text, nullable=False)
    fact_b = Column(Text, nullable=False)
    source_a = Column(Text, nullable=False)
    source_b = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="inconsistencies")
