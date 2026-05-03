from fastapi import APIRouter, HTTPException
from api.schemas import (
    TopologyRequest, TopologyResult, NodeData, LinkData,
    SimulateAttackRequest, SimulateAttackResult,
    DeployDefenseRequest, DeployDefenseResult,
)
from network.topology import generate_topology
from network.simulator import simulate_attack, deploy_defense

router = APIRouter(prefix="/network", tags=["Network"])


@router.post("/topology", response_model=TopologyResult)
async def get_topology(req: TopologyRequest):
    """Generate a network topology graph for D3 visualization."""
    try:
        data = generate_topology(req.topology_type)
        nodes = [NodeData(**n) for n in data["nodes"]]
        links = [LinkData(**l) for l in data["links"]]
        return TopologyResult(nodes=nodes, links=links, node_count=len(nodes))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/topology/{topology_type}", response_model=TopologyResult)
async def get_topology_get(topology_type: str):
    """GET version of topology endpoint."""
    try:
        data = generate_topology(topology_type)
        nodes = [NodeData(**n) for n in data["nodes"]]
        links = [LinkData(**l) for l in data["links"]]
        return TopologyResult(nodes=nodes, links=links, node_count=len(nodes))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate-attack", response_model=SimulateAttackResult)
async def run_simulate_attack(req: SimulateAttackRequest):
    """Simulate a cyber attack on the network topology."""
    try:
        topology = generate_topology(req.topology_type)
        result = simulate_attack(topology, req.attack_type)
        return SimulateAttackResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deploy-defense", response_model=DeployDefenseResult)
async def run_deploy_defense(req: DeployDefenseRequest):
    """Deploy a defense action to a network node."""
    try:
        topology = generate_topology(req.topology_type)
        result = deploy_defense(topology, req.target_node)
        return DeployDefenseResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
