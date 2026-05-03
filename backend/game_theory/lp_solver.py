import numpy as np
from scipy.optimize import linprog

def solve_lp(payoff_matrix: np.ndarray):
    """
    Solves the zero-sum game using Linear Programming.
    Returns optimal mixed strategy for the defender.
    """
    # For a zero sum game where payoff_matrix is attacker's payoff
    # Defender wants to minimize the maximum payoff of the attacker.
    
    m, n = payoff_matrix.shape
    
    # We want to minimize v
    # subject to:
    # \sum_{j} A_{ij} y_j <= v for all i (attacker pure strategies)
    # \sum_{j} y_j = 1
    # y_j >= 0
    
    # Rewriting for scipy.linprog (which minimizes c^T x)
    # let x = [y_1, y_2, ..., y_n, v]
    # c = [0, 0, ..., 0, 1]
    c = np.zeros(n + 1)
    c[-1] = 1
    
    # A_ub x <= b_ub
    # A_{ij} y_j - v <= 0
    A_ub = np.hstack([payoff_matrix, -np.ones((m, 1))])
    b_ub = np.zeros(m)
    
    # A_eq x = b_eq
    # \sum y_j + 0*v = 1
    A_eq = np.ones((1, n + 1))
    A_eq[0, -1] = 0
    b_eq = np.array([1])
    
    # Bounds
    bounds = [(0, 1) for _ in range(n)] + [(None, None)]
    
    res = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method='highs')
    
    if res.success:
        defender_strategy = res.x[:-1]
        value = res.x[-1]
        return [round(float(p), 3) for p in defender_strategy], round(float(value), 2)
    else:
        return [0.25, 0.25, 0.25, 0.25], 0.0
