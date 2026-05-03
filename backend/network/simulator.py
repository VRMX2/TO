import random
from typing import Dict, List

def simulate_attack(topology_data: Dict, attack_type: str = "DDoS") -> Dict:
    """
    Simulates an attack on a random node in the topology.
    Returns the attacked node and propagation info.
    """
    nodes = topology_data.get("nodes", [])
    if not nodes:
        return {"error": "No nodes in topology"}
    
    # Pick a random non-core node to attack
    target_candidates = [n for n in nodes if n["type"] != "core"]
    if not target_candidates:
        target_candidates = nodes
    
    target = random.choice(target_candidates)
    
    # Determine severity based on attack type
    severity_map = {
        "SQLi": {"severity": "medium", "spread_chance": 0.3},
        "DDoS": {"severity": "high", "spread_chance": 0.6},
        "Zero-Day": {"severity": "critical", "spread_chance": 0.8},
        "Phishing": {"severity": "low", "spread_chance": 0.2}
    }
    
    attack_info = severity_map.get(attack_type, severity_map["DDoS"])
    
    # Propagation: check if attack spreads to adjacent nodes
    propagated_nodes = []
    links = topology_data.get("links", [])
    adjacent = [l["target"] if l["source"] == target["id"] else l["source"] 
                for l in links if target["id"] in (l["source"], l["target"])]
    
    for adj_id in adjacent:
        if random.random() < attack_info["spread_chance"]:
            propagated_nodes.append(adj_id)
    
    return {
        "target_node": target["id"],
        "attack_type": attack_type,
        "severity": attack_info["severity"],
        "propagated_to": propagated_nodes,
        "threat_increase": random.randint(5, 15)
    }


def deploy_defense(topology_data: Dict, strategy: str = "Firewall") -> Dict:
    """
    Deploys a defense on a random vulnerable node.
    """
    nodes = topology_data.get("nodes", [])
    target_candidates = [n for n in nodes if n["type"] in ("endpoint", "server")]
    if not target_candidates:
        target_candidates = nodes
    
    target = random.choice(target_candidates)
    
    defense_effectiveness = {
        "Firewall": {"coverage_boost": 5, "threat_reduction": 8},
        "Intrusion Det.": {"coverage_boost": 3, "threat_reduction": 5},
        "Patch System": {"coverage_boost": 7, "threat_reduction": 10},
        "Honey Pot": {"coverage_boost": 4, "threat_reduction": 6}
    }
    
    info = defense_effectiveness.get(strategy, defense_effectiveness["Firewall"])
    
    return {
        "defended_node": target["id"],
        "strategy": strategy,
        "coverage_boost": info["coverage_boost"],
        "threat_reduction": info["threat_reduction"]
    }
