import numpy as np
import nashpy as nash
from typing import Tuple, List, Dict, Any, Optional

def compute_nash_equilibrium(
    payoff_matrix: np.ndarray,
    defender_matrix: Optional[np.ndarray] = None
) -> Tuple[List[float], List[float], float, float]:
    """
    Computes the Nash Equilibrium using support enumeration.
    Assumes a zero-sum game where the defender's matrix is the negative of the attacker's.
    Returns:
        attacker_eq: List of probabilities for attacker strategies.
        defender_eq: List of probabilities for defender strategies.
        att_value: Expected payoff for attacker.
        def_value: Expected payoff for defender.
    """
    analysis = compute_nash_analysis(payoff_matrix, defender_matrix)
    return (
        analysis["attacker_strategy"],
        analysis["defender_strategy"],
        analysis["attacker_utility"],
        analysis["defender_utility"],
    )


def _is_pure_strategy(strategy: np.ndarray, tol: float = 1e-8) -> bool:
    rounded = np.round(strategy)
    return bool(np.all(np.isclose(strategy, rounded, atol=tol)) and np.sum(rounded == 1) == 1)


def _compute_pure_nash_profiles(attacker_matrix: np.ndarray, defender_matrix: np.ndarray) -> List[Dict[str, Any]]:
    pure_profiles: List[Dict[str, Any]] = []
    rows, cols = attacker_matrix.shape

    for i in range(rows):
        for j in range(cols):
            attacker_best_response = attacker_matrix[i, j] >= np.max(attacker_matrix[:, j]) - 1e-12
            defender_best_response = defender_matrix[i, j] >= np.max(defender_matrix[i, :]) - 1e-12
            if attacker_best_response and defender_best_response:
                pure_profiles.append(
                    {
                        "attacker_idx": i,
                        "defender_idx": j,
                        "attacker_payoff": round(float(attacker_matrix[i, j]), 4),
                        "defender_payoff": round(float(defender_matrix[i, j]), 4),
                    }
                )

    return pure_profiles


def compute_nash_analysis(
    payoff_matrix: np.ndarray,
    defender_matrix: Optional[np.ndarray] = None
) -> Dict[str, Any]:
    """
    Full 2-player Nash analysis for a normal-form game.
    Player 1 = attacker, Player 2 = defender.
    If defender_matrix is omitted, a zero-sum model is used (B = -A).
    """
    if payoff_matrix.ndim != 2:
        raise ValueError("Payoff matrix must be 2-dimensional.")
    if payoff_matrix.shape[0] == 0 or payoff_matrix.shape[1] == 0:
        raise ValueError("Payoff matrix must not be empty.")

    attacker_matrix = payoff_matrix
    if defender_matrix is None:
        defender_matrix = -payoff_matrix
    if defender_matrix.ndim != 2:
        raise ValueError("Defender payoff matrix must be 2-dimensional.")
    if defender_matrix.shape != payoff_matrix.shape:
        raise ValueError("Attacker and defender matrices must have the same shape.")
    rows, cols = attacker_matrix.shape

    game = nash.Game(attacker_matrix, defender_matrix)
    equilibria = list(game.support_enumeration())
    if not equilibria:
        equilibria = list(game.vertex_enumeration())

    if not equilibria:
        attacker_eq = [round(float(1.0 / rows), 3)] * rows
        defender_eq = [round(float(1.0 / cols), 3)] * cols
        return {
            "players": ["Attacker", "Defender"],
            "attacker_strategy": attacker_eq,
            "defender_strategy": defender_eq,
            "attacker_utility": 0.0,
            "defender_utility": 0.0,
            "equilibria": [],
            "pure_nash_profiles": [],
            "payoff_table": [],
        }

    all_equilibria: List[Dict[str, Any]] = []
    for idx, (att_sigma, def_sigma) in enumerate(equilibria):
        att_value = float(np.dot(att_sigma, np.dot(attacker_matrix, def_sigma)))
        def_value = float(np.dot(att_sigma, np.dot(defender_matrix, def_sigma)))
        all_equilibria.append(
            {
                "id": idx + 1,
                "type": "PURE" if (_is_pure_strategy(att_sigma) and _is_pure_strategy(def_sigma)) else "MIXED",
                "attacker_strategy": [round(float(p), 4) for p in att_sigma],
                "defender_strategy": [round(float(p), 4) for p in def_sigma],
                "attacker_utility": round(att_value, 4),
                "defender_utility": round(def_value, 4),
            }
        )

    payoff_table: List[Dict[str, Any]] = []
    pure_nash_profiles = _compute_pure_nash_profiles(attacker_matrix, defender_matrix)
    pure_nash_set = {(p["attacker_idx"], p["defender_idx"]) for p in pure_nash_profiles}
    for i in range(rows):
        for j in range(cols):
            payoff_table.append(
                {
                    "attacker_idx": i,
                    "defender_idx": j,
                    "attacker_payoff": round(float(attacker_matrix[i, j]), 4),
                    "defender_payoff": round(float(defender_matrix[i, j]), 4),
                    "is_pure_nash": (i, j) in pure_nash_set,
                }
            )

    first = all_equilibria[0]
    return {
        "players": ["Attacker", "Defender"],
        "attacker_strategy": first["attacker_strategy"],
        "defender_strategy": first["defender_strategy"],
        "attacker_utility": first["attacker_utility"],
        "defender_utility": first["defender_utility"],
        "equilibria": all_equilibria,
        "pure_nash_profiles": pure_nash_profiles,
        "payoff_table": payoff_table,
    }
