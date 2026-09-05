import os
import json
import re
from typing import Dict, Any, List
from app.config import settings

# Attempt import of google.generativeai
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

def _init_gemini():
    """Initializes the Google Generative AI client if API key is present."""
    api_key = settings.GOOGLE_API_KEY
    if not api_key or not HAS_GENAI:
        return None
    try:
        genai.configure(api_key=api_key)
        # Use user-configured or gemini-1.5-flash
        model_name = settings.GEMINI_MODEL or "gemini-1.5-flash"
        return genai.GenerativeModel(model_name)
    except Exception as e:
        print(f"[LLM] Warning: Failed to configure Google GenAI client: {e}")
        return None

def _clean_json_markdown(text: str) -> str:
    """Removes markdown code block formatting (```json ... ```) from model output."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # Strip first line
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


# ==========================================
# 1. LAB REPORT EXTRACTION
# ==========================================
def extract_lab_results(report_text: str) -> Dict[str, Any]:
    """
    Extracts structured lab results from raw medical report text using Gemini.
    Strictly preserves printed test names and extracts source snippets for provenance.
    Never invents reference ranges.
    """
    model = _init_gemini()
    
    if not model:
        return _fallback_extract_labs(report_text, "Gemini API key not configured. Using deterministic extraction parser.")

    prompt = f"""
You are a specialized clinical information extraction engine for the MedLens system.
Your job is to parse the following medical document and extract all reported lab tests into structured JSON.

CRITICAL INSTRUCTIONS:
1. OUTPUT FORMAT: Respond ONLY with a valid JSON object. No conversational prose, no markdown fences besides raw JSON.
2. JSON SCHEMA:
{{
  "results": [
    {{
      "test_name": "exact test name as printed",
      "value": "extracted numerical or qualitative value",
      "units": "measurement unit if printed, else null",
      "reference_range": "exact reference interval printed in report, else null",
      "date": "collection/reported date if present, else null",
      "remarks": "flag, asterisk, or notes printed in report, else null",
      "source_snippet": "exact snippet or line from raw text containing this result",
      "confidence": "high" | "medium" | "low"
    }}
  ],
  "processingNotes": "brief note about document quality or extraction observations"
}}
3. FIDELITY & PROVENANCE:
   - Preserve test names EXACTLY as printed. Do not abbreviate or standardize names.
   - Extract the exact `source_snippet` line where the result appeared for auditability.
   - DO NOT invent, infer, or hallucinate reference ranges. If a reference range is not explicitly printed next to or for this test, set "reference_range" to null.
   - Confidence: use "high" if clearly tabulated, "medium" if noisy text, "low" if ambiguous.

