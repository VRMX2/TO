from fastapi import APIRouter, HTTPException
from api.schemas import (
    ThreatAnalysisRequest, ThreatAnalysisResult,
    DefenseRecommendationRequest, DefenseRecommendationResult, DefenseRecommendation,
    ReportRequest, ReportResult,
)
from ai.pattern_recognizer import classify_threat, analyze_attack_history
from ai.defense_agent import recommend_defense, compute_defense_coverage
from app.config import settings
from groq import Groq
import json

router = APIRouter(prefix="/ai", tags=["AI Engine"])

ATTACK_STRATEGIES = ['SQL Injection', 'DDoS Flood', 'Zero-Day Exploit', 'Phishing APT']
DEFENSE_STRATEGIES = ['Firewall', 'Intrusion Det.', 'Patch System', 'Honey Pot']


@router.post("/generate-report", response_model=ReportResult)
async def generate_report(req: ReportRequest):
    """Generate a full AI executive security briefing using Groq."""
    try:
        client = Groq(api_key=settings.groq_api_key)

        nash_p = req.nash_p
        nash_q = req.nash_q
        game_value = req.game_value
        pure_nash = req.pure_nash
        scenario = req.scenario
        rounds = req.rounds

        briefing_prompt = f"""You are a senior cybersecurity analyst writing an executive briefing on a completed game-theoretic security simulation. Be precise, academic, and strategic.

SIMULATION DATA:
- Scenario: {scenario}
- Rounds simulated: {rounds}
- Game Value (v*): {game_value:.4f}
- Pure Nash Equilibria: {('None (fully mixed game)' if not pure_nash else ', '.join([f"(A{n['row']+1}:{ATTACK_STRATEGIES[n['row']]}, D{n['col']+1}:{DEFENSE_STRATEGIES[n['col']]})" for n in pure_nash]))}

MIXED NASH EQUILIBRIUM:
Attacker mixed strategy sigma*_A:
{chr(10).join([f"  - {ATTACK_STRATEGIES[i]} (A{i+1}): {prob*100:.1f}%" for i, prob in enumerate(nash_p)])}

Defender mixed strategy sigma*_D:
{chr(10).join([f"  - {DEFENSE_STRATEGIES[i]} (D{i+1}): {prob*100:.1f}%" for i, prob in enumerate(nash_q)])}

Write a structured executive security briefing with exactly these 5 sections. Use plain text only (no markdown). Keep each section focused and analytical.

SECTION 1 - EXECUTIVE SUMMARY (3-4 sentences)
SECTION 2 - NASH EQUILIBRIUM INTERPRETATION (4-5 sentences)
SECTION 3 - CRITICAL THREAT VECTORS (4-5 sentences)
SECTION 4 - RECOMMENDED DEFENSE POSTURE (4-5 sentences)
SECTION 5 - STRATEGIC CONCLUSION (3-4 sentences)

Format: Start each section with its title on its own line, then the content. No bullet points, no asterisks."""

        briefing_msg = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=1200,
            messages=[{"role": "user", "content": briefing_prompt}]
        )
        briefing_text = briefing_msg.choices[0].message.content

        dominant_attack = nash_p.index(max(nash_p))
        dominant_defense = nash_q.index(max(nash_q))

        threat_prompt = f"""You are a threat intelligence analyst. Produce a threat assessment in JSON format only. No explanation, no markdown, just valid raw JSON.

Nash game value: {game_value:.4f}
Dominant attacker strategy: {ATTACK_STRATEGIES[dominant_attack]} with probability {nash_p[dominant_attack]*100:.1f}%
Dominant defender strategy: {DEFENSE_STRATEGIES[dominant_defense]} with probability {nash_q[dominant_defense]*100:.1f}%

Return this exact JSON:
{{
  "riskScore": <number 0-100>,
  "riskLabel": "<CRITICAL|HIGH|MEDIUM|LOW>",
  "attackerAdvantage": <number -100 to 100>,
  "convergenceQuality": "<STRONG|MODERATE|WEAK>",
  "primaryThreat": "<one attack strategy name>",
  "primaryMitigation": "<one defense strategy name>",
  "confidenceLevel": <number 0-100>,
  "keyInsight": "<one sentence, max 20 words>"
}}"""

        threat_msg = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=400,
            messages=[{"role": "user", "content": threat_prompt}]
        )
        threat_raw = threat_msg.choices[0].message.content.replace("```json", "").replace("```", "").strip()
        threat_data = json.loads(threat_raw)

        return ReportResult(briefing=briefing_text, threat=threat_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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