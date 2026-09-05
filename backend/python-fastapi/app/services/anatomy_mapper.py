from typing import List, Dict, Any

# Standard 3D Anatomical Structure Identifiers matching meshes
# heart, lungs, liver, kidneys, pancreas, brain, stomach, thyroid, peripheral_nerves, circulatory_veins, spine

def map_patient_to_anatomy(
    conditions: List[str],
    symptoms: str,
    lab_results: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Deterministically maps patient clinical facts (diagnosed conditions, reported symptoms, abnormal labs)
    to physical 3D anatomical structures with explicit clinical provenance and justification.
    """
    highlights: Dict[str, Dict[str, Any]] = {}

    def add_or_update(
        structure_id: str,
        label: str,
        severity: str,
        reason: str,
        system: str,
        source: str
    ):
        sev_rank = {"high": 3, "medium": 2, "low": 1}
        existing = highlights.get(structure_id)
        if existing:
            # Upgrade severity if new reason is higher
            if sev_rank.get(severity, 1) > sev_rank.get(existing["severity"], 1):
                existing["severity"] = severity
            # Combine reasons if different
            if reason not in existing["reason"]:
                existing["reason"] += f"; {reason}"
        else:
            highlights[structure_id] = {
                "structureId": structure_id.lower(),
                "label": label,
                "severity": severity,
                "reason": reason,
                "system": system,
                "source": source
            }

    # 1. Evaluate Diagnosed Conditions
    for cond in conditions:
        c_lower = cond.lower().strip()
        if any(w in c_lower for w in ["diabetes", "type 2", "type 1", "prediabetes"]):
            add_or_update(
                "pancreas", "Pancreas", "high",
                f"History of {cond}: insulin secretion & endocrine pancreatic regulation require monitoring",
                "Endocrine", "Reported Condition"
            )
            add_or_update(
                "heart", "Heart & Cardiovascular", "medium",
                f"Macrovascular risk correlation associated with {cond}",
                "Cardiovascular", "Reported Condition"
            )
        if any(w in c_lower for w in ["hypertension", "high blood pressure", "htn"]):
            add_or_update(
                "heart", "Heart", "high",
                f"Active condition '{cond}': elevates cardiac workload and systemic vascular resistance",
                "Cardiovascular", "Reported Condition"
            )
            add_or_update(
                "circulatory_veins", "Vascular Network", "medium",
                f"Increased arterial wall shear stress and peripheral resistance from {cond}",
                "Circulatory", "Reported Condition"
            )
            add_or_update(
                "kidneys", "Kidneys", "medium",
                f"Renal microvascular pressure and nephron filtration impact from {cond}",
                "Renal", "Reported Condition"
            )
        if any(w in c_lower for w in ["cholesterol", "dyslipidemia", "hyperlipidemia", "atherosclerosis"]):
            add_or_update(
                "heart", "Heart", "high",
                f"Arterial plaque formation and coronary artery disease risk from {cond}",
                "Cardiovascular", "Reported Condition"
            )
            add_or_update(
                "circulatory_veins", "Vascular System", "medium",
                f"Systemic vascular lipid deposition from {cond}",
                "Circulatory", "Reported Condition"
            )
        if any(w in c_lower for w in ["asthma", "copd", "bronchitis", "pneumonia"]):
            add_or_update(
                "lungs", "Lungs & Bronchial Tree", "high",
                f"Lower airway reactive pathology and gas exchange restriction in {cond}",
                "Respiratory", "Reported Condition"
            )
        if any(w in c_lower for w in ["hepatitis", "cirrhosis", "fatty liver", "mash", "nash"]):
            add_or_update(
                "liver", "Liver", "high",
                f"Hepatic parenchymal inflammation and metabolic clearance strain in {cond}",
                "Digestive", "Reported Condition"
            )
        if any(w in c_lower for w in ["ckd", "kidney disease", "renal failure", "nephropathy"]):
            add_or_update(
                "kidneys", "Kidneys", "high",
                f"Reduced glomerular filtration and renal excretion compromise in {cond}",
                "Renal", "Reported Condition"
            )
        if any(w in c_lower for w in ["hypothyroid", "hyperthyroid", "hashimoto", "goiter"]):
            add_or_update(
                "thyroid", "Thyroid Gland", "medium",
                f"Metabolic endocrine regulation alteration associated with {cond}",
                "Endocrine", "Reported Condition"
            )
        if any(w in c_lower for w in ["neuropathy", "carpal tunnel", "sciatica"]):
            add_or_update(
                "peripheral_nerves", "Peripheral Nerves", "medium",
                f"Nerve conduction deficits or peripheral axon damage in {cond}",
                "Nervous", "Reported Condition"
            )

    # 2. Evaluate Symptoms
    if symptoms:
        s_lower = symptoms.lower()
        if any(w in s_lower for w in ["tingling", "numbness", "pins and needles", "burning sensation in feet"]):
            add_or_update(
                "peripheral_nerves", "Peripheral Nerves", "medium",
                f"Symptom alert '{symptoms}': sensory neural pathway irritation or peripheral neuropathy",
                "Nervous", "Reported Symptom"
            )
        if any(w in s_lower for w in ["chest pain", "palpitations", "shortness of breath", "dyspnea"]):
            add_or_update(
                "heart", "Heart", "high",
                f"Reported symptom '{symptoms}' warrants cardiopulmonary review",
                "Cardiovascular", "Reported Symptom"
            )
            add_or_update(
                "lungs", "Lungs", "medium",
                f"Reported symptom '{symptoms}' involves respiratory tract dynamics",
                "Respiratory", "Reported Symptom"
            )
        if any(w in s_lower for w in ["headache", "dizziness", "confusion", "migraine", "vertigo"]):
            add_or_update(
                "brain", "Brain & Cranial Nerves", "medium",
                f"Neurological symptom presentation: '{symptoms}'",
                "Nervous", "Reported Symptom"
            )
        if any(w in s_lower for w in ["abdominal pain", "nausea", "heartburn", "acid reflux", "stomach pain"]):
            add_or_update(
                "stomach", "Stomach & Upper GI", "medium",
                f"Gastrointestinal symptom reported: '{symptoms}'",
                "Digestive", "Reported Symptom"
            )
        if any(w in s_lower for w in ["back pain", "lumbar", "spinal", "neck stiffness"]):
            add_or_update(
                "spine", "Spine & Vertebral Column", "medium",
                f"Axial musculoskeletal symptom reported: '{symptoms}'",
                "Musculoskeletal", "Reported Symptom"
            )

    # 3. Evaluate Lab Results (Filtered by Low or High status computed from printed ranges)
    for result in lab_results:
        status = (result.get("status") or "").lower()
        test_name = (result.get("test_name") or "").lower()
        val = result.get("value", "")
        ref = result.get("reference_range", "")

        if status not in ["high", "low"]:
            continue

        # Glucose / HbA1c
        if any(t in test_name for t in ["glucose", "fasting sugar", "hba1c", "a1c"]):
            add_or_update(
                "pancreas", "Pancreas", "high" if status == "high" else "medium",
                f"{result.get('test_name')} measured {val} (printed range: {ref} [{status.upper()}]): beta-cell glycemic balance",
                "Endocrine", "Lab Result"
            )
            if status == "high":
                add_or_update(
                    "circulatory_veins", "Microvascular System", "medium",
                    f"Elevated glycemic marker ({val}) correlates with microvascular endothelial stress",
                    "Circulatory", "Lab Result"
                )

        # Creatinine / BUN / eGFR
        elif any(t in test_name for t in ["creatinine", "bun", "blood urea", "egfr"]):
            add_or_update(
                "kidneys", "Kidneys", "high",
                f"{result.get('test_name')} measured {val} (printed range: {ref} [{status.upper()}]): renal filtration marker",
                "Renal", "Lab Result"
            )

        # Lipid panel: LDL, Total Cholesterol, Triglycerides
        elif any(t in test_name for t in ["cholesterol", "ldl", "triglyceride", "hdl"]):
            add_or_update(
                "heart", "Heart", "high" if status == "high" else "medium",
                f"{result.get('test_name')} measured {val} (printed range: {ref} [{status.upper()}]): atherogenic lipid burden",
                "Cardiovascular", "Lab Result"
            )
            add_or_update(
                "circulatory_veins", "Vascular System", "medium",
                f"Lipid anomaly ({result.get('test_name')}: {val}) directly impacts arterial lumen health",
                "Circulatory", "Lab Result"
            )

        # Liver Enzymes: ALT, AST, ALP, Bilirubin
        elif any(t in test_name for t in ["alt", "sgpt", "ast", "sgot", "alp", "bilirubin", "gamma-gt", "ggt"]):
            add_or_update(
                "liver", "Liver", "high",
                f"{result.get('test_name')} measured {val} (printed range: {ref} [{status.upper()}]): hepatocellular injury/clearance marker",
                "Digestive", "Lab Result"
            )

        # Complete Blood Count: Hemoglobin, Hematocrit, RBC, Platelets, WBC
        elif any(t in test_name for t in ["hemoglobin", "hgb", "hematocrit", "rbc"]):
            add_or_update(
                "circulatory_veins", "Circulatory System & Bone Marrow", "medium",
                f"{result.get('test_name')} measured {val} (printed range: {ref} [{status.upper()}]): oxygen-carrying red blood cell index",
                "Circulatory", "Lab Result"
            )
            add_or_update(
                "heart", "Heart", "medium",
                f"Anemia/hematologic imbalance ({val}) triggers compensatory cardiac stroke volume adjustments",
                "Cardiovascular", "Lab Result"
            )

        # Thyroid tests: TSH, Free T4, Free T3
        elif any(t in test_name for t in ["tsh", "thyroid", "free t4", "free t3"]):
            add_or_update(
                "thyroid", "Thyroid Gland", "medium",
                f"{result.get('test_name')} measured {val} (printed range: {ref} [{status.upper()}]): pituitary-thyroid axis regulation",
                "Endocrine", "Lab Result"
            )

        # Electrolytes: Potassium, Sodium, Calcium
        elif any(t in test_name for t in ["potassium", "k+", "sodium", "na+", "calcium"]):
            add_or_update(
                "heart", "Heart & Myocardium", "high",
                f"Electrolyte variation ({result.get('test_name')}: {val} [{status.upper()}]): alters myocardial cardiac conduction stability",
                "Cardiovascular", "Lab Result"
            )
            add_or_update(
                "kidneys", "Kidneys", "medium",
                f"Renal electrolyte reabsorption and fluid volume modulation",
                "Renal", "Lab Result"
            )

    return list(highlights.values())
