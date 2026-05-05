import numpy as np
from typing import List, Dict, Optional

def find_pareto_optimal(payoff_matrix: np.ndarray, defender_matrix: Optional[np.ndarray] = None) -> List[Dict]:
    """
    Finds Pareto-optimal pure profiles for a 2-player game.
    If defender_matrix is omitted, a zero-sum model is used (B = -A).
    Works for any matrix size (m x n).
    """
    if payoff_matrix.ndim != 2:
        raise ValueError("Payoff matrix must be 2-dimensional.")

    if defender_matrix is None:
        defender_matrix = -payoff_matrix
    if defender_matrix.ndim != 2:
        raise ValueError("Defender payoff matrix must be 2-dimensional.")
    if defender_matrix.shape != payoff_matrix.shape:
        raise ValueError("Attacker and defender matrices must have the same shape.")
    rows, cols = payoff_matrix.shape

    profiles = []
    for i in range(rows):
        for j in range(cols):
            profiles.append({
                'id': i * cols + j,
                'attacker_idx': i,
                'defender_idx': j,
                'att_val': float(payoff_matrix[i, j]),
                'def_val': float(defender_matrix[i, j]),
                'attacker_payoff': float(payoff_matrix[i, j]),
                'defender_payoff': float(defender_matrix[i, j]),
            })
            
    pareto_front = []
    for p1 in profiles:
        is_dominated = False
        for p2 in profiles:
            if p1['id'] == p2['id']:
                continue
            # p2 strictly dominates p1 if it's better for both, or better for one and equal for other
            if (p2['att_val'] >= p1['att_val'] and p2['def_val'] >= p1['def_val']) and \
               (p2['att_val'] > p1['att_val'] or p2['def_val'] > p1['def_val']):
                is_dominated = True
                break
        if not is_dominated:
            pareto_front.append(p1)

    return pareto_front
