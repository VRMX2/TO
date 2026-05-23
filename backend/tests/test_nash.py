import numpy as np
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from game_theory.nash import compute_nash_analysis
from game_theory.pareto import find_pareto_optimal
from game_theory.lp_solver import solve_lp

def test_pure_nash_saddle():
    matrix = [[3, 1], [2, 1]]
    result = compute_nash_analysis(np.array(matrix))
    pure = result['pure_nash_profiles']
    assert len(pure) >= 1
    assert any(p['attacker_idx'] == 1 and p['defender_idx'] == 1 for p in pure)

def test_no_pure_nash():
    matrix = [[0, 2], [1, 0]]
    result = compute_nash_analysis(np.array(matrix))
    assert len(result['pure_nash_profiles']) == 0

def test_mixed_nash_valid():
    matrix = [[3, 1], [0, 4]]
    result = compute_nash_analysis(np.array(matrix))
    att = result['attacker_strategy']
    assert len(att) == 2
    assert all(0 <= p <= 1 for p in att)
    assert abs(sum(att) - 1.0) < 0.01

def test_pareto_optimal():
    matrix = [[3, 1], [0, 4]]
    profiles = find_pareto_optimal(np.array(matrix))
    assert len(profiles) >= 1

def test_lp_solver():
    matrix = np.array([[3, 1], [0, 4]])
    result = solve_lp(matrix)
    assert result['status'] == 'success'
    assert len(result['optimal_attacker_strategy']) == 2
    assert len(result['optimal_defender_strategy']) == 2
    assert abs(sum(result['optimal_defender_strategy']) - 1.0) < 0.01

def test_lp_rock_paper_scissors():
    matrix = np.array([[0, -1, 1], [1, 0, -1], [-1, 1, 0]])
    result = solve_lp(matrix)
    assert result['status'] == 'success'
    assert abs(result['game_value']) < 0.01

def test_convergence_shape():
    from game_theory.convergence import generate_convergence_data
    data = generate_convergence_data(2.5, -2.5)
    assert len(data) == 41
    assert 'iteration' in data[0]
    assert 'attacker' in data[0]
    assert 'defender' in data[0]
