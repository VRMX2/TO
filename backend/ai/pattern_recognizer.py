import random
from typing import Dict, List
from datetime import datetime

# Attack signature patterns
SIGNATURES = {
    "DDoS": {
        "indicators": ["high_packet_rate", "bandwidth_saturation", "syn_flood", "icmp_flood"],
        "severity_range": (60, 95),
    },
    "SQLi": {
        "indicators": ["sql_keywords_in_request", "error_messages", "union_select", "db_query_anomaly"],
        "severity_range": (40, 80),
    },
    "Brute Force": {
        "indicators": ["repeated_auth_failures", "sequential_passwords", "rapid_login_attempts"],
        "severity_range": (30, 70),
    },
    "Zero-Day": {
        "indicators": ["unknown_payload", "exploit_signature", "privilege_escalation", "memory_corruption"],
        "severity_range": (80, 100),
    },
    "Phishing": {
        "indicators": ["suspicious_url", "email_spoofing", "credential_harvesting"],
        "severity_range": (20, 60),
    },
    "MitM": {
        "indicators": ["arp_spoofing", "ssl_stripping", "traffic_interception"],
        "severity_range": (50, 85),
    },
}


def classify_threat(raw_indicators: List[str]) -> Dict:
    """
    Classifies a threat based on observed indicators.
    Returns the most likely attack type and confidence score.
    """
    scores = {}
    for attack_type, sig in SIGNATURES.items():
        matching = sum(1 for ind in raw_indicators if ind in sig["indicators"])
        scores[attack_type] = matching / len(sig["indicators"])

    if not scores or max(scores.values()) == 0:
        # Default to random for demo
        attack_type = random.choice(list(SIGNATURES.keys()))
        confidence = round(random.uniform(0.4, 0.7), 2)
    else:
        attack_type = max(scores, key=scores.get)
        confidence = round(min(scores[attack_type] * 1.2, 1.0), 2)

    severity_range = SIGNATURES[attack_type]["severity_range"]
    severity = random.randint(*severity_range)

    return {
        "attack_type": attack_type,
        "confidence": confidence,
        "severity": severity,
        "indicators_matched": [i for i in raw_indicators if i in SIGNATURES[attack_type]["indicators"]],
        "timestamp": datetime.utcnow().isoformat(),
    }


def analyze_attack_history(logs: List[Dict]) -> Dict:
    """
    Analyzes attack logs and returns a frequency distribution and trend.
    """
    frequency = {}
    for log in logs:
        atype = log.get("attack_type", "Unknown")
        frequency[atype] = frequency.get(atype, 0) + 1

    total = sum(frequency.values()) or 1
    distribution = {k: round(v / total, 2) for k, v in frequency.items()}

    most_common = max(frequency, key=frequency.get) if frequency else "Unknown"
    trend = "increasing" if len(logs) > 5 else "stable"

    return {
        "total_attacks": len(logs),
        "frequency": frequency,
        "distribution": distribution,
        "most_common_attack": most_common,
        "trend": trend,
    }
