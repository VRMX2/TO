from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

from app.config import settings

MAX_MATRIX = settings.max_matrix_size
TopologyType = Literal["star", "mesh", "ring"]
AttackType = Literal["DDoS", "SQLi", "Zero-Day", "Brute Force", "Phishing", "MitM"]


def _validate_square_matrix(matrix: List[List[float]], name: str) -> List[List[float]]:
    if not matrix:
        raise ValueError(f"{name} must not be empty.")
    rows = len(matrix)
    if rows > MAX_MATRIX:
        raise ValueError(f"{name} exceeds maximum size ({MAX_MATRIX}x{MAX_MATRIX}).")
    cols = len(matrix[0]) if matrix else 0
    if cols > MAX_MATRIX:
        raise ValueError(f"{name} exceeds maximum size ({MAX_MATRIX}x{MAX_MATRIX}).")
    if any(len(row) != cols for row in matrix):
        raise ValueError(f"{name} must be rectangular.")
    for row in matrix:
        for val in row:
            if not isinstance(val, (int, float)):
                raise ValueError(f"{name} must contain numeric values only.")
            if abs(val) > 1_000_000:
                raise ValueError(f"{name} contains out-of-range values.")
    return matrix


# ── Game Theory Schemas ──────────────────────────────────────────────

class ComputeNashRequest(BaseModel):
    matrix: List[List[float]]
    defender_matrix: Optional[List[List[float]]] = None
    scenario: Optional[str] = Field(default="standard", max_length=64)

    @field_validator("matrix")
    @classmethod
    def validate_matrix(cls, v):
        return _validate_square_matrix(v, "matrix")

    @field_validator("defender_matrix")
    @classmethod
    def validate_defender_matrix(cls, v):
        if v is None:
            return v
        return _validate_square_matrix(v, "defender_matrix")


class NashResult(BaseModel):
    attacker_strategy: List[float]
    defender_strategy: List[float]
    attacker_utility: float
    defender_utility: float
    convergence_data: List[Dict[str, Any]]
    players: List[str] = Field(default_factory=lambda: ["Attacker", "Defender"])
    equilibria: List[Dict[str, Any]] = Field(default_factory=list)
    pure_nash_profiles: List[Dict[str, Any]] = Field(default_factory=list)
    payoff_table: List[Dict[str, Any]] = Field(default_factory=list)


class ParetoRequest(BaseModel):
    matrix: List[List[float]]
    defender_matrix: Optional[List[List[float]]] = None

    @field_validator("matrix")
    @classmethod
    def validate_matrix(cls, v):
        return _validate_square_matrix(v, "matrix")

    @field_validator("defender_matrix")
    @classmethod
    def validate_defender_matrix(cls, v):
        if v is None:
            return v
        return _validate_square_matrix(v, "defender_matrix")


class ParetoProfile(BaseModel):
    attacker_idx: int
    defender_idx: int
    attacker_payoff: float
    defender_payoff: float


class ParetoResult(BaseModel):
    pareto_profiles: List[ParetoProfile]
    count: int


class ScenarioPresetRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80, pattern=r"^[\w\-. ]+$")
    matrix_size: int = Field(..., ge=2, le=MAX_MATRIX)
    sync_zero_sum: bool = True
    attacker_matrix: List[List[float]]
    defender_matrix: List[List[float]]

    @field_validator("attacker_matrix", "defender_matrix")
    @classmethod
    def validate_preset_matrix(cls, v):
        return _validate_square_matrix(v, "matrix")

    @model_validator(mode="after")
    def validate_dimensions(self):
        a_rows = len(self.attacker_matrix)
        d_rows = len(self.defender_matrix)
        if a_rows != self.matrix_size or d_rows != self.matrix_size:
            raise ValueError("matrix_size must match matrix dimensions.")
        if len(self.attacker_matrix[0]) != self.matrix_size:
            raise ValueError("attacker_matrix must be square.")
        if len(self.defender_matrix[0]) != self.matrix_size:
            raise ValueError("defender_matrix must be square.")
        return self


class ScenarioPresetResponse(BaseModel):
    name: str
    matrix_size: int
    sync_zero_sum: bool
    attacker_matrix: List[List[float]]
    defender_matrix: List[List[float]]
    updated_at: datetime
    created_at: datetime


class LPSolveRequest(BaseModel):
    matrix: List[List[float]]

    @field_validator("matrix")
    @classmethod
    def validate_matrix(cls, v):
        return _validate_square_matrix(v, "matrix")


class LPSolveResult(BaseModel):
    optimal_attacker_strategy: List[float]
    optimal_defender_strategy: List[float]
    game_value: float
    status: str


# ── Network Schemas ──────────────────────────────────────────────────

class TopologyRequest(BaseModel):
    topology_type: TopologyType = "star"


class NodeData(BaseModel):
    id: str
    label: str
    type: str
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
    topology_type: TopologyType = "star"
    attack_type: AttackType = "DDoS"


class SimulateAttackResult(BaseModel):
    attacked_node: str
    attack_type: str
    propagation: List[str]
    severity: int
    status: str


class DeployDefenseRequest(BaseModel):
    topology_type: TopologyType = "star"
    target_node: Optional[str] = Field(default=None, max_length=64)


class DeployDefenseResult(BaseModel):
    defended_node: str
    action: str
    coverage: float
    status: str


# ── AI / Threat Schemas ───────────────────────────────────────────────

class ThreatAnalysisRequest(BaseModel):
    indicators: List[str] = Field(..., min_length=1, max_length=32)

    @field_validator("indicators")
    @classmethod
    def validate_indicators(cls, v):
        cleaned = [s.strip()[:128] for s in v if s and s.strip()]
        if not cleaned:
            raise ValueError("At least one non-empty indicator is required.")
        return cleaned


class ThreatAnalysisResult(BaseModel):
    attack_type: str
    confidence: float
    severity: int
    indicators_matched: List[str]
    timestamp: str


class DefenseRecommendationRequest(BaseModel):
    attack_type: AttackType = "DDoS"
    nash_defender_strategy: Optional[List[float]] = Field(default=None, max_length=MAX_MATRIX)


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


class RoundAdviceRequest(BaseModel):
    round: int = Field(default=0, ge=0, le=10_000)
    attacker: str = Field(default="Unknown", max_length=128)
    defender: str = Field(default="Unknown", max_length=128)
    payoff: float = Field(default=0, ge=-10_000, le=10_000)
    threat: float = Field(default=0, ge=0, le=100)
    coverage: float = Field(default=0, ge=0, le=100)


class AttackHistoryRequest(BaseModel):
    logs: List[Dict[str, Any]] = Field(default_factory=list, max_length=500)


# ── Report Schemas ────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    nash_p: List[float] = Field(..., max_length=MAX_MATRIX)
    nash_q: List[float] = Field(..., max_length=MAX_MATRIX)
    game_value: float = Field(..., ge=-10_000, le=10_000)
    pure_nash: List[Dict[str, Any]] = Field(default_factory=list, max_length=64)
    scenario: str = Field(default="Standard 4×4 Zero-Sum", max_length=128)
    rounds: int = Field(default=50, ge=1, le=10_000)


class ReportResult(BaseModel):
    briefing: str
    threat: Dict[str, Any]


# ── Shared ────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