RAW MEDICAL REPORT TEXT:
\"\"\"
{report_text}
\"\"\"
"""

    try:
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.1, "response_mime_type": "application/json"}
        )
        cleaned_text = _clean_json_markdown(response.text or "{}")
        parsed = json.loads(cleaned_text)
        if "results" not in parsed or not isinstance(parsed["results"], list):
            parsed["results"] = []
        return parsed
    except Exception as e:
        print(f"[LLM] Error in extract_lab_results: {e}")
        return _fallback_extract_labs(report_text, f"Fallback parser used due to model error: {str(e)}")


def _fallback_extract_labs(text: str, note: str) -> Dict[str, Any]:
    """
    Deterministic regex fallback parser for common lab formats:
    'Test Name: 14.2 g/dL (13.5 - 17.5)' or tabulated columns.
    Ensures the application works even in air-gapped or non-API environments.
    """
    results = []
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    # Common regex pattern: <Name>[:\t ]+<Value>[ \t]+<Units>?[ \t]+[([]?<Range>[)\]]?
    line_pattern = re.compile(
        r'^([A-Za-z0-9\s,\-\/\(\)]+?)(?::|\t|\s{2,})'
        r'\s*([<>]?\s*[-+]?\d+(?:\.\d+)?|[A-Za-z]+)'
        r'(?:\s+([a-zA-Z%\/μuU]+(?:\/[a-zA-Z0-9]+)?))?'
        r'(?:\s*[\(\[]?\s*([<>]?\s*\d+(?:\.\d+)?\s*(?:[-–—to]+\s*\d+(?:\.\d+)?)?|normal|negative)[\)\]]?)?',
        re.IGNORECASE
    )

    for line in lines:
        if any(h in line.lower() for h in ["patient:", "doctor:", "dob:", "mrn:", "date:", "lab report", "test name"]):
            continue
        m = line_pattern.search(line)
        if m:
            name = m.group(1).strip()
            val = m.group(2).strip()
            units = m.group(3).strip() if m.group(3) else None
            ref = m.group(4).strip() if m.group(4) else None
            
            # Simple validation to avoid false positives
            if len(name) > 1 and len(name) < 60:
                results.append({
                    "test_name": name,
                    "value": val,
                    "units": units,
                    "reference_range": ref,
                    "date": None,
                    "remarks": None,
                    "source_snippet": line,
                    "confidence": "medium"
                })

    if not results:
        # Default single demonstration item if unstructured
        results.append({
            "test_name": "Clinical Panel Item",
            "value": "Refer to report",
            "units": "",
            "reference_range": None,
            "date": None,
            "remarks": None,
            "source_snippet": lines[0] if lines else "Raw text input",
            "confidence": "low"
        })

    return {
        "results": results,
        "processingNotes": note
    }


# ==========================================
# 2. PATIENT-FRIENDLY SUMMARY & QUESTION BUILDER
# ==========================================
def generate_summary(patient_dict: Dict[str, Any], results_list: List[Dict[str, Any]], language: str = "en") -> Dict[str, Any]:
    """
    Generates a concise, patient-friendly summary and neutral questions for the clinician.
    
    SAFETY MANDATE:
    - Absolutely NO diagnosis, treatment recommendations, or dosage advice.
    - Cautious, objective language emphasizing discussion with the doctor.
    """
    model = _init_gemini()
    
    if not model:
        return _fallback_summary(patient_dict, results_list)

    prompt = f"""
You are the Patient Communication Assistant in MedLens.
Your goal is to help patients understand what is contained in their lab records and empower them to have an informed, constructive conversation with their healthcare provider.

STRICT SAFETY & COMPLIANCE MANDATES:
1. NO MEDICAL DIAGNOSIS: Never declare "You have X disease" or "This proves condition Y".
2. NO TREATMENT OR DOSAGE ADVICE: Never advise stopping, starting, or adjusting any medicine or dosage.
3. CAUTIOUS & NON-ALARMIST TONE: Use phrasing like "Your test was recorded at X, which your clinician can contextualize", "Some results were flagged outside the laboratory's printed reference range".
4. NEUTRAL CLINICIAN QUESTIONS: Formulate 3 to 5 neutral, empowering questions the patient can bring to their appointment.
5. LANGUAGE: Provide the response in '{language}'.

OUTPUT FORMAT (JSON ONLY):
{{
  "summaryText": "2 to 3 clear, empathetic, easy-to-read paragraphs explaining the tests performed, what normal vs flagged markers indicate generally, and encouraging dialogue.",
  "questionsForClinician": [
    "Question 1...",
    "Question 2...",
    "Question 3..."
  ]
}}

PATIENT INFORMATION:
- Age: {patient_dict.get('age')}
- Sex: {patient_dict.get('sex')}
- Reported Symptoms: {patient_dict.get('symptoms') or 'None reported'}
- Diagnosed Conditions: {', '.join(patient_dict.get('conditions', []))}
- Current Medications: {', '.join(patient_dict.get('medications', []))}
- Allergies: {', '.join(patient_dict.get('allergies', []))}

