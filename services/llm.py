"""
LLM service — generates natural language explanations for chess moves.

Provider priority (automatic fallback):
  1. groq          — Llama 3.3 70B, free 43k req/day (primary)
  2. huggingface   — chess-gemma-commentary, chess-specific model (fallback)
  3. gemini        — gemini-2.0-flash, free 1500 req/day (last resort)

Set LLM_PROVIDER in .env to force a specific provider.
"""

import time
import requests

from config import (
    ANTHROPIC_API_KEY,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GROQ_API_KEY,
    GROQ_MODEL,
    HF_TOKEN,
    HF_CHESS_MODEL,
    LLM_PROVIDER,
    OLLAMA_MODEL,
    OLLAMA_URL,
)
from models.analysis import MoveAnalysis

NEEDS_EXPLANATION = {"inaccuracy", "mistake", "blunder", "good", "best"}

# Ordered fallback chain
FALLBACK_CHAIN = ["groq", "huggingface", "gemini"]


def enrich_with_explanations(analyses: list[MoveAnalysis], pgn: str) -> list[MoveAnalysis]:
    for i, analysis in enumerate(analyses):
        if analysis.classification in NEEDS_EXPLANATION:
            partial_pgn = _trim_pgn(pgn, i + 1)
            analysis.explanation = _explain_with_fallback(analysis, partial_pgn)
            print(f"[llm] {analysis.number}. {analysis.color} {analysis.move} "
                  f"({analysis.classification}): {'OK' if analysis.explanation else 'EMPTY'}")
    return analyses


def _explain_with_fallback(analysis: MoveAnalysis, partial_pgn: str) -> str:
    # If a specific provider is forced, use it directly without fallback
    if LLM_PROVIDER not in ("groq", "huggingface", "gemini"):
        try:
            return _call_provider(LLM_PROVIDER, analysis, partial_pgn)
        except Exception as e:
            print(f"[llm] {LLM_PROVIDER} failed: {e}")
            return ""

    # Try each provider in fallback order, starting from the configured one
    start = FALLBACK_CHAIN.index(LLM_PROVIDER) if LLM_PROVIDER in FALLBACK_CHAIN else 0
    for provider in FALLBACK_CHAIN[start:]:
        try:
            result = _call_provider(provider, analysis, partial_pgn)
            if result:
                if provider != LLM_PROVIDER:
                    print(f"[llm] fell back to {provider}")
                return result
        except RateLimitError as e:
            print(f"[llm] {provider} rate limited, trying next provider...")
            continue
        except Exception as e:
            print(f"[llm] {provider} error: {type(e).__name__}: {e}")
            continue
    return ""


class RateLimitError(Exception):
    pass


def _call_provider(provider: str, analysis: MoveAnalysis, partial_pgn: str) -> str:
    if provider == "groq":
        return _groq(_build_prompt(analysis, partial_pgn))
    if provider == "huggingface":
        return _huggingface(analysis)
    if provider == "gemini":
        return _gemini(_build_prompt(analysis, partial_pgn))
    if provider == "anthropic":
        return _anthropic(_build_prompt(analysis, partial_pgn))
    if provider == "ollama":
        return _ollama(_build_prompt(analysis, partial_pgn))
    raise ValueError(f"Unknown provider: {provider}")


def _trim_pgn(pgn: str, up_to_ply: int) -> str:
    lines = pgn.strip().splitlines()
    move_text = ' '.join(l for l in lines if not l.startswith('['))
    tokens, ply = [], 0
    for token in move_text.split():
        tokens.append(token)
        if not token.endswith('.') and not token.startswith('{'):
            ply += 1
            if ply >= up_to_ply:
                break
    return ' '.join(tokens)


