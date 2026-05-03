import random
import numpy as np
from typing import Dict, List

# Defense action library
DEFENSE_ACTIONS = {
    "firewall_block": {
        "name": "Firewall Block",
        "description": "Block all traffic to the compromised node",
        "effectiveness": 0.9,
        "cost": 0.5,
    },
    "rate_limiting": {
        "name": "Rate Limiting",
        "description": "Throttle incoming connections to prevent DDoS",
        "effectiveness": 0.7,
        "cost": 0.2,
    },
    "honeypot_deploy": {
        "name": "Deploy Honeypot",
        "description": "Redirect attacker to decoy environment",
        "effectiveness": 0.65,
        "cost": 0.3,
    },
    "patch_vuln": {
        "name": "Patch Vulnerability",
        "description": "Apply emergency patch to exploited service",
        "effectiveness": 0.85,
        "cost": 0.6,
    },
    "network_isolation": {
        "name": "Network Isolation",
        "description": "Quarantine the compromised subnet",
        "effectiveness": 0.95,
        "cost": 0.8,
    },
    "ids_activation": {
        "name": "Activate IDS",
        "description": "Enable intrusion detection on all endpoints",
        "effectiveness": 0.75,
        "cost": 0.4,
    },
}

ATTACK_TO_DEFENSE_MAP = {
    "DDoS": ["rate_limiting", "firewall_block", "network_isolation"],
    "SQLi": ["patch_vuln", "firewall_block", "ids_activation"],
    "Brute Force": ["rate_limiting", "ids_activation", "firewall_block"],
    "Zero-Day": ["network_isolation", "honeypot_deploy", "patch_vuln"],
    "Phishing": ["ids_activation", "honeypot_deploy", "patch_vuln"],
    "MitM": ["network_isolation", "firewall_block", "ids_activation"],
}


def recommend_defense(attack_type: str, nash_defender_strategy: List[float] = None) -> Dict:
    """
    Recommends defense actions based on the attack type and Nash equilibrium defender strategy.
    Returns a ranked list of recommended actions with confidence scores.
    """
    candidate_keys = ATTACK_TO_DEFENSE_MAP.get(attack_type, list(DEFENSE_ACTIONS.keys()))
    
    recommendations = []
    for i, key in enumerate(candidate_keys):
        action = DEFENSE_ACTIONS[key]
        # Weight by Nash strategy if provided
        weight = nash_defender_strategy[i] if (nash_defender_strategy and i < len(nash_defender_strategy)) else random.uniform(0.4, 1.0)
        confidence = round(action["effectiveness"] * weight, 2)
        recommendations.append({
            "action_id": key,
            "name": action["name"],
            "description": action["description"],
            "confidence": confidence,
            "effectiveness": action["effectiveness"],
            "cost": action["cost"],
        })

    # Sort by confidence
    recommendations.sort(key=lambda x: x["confidence"], reverse=True)
    
    return {
        "attack_type": attack_type,
        "top_action": recommendations[0] if recommendations else None,
        "all_recommendations": recommendations,
    }


def compute_defense_coverage(active_defenses: List[str]) -> float:
    """
    Computes overall defense coverage score (0-100) based on active defenses.
    """
    if not active_defenses:
        return 0.0
    total = sum(DEFENSE_ACTIONS[d]["effectiveness"] for d in active_defenses if d in DEFENSE_ACTIONS)
    max_possible = len(DEFENSE_ACTIONS) * 1.0
    return round(min((total / max_possible) * 100, 100), 1)
