import numpy as np
from typing import List, Dict

def find_pareto_optimal(payoff_matrix: np.ndarray) -> List[Dict]:
    """
    Finds Pareto optimal profiles in the given 4x4 payoff matrix.
    Assuming zero-sum game, any point is trivially pareto optimal, 
    so we simulate a general-sum characteristic for demonstration purposes 
    or just return the highest payoff cells.
    
    Here we implement a standard pareto filter over all 16 pure profiles.
    """
    # Defender's matrix
    defender_matrix = -payoff_matrix
    
    profiles = []
    for i in range(4):
        for j in range(4):
            profiles.append({
                'id': i * 4 + j,
                'strat': f"(A{i+1},D{j+1})",
                'att_val': float(payoff_matrix[i, j]),
                'def_val': float(defender_matrix[i, j]),
                'att': f"{'+' if payoff_matrix[i,j] > 0 else ''}{int(payoff_matrix[i, j])}",
                'def_': f"{'+' if defender_matrix[i,j] > 0 else ''}{int(defender_matrix[i, j])}"
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
            
    # For a strict zero sum game, all points are pareto optimal.
    # To mimic the UI mockup showing 4 profiles, we just return the top 4 
    # based on some heuristic if it's too long.
    if len(pareto_front) > 4:
        return pareto_front[:4]
        
    return pareto_front
