import random
from typing import Dict, List

SEVERITY_SCORE = {"low": 20, "medium": 45, "high": 70, "critical": 90}

def simulate_attack(topology_data: Dict, attack_type: str = "DDoS") -> Dict:
    """
    Simulates an attack on a random node in the topology.
    Returns the attacked node and propagation info, matching SimulateAttackResult schema.
    """
    nodes = topology_data.get("nodes", [])
    if not nodes:
        return {"attacked_node": "unknown", "attack_type": attack_type, "propagation": [], "severity": 50, "status": "detected"}

    # Pick a random non-core node to attack
    target_candidates = [n for n in nodes if n.get("type") not in ("core", "firewall")]
    if not target_candidates:
        target_candidates = nodes

    target = random.choice(target_candidates)

    # Determine severity based on attack type
    severity_map = {
        "SQLi":     {"severity": "medium", "spread_chance": 0.3},
        "DDoS":     {"severity": "high",   "spread_chance": 0.6},
        "Zero-Day": {"severity": "critical","spread_chance": 0.8},
        "Phishing": {"severity": "low",    "spread_chance": 0.2},
    }
    attack_info = severity_map.get(attack_type, severity_map["DDoS"])
    severity_label = attack_info["severity"]
    severity_score = SEVERITY_SCORE[severity_label] + random.randint(-5, 10)

    # Propagation: check if attack spreads to adjacent nodes
    propagated_nodes: List[str] = []
    links = topology_data.get("links", [])
    adjacent = [
        l["target"] if l["source"] == target["id"] else l["source"]
        for l in links
        if target["id"] in (l["source"], l["target"])
    ]
    for adj_id in adjacent:
        if random.random() < attack_info["spread_chance"]:
            propagated_nodes.append(adj_id)

    # Determine if blocked or breached
    status = random.choices(["detected", "blocked", "breached"], weights=[0.45, 0.40, 0.15])[0]

    return {
        "attacked_node": target["id"],
        "attack_type":   attack_type,
        "propagation":   propagated_nodes,
        "severity":      int(severity_score),
        "status":        status,
    }


def deploy_defense(topology_data: Dict, target_node: str = None) -> Dict:
    """
    Deploys a defense on a node.
    Returns a response matching DeployDefenseResult schema.
    """
    nodes = topology_data.get("nodes", [])
    if target_node:
        node = next((n for n in nodes if n["id"] == target_node), None)
    else:
        candidates = [n for n in nodes if n.get("type") in ("endpoint", "server", "firewall")]
        node = random.choice(candidates) if candidates else (nodes[0] if nodes else None)

    if not node:
        return {"defended_node": "unknown", "action": "No-op", "coverage": 0.0, "status": "failed"}

    strategies = ["Firewall Rule Update", "IDS Signature Push", "Patch Deployed", "Honeypot Activated"]
    action = random.choice(strategies)
    coverage = round(random.uniform(0.55, 0.95), 3)

    return {
        "defended_node": node["id"],
        "action":        action,
        "coverage":      coverage,
        "status":        "active",
    }
