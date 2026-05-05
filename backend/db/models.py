from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(Integer, primary_key=True, index=True)
    scenario = Column(String, default="standard")
    topology = Column(String, default="star")
    nash_attacker_strategy = Column(JSON, nullable=True)
    nash_defender_strategy = Column(JSON, nullable=True)
    attacker_utility = Column(Float, nullable=True)
    defender_utility = Column(Float, nullable=True)
    pareto_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class ThreatLog(Base):
    __tablename__ = "threat_logs"

    id = Column(Integer, primary_key=True, index=True)
    attack_type = Column(String)
    target_node = Column(String)
    severity = Column(Integer)
    status = Column(String, default="detected")  # detected / blocked / breached
    confidence = Column(Float, default=0.0)
    source_ip = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DefenseAction(Base):
    __tablename__ = "defense_actions"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(String)
    action_name = Column(String)
    target_node = Column(String, nullable=True)
    effectiveness = Column(Float, default=0.0)
    cost = Column(Float, default=0.0)
    applied_at = Column(DateTime, default=datetime.utcnow)


class ScenarioPreset(Base):
    __tablename__ = "scenario_presets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    matrix_size = Column(Integer, nullable=False, default=4)
    sync_zero_sum = Column(Integer, nullable=False, default=1)  # 1=true, 0=false
    attacker_matrix = Column(JSON, nullable=False)
    defender_matrix = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
