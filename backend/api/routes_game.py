import numpy as np
from fastapi import APIRouter, HTTPException
from api.schemas import (
    ComputeNashRequest, NashResult,
    ParetoRequest, ParetoResult, ParetoProfile,
    LPSolveRequest, LPSolveResult,
)
from game_theory.nash import compute_nash_equilibrium
from game_theory.pareto import find_pareto_optimal
from game_theory.lp_solver import solve_lp
from game_theory.convergence import generate_convergence_data
from game_theory.payoff import build_payoff_matrix

router = APIRouter(prefix="/game", tags=["Game Theory"])


@router.post("/nash", response_model=NashResult)
async def compute_nash(req: ComputeNashRequest):
    """Compute Nash Equilibrium for the given payoff matrix."""
    try:
        matrix = np.array(req.matrix, dtype=float)
        att_strat, def_strat, att_util, def_util = compute_nash_equilibrium(matrix)
        convergence = generate_convergence_data(att_util, def_util)
        return NashResult(
            attacker_strategy=att_strat,
            defender_strategy=def_strat,
            attacker_utility=round(att_util, 4),
            defender_utility=round(def_util, 4),
            convergence_data=convergence,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pareto", response_model=ParetoResult)
async def get_pareto(req: ParetoRequest):
    """Find Pareto-optimal strategy profiles."""
    try:
        matrix = np.array(req.matrix, dtype=float)
        profiles = find_pareto_optimal(matrix)
        pareto_list = [ParetoProfile(**p) for p in profiles]
        return ParetoResult(pareto_profiles=pareto_list, count=len(pareto_list))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/lp-solve", response_model=LPSolveResult)
async def lp_solve(req: LPSolveRequest):
    """Solve zero-sum game via Linear Programming."""
    try:
        matrix = np.array(req.matrix, dtype=float)
        result = solve_lp(matrix)
        return LPSolveResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenario/{scenario_name}")
async def get_scenario_matrix(scenario_name: str):
    """Get a pre-built payoff matrix for a named scenario."""
    try:
        matrix = build_payoff_matrix(scenario_name)
        return {"scenario": scenario_name, "matrix": matrix.tolist()}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_name}' not found.")
