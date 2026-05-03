from pydantic import BaseModel
from typing import List, Optional

class Strategy(BaseModel):
    id: str
    name: str
    prob: float = 0.0

class Player(BaseModel):
    name: str
    strategies: List[Strategy]

class GameState(BaseModel):
    attacker_strategies: List[Strategy]
    defender_strategies: List[Strategy]
    payoff_matrix: List[List[float]]
    nash_cell: Optional[dict] = None
    att_value: Optional[float] = None
    def_value: Optional[float] = None

class ParetoOptimal(BaseModel):
    id: int
    strat: str
    att: str
    def_: str
