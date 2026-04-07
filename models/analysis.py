from dataclasses import dataclass, field
from typing import List


@dataclass
class MoveAnalysis:
    move: str
    number: int
    color: str        # "white" or "black"
    score: float      # Centipawn score from white's perspective
    classification: str  # "best", "good", "inaccuracy", "mistake", "blunder"
    best_move: str
    explanation: str
    alternatives: List[str] = field(default_factory=list)
