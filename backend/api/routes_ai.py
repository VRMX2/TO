from fastapi import APIRouter, HTTPException, Request
from api.schemas import (
    ThreatAnalysisRequest, ThreatAnalysisResult,
    DefenseRecommendationRequest, DefenseRecommendationResult, DefenseRecommendation,
    ReportRequest, ReportResult,
    RoundAdviceRequest, AttackHistoryRequest,
    TacticalAnalysisRequest, TacticalAnalysisResult,
)
from app.security import ai_rate_limiter, client_ip, safe_error_detail
from ai.pattern_recognizer import classify_threat, analyze_attack_history
from ai.defense_agent import recommend_defense, compute_defense_coverage
from app.config import settings
from groq import Groq
import json
from typing import Any, Dict, List

router = APIRouter(prefix="/ai", tags=["AI Engine"])

ATTACK_STRATEGIES = ['SQL Injection', 'DDoS Flood', 'Zero-Day Exploit', 'Phishing APT']
DEFENSE_STRATEGIES = ['Firewall', 'Intrusion Det.', 'Patch System', 'Honey Pot']


def _build_threat_fallback(nash_p: List[float], nash_q: List[float], game_value: float) -> Dict[str, Any]:
    dominant_attack = nash_p.index(max(nash_p)) if nash_p else 0
    dominant_defense = nash_q.index(max(nash_q)) if nash_q else 0
    risk_score = int(max(0, min(100, 55 + (game_value * 7))))
    if risk_score >= 80:
        risk_label = "CRITICAL"
    elif risk_score >= 65:
        risk_label = "HIGH"
    elif risk_score >= 45:
        risk_label = "MEDIUM"
    else:
        risk_label = "LOW"

    return {
        "riskScore": risk_score,
        "riskLabel": risk_label,
        "attackerAdvantage": round(game_value * 10, 2),
        "convergenceQuality": "MODERATE",
        "primaryThreat": ATTACK_STRATEGIES[dominant_attack],
        "primaryMitigation": DEFENSE_STRATEGIES[dominant_defense],
        "confidenceLevel": 72,
        "keyInsight": "Fallback analysis used because AI provider is unavailable.",
    }


def _build_briefing_fallback(
    scenario: str,
    rounds: int,
    game_value: float,
    pure_nash: List[Dict[str, Any]],
    nash_p: List[float],
    nash_q: List[float],
) -> str:
    pure_text = (
        "None (fully mixed game)"
        if not pure_nash
        else ", ".join([f"(A{n['row'] + 1}, D{n['col'] + 1})" for n in pure_nash])
    )
    att_line = ", ".join([f"A{i + 1}={prob * 100:.1f}%" for i, prob in enumerate(nash_p or [])])
    def_line = ", ".join([f"D{i + 1}={prob * 100:.1f}%" for i, prob in enumerate(nash_q or [])])
    return (
        "EXECUTIVE SUMMARY\n"
        f"Scenario {scenario} ran for {rounds} rounds with game value v*={game_value:.4f}. "
        "This fallback briefing is generated locally when AI is unavailable.\n\n"
        "NASH EQUILIBRIUM INTERPRETATION\n"
        f"Pure equilibria: {pure_text}. Mixed attacker strategy: {att_line}. Mixed defender strategy: {def_line}.\n\n"
        "CRITICAL THREAT VECTORS\n"
        "Highest-probability attacker strategies should be treated as top-priority threats in monitoring and hardening.\n\n"
        "RECOMMENDED DEFENSE POSTURE\n"
        "Prioritize defenses with strongest expected response against dominant attack probabilities and continuously recompute equilibrium.\n\n"
        "STRATEGIC CONCLUSION\n"
        "Use this briefing as a baseline and re-run AI-assisted analysis when provider connectivity is restored."
    )


@router.post("/generate-report", response_model=ReportResult)
async def generate_report(req: ReportRequest, request: Request):
    """Generate a full AI executive security briefing using Groq."""
    ai_rate_limiter.check(client_ip(request))
    nash_p = req.nash_p
    nash_q = req.nash_q
    game_value = req.game_value
    pure_nash = req.pure_nash
    scenario = req.scenario
    rounds = req.rounds

    # Keep report button working even without external AI credentials.
    if not settings.groq_api_key:
        return ReportResult(
            briefing=_build_briefing_fallback(scenario, rounds, game_value, pure_nash, nash_p, nash_q),
            threat=_build_threat_fallback(nash_p, nash_q, game_value),
        )

    try:
        client = Groq(api_key=settings.groq_api_key)
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
        return ReportResult(
            briefing=_build_briefing_fallback(scenario, rounds, game_value, pure_nash, nash_p, nash_q),
            threat={**_build_threat_fallback(nash_p, nash_q, game_value), "keyInsight": f"Fallback used after AI error: {str(e)[:120]}"},
        )


