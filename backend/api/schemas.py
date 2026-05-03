from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


# ── Game Theory Schemas ──────────────────────────────────────────────

class ComputeNashRequest(BaseModel):
    matrix: List[List[float]]
    scenario: Optional[str] = "standard"

class NashResult(BaseModel):
    attacker_strategy: List[float]
    defender_strategy: List[float]
    attacker_utility: float
    defender_utility: float
    convergence_data: List[Dict[str, Any]]

class ParetoRequest(BaseModel):
    matrix: List[List[float]]

class ParetoProfile(BaseModel):
    attacker_idx: int
    defender_idx: int
    attacker_payoff: float
    defender_payoff: float

class ParetoResult(BaseModel):
    pareto_profiles: List[ParetoProfile]
    count: int

class LPSolveRequest(BaseModel):
    matrix: List[List[float]]

class LPSolveResult(BaseModel):
    optimal_defender_strategy: List[float]
    game_value: float
    status: str


# ── Network Schemas ──────────────────────────────────────────────────

class TopologyRequest(BaseModel):
    topology_type: str = "star"  # star | mesh | ring

class NodeData(BaseModel):
    id: str
    label: str
    type: str  # core | server | firewall | endpoint
    x: float
    y: float
    status: str = "normal"

class LinkData(BaseModel):
    source: str
    target: str

class TopologyResult(BaseModel):
    nodes: List[NodeData]
    links: List[LinkData]
    node_count: int

class SimulateAttackRequest(BaseModel):
    topology_type: str = "star"
    attack_type: str = "DDoS"

class SimulateAttackResult(BaseModel):
    attacked_node: str
    attack_type: str
    propagation: List[str]
    severity: int
    status: str

class DeployDefenseRequest(BaseModel):
    topology_type: str = "star"
    target_node: Optional[str] = None

class DeployDefenseResult(BaseModel):
    defended_node: str
    action: str
    coverage: float
    status: str


# ── AI / Threat Schemas ───────────────────────────────────────────────

class ThreatAnalysisRequest(BaseModel):
    indicators: List[str]

class ThreatAnalysisResult(BaseModel):
    attack_type: str
    confidence: float
    severity: int
    indicators_matched: List[str]
    timestamp: str

class DefenseRecommendationRequest(BaseModel):
    attack_type: str
    nash_defender_strategy: Optional[List[float]] = None

class DefenseRecommendation(BaseModel):
    action_id: str
    name: str
    description: str
    confidence: float
    effectiveness: float
    cost: float

class DefenseRecommendationResult(BaseModel):
    attack_type: str
    top_action: Optional[DefenseRecommendation]
    all_recommendations: List[DefenseRecommendation]


# ── Shared ────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