def _build_prompt(analysis: MoveAnalysis, partial_pgn: str) -> str:
    cls = analysis.classification

    if cls == "blunder":
        instruction = (
            f"In exactly 1 short sentence, say what went wrong with {analysis.move} "
            f"(what material or positional damage it causes). Example: 'You walked into a fork and lost your queen.'"
        )
    elif cls == "mistake":
        instruction = (
            f"In exactly 1 short sentence, say the concrete problem with {analysis.move}. "
            f"Example: 'This drops a pawn to {analysis.best_move}.'"
        )
    elif cls == "inaccuracy":
        instruction = (
            f"In exactly 1 short sentence, say why {analysis.move} is slightly off. "
            f"Example: 'This move loses a tempo without improving your position.'"
        )
    elif cls == "good":
        instruction = (
            f"In exactly 1 short sentence, say what {analysis.move} achieves. "
            f"Example: 'You're down material, but given the position there wasn't much better.'"
        )
    else:  # best
        instruction = (
            f"In exactly 1 short sentence, explain the key idea of {analysis.move}. "
            f"Example: 'This pawn attacks the knight and forces it off its strong square.'"
        )

    return (
        f"Chess game so far: {partial_pgn}\n"
        f"{analysis.color.capitalize()} played {analysis.move} "
        f"(eval: {analysis.score:+.2f}, classification: {cls}, Stockfish best: {analysis.best_move}).\n\n"
        f"{instruction}\n"
        f"Reply with the single sentence only. No intro, no 'As a coach', no extra sentences."
    )


# ── Groq (primary — 43k req/day free) ────────────────────────────────────────

def _groq(prompt: str) -> str:
    from groq import Groq, RateLimitError as GroqRateLimit
    try:
        client = Groq(api_key=GROQ_API_KEY)
        res = client.chat.completions.create(
            model=GROQ_MODEL,
            max_tokens=80,
            messages=[{"role": "user", "content": prompt}],
        )
        return res.choices[0].message.content.strip()
    except GroqRateLimit:
        raise RateLimitError("Groq rate limit hit")


# ── HuggingFace chess-gemma-commentary (local, unlimited) ────────────────────

# Module-level cache so model loads once and stays in memory
_hf_pipeline = None

def _load_hf_model():
    global _hf_pipeline
    if _hf_pipeline is not None:
        return _hf_pipeline
    from transformers import pipeline
    import torch
    print("[llm] Loading chess-gemma-commentary model into memory (first time only)...")
    device = 0 if torch.cuda.is_available() else -1  # GPU if available, else CPU
    _hf_pipeline = pipeline(
        "text-generation",
        model=HF_CHESS_MODEL,
        device=device,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    )
    print(f"[llm] Model loaded on {'GPU' if device == 0 else 'CPU'}")
    return _hf_pipeline


def _huggingface(analysis: MoveAnalysis) -> str:
    """
    Runs NAKSTStudio/chess-gemma-commentary LOCALLY — no API calls, no limits.
    Model downloads once (~500MB) on first use, then stays cached on disk.
    On CPU: ~5-15s per explanation. On GPU: ~1-2s.
    """
    tag_map = {
        "best": "Best", "good": "Good", "inaccuracy": "Inaccuracy",
        "mistake": "Mistake", "blunder": "Blunder", "brilliant": "Brilliant",
    }

    score_before = analysis.score + 0.3 if analysis.color == "white" else analysis.score - 0.3
    cp_str = f"{score_before:+.0f}->{analysis.score:+.0f} (Δ=0.3)"

    messages = [
        {
            "role": "system",
            "content": (
                "Generate professional chess commentary in the specified language. "
                "Return exactly: Commentary, Predicted ELO, Verified Classification."
            ),
        },
        {
            "role": "user",
            "content": (
                f"LanguageL: English\n"
                f"LangCode: en\n"
                f"Type: explanation\n"
                f"FEN: {getattr(analysis, 'fen_before', 'start')}\n"
                f"MoveSAN: {analysis.move}\n"
                f"Side: {analysis.color.capitalize()}\n"
                f"Actor: human\n"
                f"Gender: neutral\n"
                f"Tag: {tag_map.get(analysis.classification, 'Good')}\n"
                f"BestAlt: {analysis.best_move}\n"
                f"CP: {cp_str}"
            ),
        },
    ]

    pipe = _load_hf_model()
    result = pipe(
        messages,
        max_new_tokens=200,
        temperature=0.7,
        do_sample=True,
    )
    text = result[0]["generated_text"][-1]["content"].strip()

    # Extract just the Commentary line from structured output
    if "Commentary:" in text:
        for line in text.split("\n"):
            if line.startswith("Commentary:"):
                return line.replace("Commentary:", "").strip()
    return text


# ── Gemini (last resort) ──────────────────────────────────────────────────────

def _gemini(prompt: str) -> str:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=GEMINI_API_KEY)
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(max_output_tokens=300, temperature=0.7),
        )
        return response.text.strip()
    except Exception as e:
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            raise RateLimitError(f"Gemini rate limit: {e}")
        raise


# ── Anthropic ─────────────────────────────────────────────────────────────────

def _anthropic(prompt: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
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
