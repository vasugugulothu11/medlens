import re
from typing import Optional, Tuple, Union

def extract_numeric_value(val_str: Union[str, float, int]) -> Optional[float]:
    """
    Extracts the first valid floating-point number from a test value string.
    Example: '14.2 g/dL' -> 14.2, '<0.05' -> 0.05, '120' -> 120.0
    """
    if val_str is None:
        return None
    if isinstance(val_str, (int, float)):
        return float(val_str)
    
    clean_str = str(val_str).strip()
    match = re.search(r'[-+]?\d*\.?\d+', clean_str)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return None
    return None

def parse_range(range_str: Optional[str]) -> Tuple[Optional[float], Optional[float]]:
    """
    Deterministically parses reference range text as printed on the clinical lab document.
    Returns (min_val, max_val).
    
    Supported formats:
    - '13.5 - 17.5' or '13.5-17.5' or '13.5 to 17.5' -> (13.5, 17.5)
    - '< 200' or '<= 200' or 'Up to 200' or 'Less than 200' -> (None, 200.0)
    - '> 60' or '>= 60' or 'Greater than 60' -> (60.0, None)
    - '0 - 15' -> (0.0, 15.0)
    
    Never falls back to external databases or LLM guessing; purely bounded by printed document bounds.
    """
    if not range_str or not isinstance(range_str, str):
        return None, None

    cleaned = range_str.strip().lower()
    if not cleaned or cleaned in ["n/a", "none", "not established", "see note", "normal"]:
        return None, None

    # Pattern 1: Less than / Upper bound only
    # e.g., "< 200", "<= 100", "less than 5.7", "up to 150", "<130"
    lt_match = re.search(r'(?:<|<=|less\s+than|up\s+to)\s*([0-9]+(?:\.[0-9]+)?)', cleaned)
    if lt_match and not re.search(r'-|\bto\b', cleaned):
        try:
            return None, float(lt_match.group(1))
        except ValueError:
            pass

    # Pattern 2: Greater than / Lower bound only
    # e.g., "> 60", ">= 90", "greater than 50", ">60"
    gt_match = re.search(r'(?:>|>=|greater\s+than)\s*([0-9]+(?:\.[0-9]+)?)', cleaned)
    if gt_match and not re.search(r'-|\bto\b', cleaned):
        try:
            return float(gt_match.group(1)), None
        except ValueError:
            pass

    # Pattern 3: Two numbers separated by hyphen, dash, or 'to'
    # e.g., '13.5 - 17.5', '70 - 99', '4.0-5.2', '12 to 18'
    range_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:[-–—]|\bto\b)\s*([0-9]+(?:\.[0-9]+)?)', cleaned)
    if range_match:
        try:
            low = float(range_match.group(1))
            high = float(range_match.group(2))
            return low, high
        except ValueError:
            return None, None

    return None, None

def compute_status(value: Union[str, float, int], reference_range: Optional[str]) -> str:
    """
    Computes Low / Normal / High clinical status using ONLY the printed reference range.
    No LLM guessing. Completely deterministic and auditable.
    
    Returns:
    - 'low'
    - 'normal'
    - 'high'
    - 'range_unavailable'
    """
    num_val = extract_numeric_value(value)
    if num_val is None:
        return "range_unavailable"

    low_bound, high_bound = parse_range(reference_range)

    # If neither bound is parseable, range is unavailable
    if low_bound is None and high_bound is None:
        return "range_unavailable"

    # Single upper bound (e.g. < 200)
    if low_bound is None and high_bound is not None:
        if num_val > high_bound:
            return "high"
        return "normal"

    # Single lower bound (e.g. > 60)
    if low_bound is not None and high_bound is None:
        if num_val < low_bound:
            return "low"
        return "normal"

    # Interval bound (e.g. 70 - 99)
    if low_bound is not None and high_bound is not None:
        if num_val < low_bound:
            return "low"
        elif num_val > high_bound:
            return "high"
        else:
            return "normal"

    return "range_unavailable"
