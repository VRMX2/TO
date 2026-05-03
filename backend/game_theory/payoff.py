import numpy as np

def build_payoff_matrix(scenario: str) -> np.ndarray:
    """
    Returns the payoff matrix for the attacker (zero-sum game implies defender is -A).
    """
    if scenario == "zero-sum":
        return np.array([
            [5, -2, -1, 4],
            [4, 6, -8, 3],
            [-3, 1, 7, 2],
            [2, -2, 5, 0]
        ])
    elif scenario == "advanced":
        return np.array([
            [10, 5, -5, 2],
            [3, 8, 1, -2],
            [-2, 0, 9, 4],
            [5, -1, 3, 6]
        ])
    else:
        # standard 4x4
        return np.array([
            [5, 2, -1, 4],
            [4, 6, 8, 3],
            [-3, 1, 7, 2],
            [2, -2, 5, 0]
        ])

def validate_matrix(matrix: list) -> np.ndarray:
    try:
        arr = np.array(matrix, dtype=float)
        if arr.shape != (4, 4):
            raise ValueError("Matrix must be 4x4")
        return arr
    except Exception as e:
        raise ValueError(f"Invalid matrix: {str(e)}")
