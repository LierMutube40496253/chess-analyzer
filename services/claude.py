from typing import List

import anthropic

from config import ANTHROPIC_API_KEY
from models.analysis import MoveAnalysis

_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

NEEDS_EXPLANATION = {"inaccuracy", "mistake", "blunder"}


def enrich_with_explanations(analyses: List[MoveAnalysis], pgn: str) -> List[MoveAnalysis]:
    for analysis in analyses:
        if analysis.classification in NEEDS_EXPLANATION:
            analysis.explanation = _explain_move(analysis, pgn)
    return analyses


def _explain_move(analysis: MoveAnalysis, pgn: str) -> str:
    prompt = (
        f"In this chess game, move {analysis.number} by {analysis.color} was "
        f"'{analysis.move}' — classified as a {analysis.classification}. "
        f"The best move was '{analysis.best_move}'. "
        f"In 1-2 sentences, explain why this was a {analysis.classification} "
        f"and what the best move achieves.\n\nPGN: {pgn}"
    )
    try:
        message = _client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text
    except Exception:
        return ""