@router.post("/round-advice")
async def round_advice(req: RoundAdviceRequest, request: Request):
    """Return tactical AI advice for Simulation page; fallback if provider unavailable."""
    ai_rate_limiter.check(client_ip(request))
    round_num = req.round
    attacker = req.attacker
    defender = req.defender
    payoff = req.payoff
    threat = req.threat
    coverage = req.coverage

    if not settings.groq_api_key:
        text = (
            f"Round {round_num}: {attacker} faced {defender} with payoff {payoff:+.2f}. "
            f"Threat is {threat:.0f}% and defense coverage is {coverage:.0f}%. "
            "Recommendation: reinforce controls mapped to the attacker strategy and rebalance defense toward high-probability responses."
        )
        return {"content": [{"text": text}]}

    try:
        client = Groq(api_key=settings.groq_api_key)
        prompt = (
            "You are a cybersecurity game-theory analyst. "
            f"Round={round_num}, attacker={attacker}, defender={defender}, payoff={payoff:+.2f}, "
            f"threat={threat:.0f}%, coverage={coverage:.0f}%. "
            "Provide 2 concise sentences: what happened and one concrete defender action next round."
        )
        msg = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=180,
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.choices[0].message.content
        return {"content": [{"text": text}]}
    except Exception:
        text = (
            f"Round {round_num}: {attacker} versus {defender} ended at {payoff:+.2f}. "
            "Fallback advice: prioritize mitigation for the most likely attack vector and keep Nash recomputation active."
        )
        return {"content": [{"text": text}]}


@router.post("/tactical-analysis", response_model=TacticalAnalysisResult)
async def tactical_analysis(req: TacticalAnalysisRequest, request: Request):
    """Generate a short tactical analysis using Groq."""
    ai_rate_limiter.check(client_ip(request))
    
    if not settings.groq_api_key:
        fallback = (
            f"Tactical analysis fallback for round {req.match_round}: "
            f"Attacker played {req.attacker_strategy} and Defender played {req.defender_strategy}. "
            f"Payoff is {req.payoff:+.2f}. Threat level is {req.threat_level}% with defense coverage of {req.defense_coverage}%. "
            "Recommendation: continue monitoring and re-balance defense assets matching attacker's highest-probability strategies."
        )
        return TacticalAnalysisResult(analysis=fallback)

    try:
        client = Groq(api_key=settings.groq_api_key)

        history_str = " ".join(
            f"[R{h.get('round', '?')}: {h.get('attName', h.get('att', '?'))} vs {h.get('defName', h.get('def', '?'))} -> {h.get('payoff', 0):+.2f}]"
            for h in req.history[-5:]
        )

        prompt = f"""You are an AI security analyst embedded in a real-time cyber-security game-theory simulation.

Current simulation state (Round {req.match_round}):
- Attacker played: {req.attacker_strategy}
- Defender played: {req.defender_strategy}
- Payoff this round: {req.payoff:+.2f} (positive = attacker wins)
- Threat level: {req.threat_level}%
- Defense coverage: {req.defense_coverage}%
- Recent history: {history_str}

Give a concise 2-3 sentence tactical analysis: what just happened, whether either player deviated from expected optimal game-theoretic play, and one specific recommendation for the defender next round. Be precise. No bullet points."""

        msg = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )
        text = msg.choices[0].message.content
        return TacticalAnalysisResult(analysis=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=safe_error_detail(e))


@router.post("/analyze-threat", response_model=ThreatAnalysisResult)
async def analyze_threat(req: ThreatAnalysisRequest):
    """Classify a threat based on observed indicators."""
    try:
        result = classify_threat(req.indicators)
        return ThreatAnalysisResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=safe_error_detail(e))


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
        raise HTTPException(status_code=500, detail=safe_error_detail(e))


@router.post("/attack-history")
async def analyze_history(req: AttackHistoryRequest):
    """Analyze a list of attack log entries and return trend analysis."""
    try:
        result = analyze_attack_history(req.logs)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=safe_error_detail(e))


@router.get("/defense-coverage")
async def get_defense_coverage(active: str = ""):
    """Calculate defense coverage percentage for active defense IDs (comma-separated)."""
    try:
        active_list = [d.strip() for d in active.split(",") if d.strip()]
        coverage = compute_defense_coverage(active_list)
        return {"coverage": coverage, "active_defenses": active_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=safe_error_detail(e))