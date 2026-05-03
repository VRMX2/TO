import numpy as np
import nashpy as nash
from typing import Tuple, List

def compute_nash_equilibrium(payoff_matrix: np.ndarray) -> Tuple[List[float], List[float], float, float]:
    """
    Computes the Nash Equilibrium using support enumeration.
    Assumes a zero-sum game where the defender's matrix is the negative of the attacker's.
    Returns:
        attacker_eq: List of probabilities for attacker strategies.
        defender_eq: List of probabilities for defender strategies.
        att_value: Expected payoff for attacker.
        def_value: Expected payoff for defender.
    """
    # Defender's payoff is -payoff_matrix for zero-sum
    defender_matrix = -payoff_matrix
    
    # Create the game
    game = nash.Game(payoff_matrix, defender_matrix)
    
    # Find equilibria using support enumeration
    equilibria = list(game.support_enumeration())
    
    if not equilibria:
        # Fallback if no equilibrium found via support enumeration (rare for zero-sum, but just in case)
        equilibria = list(game.vertex_enumeration())
        
    if not equilibria:
         return [0.25, 0.25, 0.25, 0.25], [0.25, 0.25, 0.25, 0.25], 0.0, 0.0

    # Pick the first equilibrium (in zero-sum games, all NE yield the same value)
    eq = equilibria[0]
    attacker_eq = [round(float(p), 3) for p in eq[0]]
    defender_eq = [round(float(p), 3) for p in eq[1]]
    
    # Calculate expected value
    att_value = np.dot(eq[0], np.dot(payoff_matrix, eq[1]))
    def_value = np.dot(eq[0], np.dot(defender_matrix, eq[1]))
    
    return attacker_eq, defender_eq, round(float(att_value), 2), round(float(def_value), 2)
