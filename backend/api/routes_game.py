import numpy as np
from fastapi import APIRouter, HTTPException, Depends
from api.schemas import (
    ComputeNashRequest, NashResult,
    ParetoRequest, ParetoResult, ParetoProfile,
    LPSolveRequest, LPSolveResult,
    ScenarioPresetRequest, ScenarioPresetResponse,
)
from game_theory.nash import compute_nash_analysis
from game_theory.pareto import find_pareto_optimal
from game_theory.lp_solver import solve_lp
from game_theory.convergence import generate_convergence_data
from game_theory.payoff import build_payoff_matrix

router = APIRouter(prefix="/game", tags=["Game Theory"])


from sqlalchemy.orm import Session
from db.database import get_db
from db.models import SimulationRun, ScenarioPreset


def _to_matrix_2d(data, name: str) -> np.ndarray:
    matrix = np.array(data, dtype=float)
    if matrix.ndim != 2:
        raise ValueError(f"{name} must be a 2D matrix.")
    if matrix.shape[0] == 0 or matrix.shape[1] == 0:
        raise ValueError(f"{name} must not be empty.")
    return matrix

@router.post("/nash", response_model=NashResult)
async def compute_nash(req: ComputeNashRequest, db: Session = Depends(get_db)):
    """Compute Nash Equilibrium for the given payoff matrix and save the run."""
    try:
        matrix = _to_matrix_2d(req.matrix, "matrix")
        defender_matrix = _to_matrix_2d(req.defender_matrix, "defender_matrix") if req.defender_matrix is not None else None
        nash_analysis = compute_nash_analysis(matrix, defender_matrix)
        att_strat = nash_analysis["attacker_strategy"]
        def_strat = nash_analysis["defender_strategy"]
        att_util = nash_analysis["attacker_utility"]
        def_util = nash_analysis["defender_utility"]
        convergence = generate_convergence_data(att_util, def_util)
        
        # Optional: calculate pareto count to store in DB
        pareto_profiles = find_pareto_optimal(matrix, defender_matrix)
        
        # Persist to database
        sim_run = SimulationRun(
            scenario=req.scenario or "standard",
            topology="star", # Default for now
            nash_attacker_strategy=att_strat,
            nash_defender_strategy=def_strat,
            attacker_utility=float(att_util),
            defender_utility=float(def_util),
            pareto_count=len(pareto_profiles)
        )
        db.add(sim_run)
        db.commit()

        return NashResult(
            attacker_strategy=att_strat,
            defender_strategy=def_strat,
            attacker_utility=round(att_util, 4),
            defender_utility=round(def_util, 4),
            convergence_data=convergence,
            players=nash_analysis["players"],
            equilibria=nash_analysis["equilibria"],
            pure_nash_profiles=nash_analysis["pure_nash_profiles"],
            payoff_table=nash_analysis["payoff_table"],
        )
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pareto", response_model=ParetoResult)
async def get_pareto(req: ParetoRequest):
    """Find Pareto-optimal strategy profiles."""
    try:
        matrix = _to_matrix_2d(req.matrix, "matrix")
        defender_matrix = _to_matrix_2d(req.defender_matrix, "defender_matrix") if req.defender_matrix is not None else None
        profiles = find_pareto_optimal(matrix, defender_matrix)
        pareto_list = [
            ParetoProfile(
                attacker_idx=int(p["attacker_idx"]),
                defender_idx=int(p["defender_idx"]),
                attacker_payoff=float(p["attacker_payoff"]),
                defender_payoff=float(p["defender_payoff"]),
            )
            for p in profiles
        ]
        return ParetoResult(pareto_profiles=pareto_list, count=len(pareto_list))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
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


@router.get("/presets", response_model=list[ScenarioPresetResponse])
async def list_presets(db: Session = Depends(get_db)):
    presets = db.query(ScenarioPreset).order_by(ScenarioPreset.updated_at.desc()).all()
    return [
        ScenarioPresetResponse(
            name=p.name,
            matrix_size=p.matrix_size,
            sync_zero_sum=bool(p.sync_zero_sum),
            attacker_matrix=p.attacker_matrix,
            defender_matrix=p.defender_matrix,
            updated_at=p.updated_at,
            created_at=p.created_at,
        )
        for p in presets
    ]


@router.post("/presets", response_model=ScenarioPresetResponse)
async def upsert_preset(req: ScenarioPresetRequest, db: Session = Depends(get_db)):
    try:
        _to_matrix_2d(req.attacker_matrix, "attacker_matrix")
        _to_matrix_2d(req.defender_matrix, "defender_matrix")
        if len(req.attacker_matrix) != req.matrix_size or len(req.attacker_matrix[0]) != req.matrix_size:
            raise ValueError("matrix_size must match attacker_matrix dimensions.")
        existing = db.query(ScenarioPreset).filter(ScenarioPreset.name == req.name).first()
        if existing:
            existing.matrix_size = req.matrix_size
            existing.sync_zero_sum = 1 if req.sync_zero_sum else 0
            existing.attacker_matrix = req.attacker_matrix
            existing.defender_matrix = req.defender_matrix
            db.commit()
            db.refresh(existing)
            row = existing
        else:
            row = ScenarioPreset(
                name=req.name,
                matrix_size=req.matrix_size,
                sync_zero_sum=1 if req.sync_zero_sum else 0,
                attacker_matrix=req.attacker_matrix,
                defender_matrix=req.defender_matrix,
            )
            db.add(row)
            db.commit()
            db.refresh(row)
        return ScenarioPresetResponse(
            name=row.name,
            matrix_size=row.matrix_size,
            sync_zero_sum=bool(row.sync_zero_sum),
            attacker_matrix=row.attacker_matrix,
            defender_matrix=row.defender_matrix,
            updated_at=row.updated_at,
            created_at=row.created_at,
        )
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/presets/{old_name}", response_model=ScenarioPresetResponse)
async def rename_preset(old_name: str, req: ScenarioPresetRequest, db: Session = Depends(get_db)):
    row = db.query(ScenarioPreset).filter(ScenarioPreset.name == old_name).first()
    if not row:
        raise HTTPException(status_code=404, detail="Preset not found.")
    target_conflict = db.query(ScenarioPreset).filter(ScenarioPreset.name == req.name, ScenarioPreset.name != old_name).first()
    if target_conflict:
        raise HTTPException(status_code=409, detail="Target preset name already exists.")
    row.name = req.name
    row.matrix_size = req.matrix_size
    row.sync_zero_sum = 1 if req.sync_zero_sum else 0
    row.attacker_matrix = req.attacker_matrix
    row.defender_matrix = req.defender_matrix
    db.commit()
    db.refresh(row)
    return ScenarioPresetResponse(
        name=row.name,
        matrix_size=row.matrix_size,
        sync_zero_sum=bool(row.sync_zero_sum),
        attacker_matrix=row.attacker_matrix,
        defender_matrix=row.defender_matrix,
        updated_at=row.updated_at,
        created_at=row.created_at,
    )


@router.delete("/presets/{name}")
async def delete_preset(name: str, db: Session = Depends(get_db)):
    row = db.query(ScenarioPreset).filter(ScenarioPreset.name == name).first()
    if not row:
        raise HTTPException(status_code=404, detail="Preset not found.")
    db.delete(row)
    db.commit()
    return {"status": "deleted", "name": name}