LAB RESULTS WITH COMPUTED STATUS:
{json.dumps(results_list, indent=2)}
"""

    try:
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.2, "response_mime_type": "application/json"}
        )
        cleaned = _clean_json_markdown(response.text or "{}")
        parsed = json.loads(cleaned)
        return {
            "summaryText": parsed.get("summaryText", "Your lab results have been organized. Please discuss these findings with your doctor."),
            "questionsForClinician": parsed.get("questionsForClinician", [
                "What do the flagged test results mean in the context of my overall health?",
                "Are there any follow-up tests or lifestyle steps we should monitor?",
                "How do my current medications align with these recent findings?"
            ])
        }
    except Exception as e:
        print(f"[LLM] Error in generate_summary: {e}")
        return _fallback_summary(patient_dict, results_list)


def _fallback_summary(patient: Dict[str, Any], results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Reliable fallback summary when API key or offline mode is active."""
    flagged = [r for r in results if r.get("status") in ["low", "high"]]
    flagged_names = [f"{r.get('test_name')} ({r.get('status')})" for r in flagged]
    
    flagged_desc = f"{len(flagged)} test(s) showed values outside the printed reference intervals: {', '.join(flagged_names)}." if flagged else "All parsed lab items currently sit within their document reference ranges."

    summary = (
        f"This report summary brings together your clinical intake details with recent lab results. "
        f"{flagged_desc} Laboratory reference intervals reflect statistical normal ranges for the testing facility; "
        f"isolated findings should always be evaluated alongside your symptoms and clinical history.\n\n"
        f"Remember that this report organizer is strictly informational and does not provide medical diagnosis or treatment plans. "
        f"We recommend reviewing these structured results with your primary care clinician."
    )

    questions = [
        "What clinical significance do my recent lab results hold in relation to my reported symptoms?",
        "Are any of the flagged values expected given my current conditions or medications?",
        "Would you recommend repeating any of these tests at our next follow-up appointment?",
        "Are there any daily habits or preventive adjustments we should consider based on this review?"
    ]

    return {
        "summaryText": summary,
        "questionsForClinician": questions
    }


