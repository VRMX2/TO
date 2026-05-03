import math
import random
from typing import List, Dict

def generate_convergence_data(att_eq: float, def_eq: float) -> List[Dict]:
    """
    Generates mock convergence data for the chart, 
    simulating fictitious play converging to the Nash values.
    """
    data = []
    for i in range(0, 81, 2):
        # Dampened sine wave converging to the equilibrium value
        att_val = 5 * math.exp(-i / 20) * math.sin(i / 5) + att_eq + (random.random() - 0.5) * 0.3
        def_val = -5 * math.exp(-i / 20) * math.sin(i / 5) + def_eq + (random.random() - 0.5) * 0.3
        
        data.append({
            'iteration': i,
            'attacker': round(att_val, 2),
            'defender': round(def_val, 2)
        })
        
    return data
