from fastapi import APIRouter, HTTPException
from api.schemas import (
    ThreatAnalysisRequest, ThreatAnalysisResult,
    DefenseRecommendationRequest, DefenseRecommendationResult, DefenseRecommendation,
)
from ai.pattern_recognizer import classify_threat, analyze_attack_history
from ai.defense_agent import recommend_defense, compute_defense_coverage

router = APIRouter(prefix="/ai", tags=["AI Engine"])


@router.post("/analyze-threat", response_model=ThreatAnalysisResult)
async def analyze_threat(req: ThreatAnalysisRequest):
    """Classify a threat based on observed indicators."""
    try:
        result = classify_threat(req.indicators)
        return ThreatAnalysisResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend-defense", response_model=DefenseRecommendationResult)
async def get_defense_recommendation(req: DefenseRecommendationRequest):
    """Get AI-recommended defense actions based on attack type and Nash strategy."""
    try:
        result = recommend_defense(req.attack_type, req.nash_defender_strategy)
        top = DefenseRecommendation(**result["top_action"]) if result["top_action"] else None
        all_recs = [DefenseRecommendation(**r) for r in result["all_recommendations"]]
        return DefenseRecommendationResult(
            attack_type=result["attack_type"],
            top_action=top,
            all_recommendations=all_recs,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/attack-history")
async def analyze_history(logs: list):
    """Analyze a list of attack log entries and return trend analysis."""
    try:
        result = analyze_attack_history(logs)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/defense-coverage")
async def get_defense_coverage(active: str = ""):
    """Calculate defense coverage percentage for active defense IDs (comma-separated)."""
    try:
        active_list = [d.strip() for d in active.split(",") if d.strip()]
        coverage = compute_defense_coverage(active_list)
        return {"coverage": coverage, "active_defenses": active_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
