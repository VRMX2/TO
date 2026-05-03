import random
from typing import Dict, List

# Known attack patterns with signatures
ATTACK_PATTERNS = {
    "DDoS": ["high_traffic", "flood", "bandwidth_saturation"],
    "SQLi": ["sql_keywords", "injection_pattern", "db_error"],
    "Zero-Day": ["unknown_signature", "anomaly_detected", "system_exploit"],
    "Phishing": ["social_engineering", "credential_harvest", "email_spoof"]
}

def detect_threat(event: Dict) -> Dict:
    """
    Detects the type of threat based on event signals.
    Returns detection report and threat level.
    """
    attack_type = event.get("attack_type", "DDoS")
    severity = event.get("severity", "medium")
    
    severity_levels = {"low": 20, "medium": 45, "high": 70, "critical": 95}
    base_level = severity_levels.get(severity, 50)
    
    # Add some randomness for realism
    threat_level = min(100, base_level + random.randint(-5, 10))
    
    patterns = ATTACK_PATTERNS.get(attack_type, ATTACK_PATTERNS["DDoS"])
    detected_signatures = random.sample(patterns, k=min(2, len(patterns)))
    
    return {
        "attack_type": attack_type,
        "threat_level": threat_level,
        "detected_signatures": detected_signatures,
        "recommended_defense": _recommend_defense(attack_type)
    }

def _recommend_defense(attack_type: str) -> str:
    defense_map = {
        "DDoS": "Firewall",
        "SQLi": "Intrusion Det.",
        "Zero-Day": "Patch System",
        "Phishing": "Honey Pot"
    }
    return defense_map.get(attack_type, "Firewall")
