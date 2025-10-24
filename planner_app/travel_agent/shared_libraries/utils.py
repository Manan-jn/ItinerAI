import re
import json
from typing import Any, Dict, Optional

def merge_dict_intelligently(existing: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
    """Intelligently merge two dictionaries, handling lists and nested objects"""
    if not existing:
        return new.copy()
    
    merged = existing.copy()
    
    for key, new_value in new.items():
        if new_value is None or new_value == "" or new_value == []:
            continue
            
        if key not in merged:
            merged[key] = new_value
        elif isinstance(new_value, list) and isinstance(merged[key], list):
            existing_list = merged[key]
            combined = existing_list + [item for item in new_value if item not in existing_list]
            merged[key] = combined
        elif isinstance(new_value, dict) and isinstance(merged[key], dict):
            merged[key] = merge_dict_intelligently(merged[key], new_value)
        else:
            merged[key] = new_value
    
    return merged

def string_to_json(response_text: str) -> Optional[dict]:
    """Extract JSON from markdown code blocks."""
    # Try to find JSON in code blocks first
    json_match = re.search(r'``````', response_text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(1))
    
    # Try to find raw JSON
    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(0))
    
    return None