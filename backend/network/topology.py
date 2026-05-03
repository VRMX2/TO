import networkx as nx
from typing import Dict, List

def generate_topology(topology_type: str = "star") -> Dict:
    """
    Generates a network topology using networkx.
    Returns nodes and links for D3 visualization.
    """
    G = nx.Graph()
    
    nodes_data = {
        "Core": {"type": "core", "color": "#00f0ff"},
        "Web Server": {"type": "server", "color": "#94a3b8"},
        "App Server": {"type": "server", "color": "#94a3b8"},
        "DB Server": {"type": "server", "color": "#94a3b8"},
        "Endpoint A": {"type": "endpoint", "color": "#94a3b8"},
        "Endpoint B": {"type": "endpoint", "color": "#94a3b8"},
        "Firewall": {"type": "firewall", "color": "#00ff66"},
        "Endpoint C": {"type": "endpoint", "color": "#94a3b8"},
    }
    
    for name, attrs in nodes_data.items():
        G.add_node(name, **attrs)
    
    node_list = list(nodes_data.keys())
    
    if topology_type == "star":
        # All nodes connect to Core
        for node in node_list[1:]:
            G.add_edge("Core", node)
    elif topology_type == "mesh":
        # Every node connects to every other node
        for i, n1 in enumerate(node_list):
            for n2 in node_list[i+1:]:
                G.add_edge(n1, n2)
    elif topology_type == "ring":
        # Each node connects to the next in a circle
        for i in range(len(node_list)):
            G.add_edge(node_list[i], node_list[(i+1) % len(node_list)])
    else:
        # Default to star
        for node in node_list[1:]:
            G.add_edge("Core", node)
    
    # Use spring layout for positions
    pos = nx.spring_layout(G, seed=42)
    
    nodes = []
    for name, attrs in nodes_data.items():
        x, y = pos[name]
        nodes.append({
            "id": name,
            "type": attrs["type"],
            "color": attrs["color"],
            "x": float(x) * 250 + 400,
            "y": float(y) * 200 + 250,
            "attacked": False,
            "defended": False
        })
    
    links = []
    for u, v in G.edges():
        links.append({"source": u, "target": v})
    
    return {"nodes": nodes, "links": links, "topology": topology_type}
