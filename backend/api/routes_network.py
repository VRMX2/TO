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


from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Depends
from db.database import get_db
from db.models import ThreatLog, DefenseAction

@router.post("/simulate-attack", response_model=SimulateAttackResult)
async def run_simulate_attack(req: SimulateAttackRequest, db: Session = Depends(get_db)):
    """Simulate a cyber attack on the network topology and log the threat."""
    try:
        topology = generate_topology(req.topology_type)
        result = simulate_attack(topology, req.attack_type)
        
        # Log to database
        threat_log = ThreatLog(
            attack_type=result.get("attack_type", req.attack_type),
            target_node=result.get("attacked_node", "unknown"),
            severity=result.get("severity", 50),
            status=result.get("status", "detected"),
            confidence=0.85
        )
        db.add(threat_log)
        db.commit()
        
        return SimulateAttackResult(**result)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deploy-defense", response_model=DeployDefenseResult)
async def run_deploy_defense(req: DeployDefenseRequest, db: Session = Depends(get_db)):
    """Deploy a defense action to a network node and log the action."""
    try:
        topology = generate_topology(req.topology_type)
        result = deploy_defense(topology, req.target_node)
        
        # Log to database
        action_log = DefenseAction(
            action_id=result.get("action", "unknown"),
            action_name=result.get("action", "unknown"),
            target_node=req.target_node,
            effectiveness=result.get("coverage", 0.0),
            cost=10.0 # arbitrary default
        )
        db.add(action_log)
        db.commit()
        
        return DeployDefenseResult(**result)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
