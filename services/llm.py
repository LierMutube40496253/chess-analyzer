"""
LLM service — generates natural language explanations for chess moves.

Supported providers (set LLM_PROVIDER in .env):
  gemini    — free tier (1 500 req/day), no setup (default)
  groq      — free tier, Llama 3.3 70B via Groq Cloud
  anthropic — Claude (paid)
  ollama    — fully local model, no API key needed
"""

import requests

from config import (
    ANTHROPIC_API_KEY,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GROQ_API_KEY,
    GROQ_MODEL,
    LLM_PROVIDER,
    OLLAMA_MODEL,
    OLLAMA_URL,
)
from models.analysis import MoveAnalysis

NEEDS_EXPLANATION = {"inaccuracy", "mistake", "blunder"}


def enrich_with_explanations(analyses: list[MoveAnalysis], pgn: str) -> list[MoveAnalysis]:
    for analysis in analyses:
        if analysis.classification in NEEDS_EXPLANATION:
            analysis.explanation = _explain_move(analysis, pgn)
    return analyses


def _build_prompt(analysis: MoveAnalysis, pgn: str) -> str:
    return (
        f"In this chess game, move {analysis.number} by {analysis.color} was "
        f"'{analysis.move}' — classified as a {analysis.classification}. "
        f"The best move was '{analysis.best_move}'. "
        f"In 1-2 sentences, explain why this was a {analysis.classification} "
        f"and what the best move achieves.\n\nPGN: {pgn}"
    )


def _explain_move(analysis: MoveAnalysis, pgn: str) -> str:
    prompt = _build_prompt(analysis, pgn)
    try:
        if LLM_PROVIDER == "gemini":
            return _gemini(prompt)
        if LLM_PROVIDER == "groq":
            return _groq(prompt)
        if LLM_PROVIDER == "anthropic":
            return _anthropic(prompt)
        if LLM_PROVIDER == "ollama":
            return _ollama(prompt)
        return ""
    except Exception as e:
        print(f"[llm] explanation skipped ({LLM_PROVIDER}): {e}")
        return ""


# ── Gemini (free tier — 1 500 req/day) ───────────────────────────────────────

def _gemini(prompt: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(prompt)
    return response.text.strip()


# ── Groq (free tier) ──────────────────────────────────────────────────────────

def _groq(prompt: str) -> str:
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    res = client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}],
    )
    return res.choices[0].message.content.strip()


# ── Anthropic / Claude ────────────────────────────────────────────────────────

def _anthropic(prompt: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


# ── Ollama (local) ────────────────────────────────────────────────────────────

def _ollama(prompt: str) -> str:
    res = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
        timeout=60,
    )
    res.raise_for_status()
    return res.json().get("response", "").strip()