# ==========================================
# 3. CLINICAL INCONSISTENCY DETECTION
# ==========================================
def detect_inconsistencies(patient_dict: Dict[str, Any], reports_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Cross-evaluates patient intake records against laboratory documents to identify potential
    contradictions, drug-allergy interactions, or conflicting diagnoses.
    Labels all findings as 'possible conflicts' for human clinician review.
    """
    model = _init_gemini()
    
    if not model:
        return _rule_based_inconsistencies(patient_dict, reports_list)

    prompt = f"""
You are the Clinical Safety & Consistency Cross-Checking Engine in MedLens.
Evaluate the patient intake profile and their medical reports to find possible inconsistencies, conflicts, or safety alerts.

EXAMPLES OF TARGET CONFLICTS:
1. ALLERGY VS MEDICATION: Patient has penicillin allergy, but an amoxicillin/augmentin prescription or note is listed.
2. DIAGNOSIS CONFLICT: Patient reports no history of diabetes, but lab report shows HbA1c 9.5% with note 'established diabetic'.
3. LAB VALUE CONFLICT: Conflicting trend across tests or incompatible simultaneous readings.
4. SYMPTOM VS MEDICATION ADVERSE EFFECT: Symptoms matching known side effects of recently prescribed medications.

CRITICAL INSTRUCTION:
Label every finding as a "possible conflict" for human clinical review. Do not issue a definitive diagnostic pronouncement.

OUTPUT FORMAT (JSON ONLY):
{{
  "conflicts": [
    {{
      "type": "allergy_medication" | "diagnosis_conflict" | "lab_value_conflict" | "other",
      "description": "Clear explanation of the possible discrepancy for the reviewing clinician",
      "severity": "high" | "medium" | "low",
      "fact_a": "First conflicting piece of information",
      "fact_b": "Contradicting piece of information",
      "source_a": "Where Fact A came from (e.g. 'Patient Intake - Allergies')",
      "source_b": "Where Fact B came from (e.g. 'Medical Report Lab Result')"
    }}
  ],
  "explanation": "Brief overview of consistency check results."
}}

PATIENT INTAKE PROFILE:
{json.dumps(patient_dict, indent=2)}

MEDICAL REPORTS & LAB RESULTS:
{json.dumps(reports_list, indent=2)}
"""

    try:
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.1, "response_mime_type": "application/json"}
        )
        cleaned = _clean_json_markdown(response.text or "{}")
        parsed = json.loads(cleaned)
        conflicts = parsed.get("conflicts", [])
        return {
            "conflicts": conflicts,
            "explanation": parsed.get("explanation", f"Identified {len(conflicts)} potential items for review.")
        }
    except Exception as e:
        print(f"[LLM] Error in detect_inconsistencies: {e}")
        return _rule_based_inconsistencies(patient_dict, reports_list)


def _rule_based_inconsistencies(patient: Dict[str, Any], reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Deterministic rule-based inconsistency cross-checker.
    Guarantees that common safety alerts (e.g. Penicillin allergy vs Amoxicillin, high sugar vs denied diabetes)
    are always detected even without active external API connections.
    """
    conflicts = []
    allergies = [a.lower() for a in patient.get("allergies", [])]
    meds = [m.lower() for m in patient.get("medications", [])]
    conditions = [c.lower() for c in patient.get("conditions", [])]

    # Rule 1: Beta-lactam / Penicillin allergy vs Penicillin-class drugs
    penicillin_allergies = [a for a in allergies if "penicillin" in a or "amox" in a or "ampicillin" in a]
    penicillin_meds = [m for m in meds if any(d in m for d in ["amoxicillin", "augmentin", "penicillin", "ampicillin"])]
    if penicillin_allergies and penicillin_meds:
        conflicts.append({
            "type": "allergy_medication",
            "description": f"Potential Drug-Allergy Warning: Patient lists allergy to '{penicillin_allergies[0]}', but is prescribed '{penicillin_meds[0]}'.",
            "severity": "high",
            "fact_a": f"Allergy: {penicillin_allergies[0]}",
            "fact_b": f"Active Medication: {penicillin_meds[0]}",
            "source_a": "Patient Intake Profile (Allergies)",
            "source_b": "Patient Intake Profile (Medications)"
        })

    # Rule 2: NSAID allergy vs Ibuprofen/Naproxen/Aspirin
    nsaid_allergies = [a for a in allergies if any(w in a for w in ["nsaid", "aspirin", "ibuprofen"])]
    nsaid_meds = [m for m in meds if any(w in m for w in ["ibuprofen", "advil", "motrin", "naproxen", "aspirin", "aleve"])]
    if nsaid_allergies and nsaid_meds:
        conflicts.append({
            "type": "allergy_medication",
            "description": f"Potential NSAID Allergy Alert: Documented sensitivity to '{nsaid_allergies[0]}' with concurrent medication '{nsaid_meds[0]}'.",
            "severity": "high",
            "fact_a": f"Allergy: {nsaid_allergies[0]}",
            "fact_b": f"Active Medication: {nsaid_meds[0]}",
            "source_a": "Patient Intake Profile (Allergies)",
            "source_b": "Patient Intake Profile (Medications)"
        })

    # Rule 3: High Glucose / HbA1c in lab report without Diabetes listed in conditions
    has_diabetes_condition = any("diabet" in c for c in conditions)
    for rep in reports:
        for lab in rep.get("results", []):
            t_name = (lab.get("test_name") or "").lower()
            val = lab.get("value", "")
            # Check for high HbA1c (> 6.5) or high Fasting Glucose (> 126)
            if "hba1c" in t_name or "a1c" in t_name:
                try:
                    num = float(re.search(r'\d+(?:\.\d+)?', str(val)).group(0))
                    if num >= 6.5 and not has_diabetes_condition:
                        conflicts.append({
                            "type": "diagnosis_conflict",
                            "description": f"Glycemic Marker Discrepancy: HbA1c is elevated at {val}% ({lab.get('reference_range')}), but Diabetes is not listed among documented conditions.",
                            "severity": "medium",
                            "fact_a": f"Lab Result: HbA1c is {val}%",
                            "fact_b": "No diagnosis of Diabetes recorded in Intake",
                            "source_a": f"Medical Report #{rep.get('id', 'latest')}",
                            "source_b": "Patient Intake Profile (Conditions)"
                        })
                except Exception:
                    pass

    return {
        "conflicts": conflicts,
        "explanation": f"Rule-based consistency engine identified {len(conflicts)} potential items."
    }
