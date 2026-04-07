from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Move:
    san: str          # Standard algebraic notation, e.g. "e4"
    number: int       # Move number
    color: str        # "white" or "black"
    fen_before: str   # Board FEN before this move was played


@dataclass
class Game:
    game_id: str
    white: str
    black: str
    pgn: str
    moves: List[Move] = field(default_factory=list)
    winner: Optional[str] = None
    time_control: Optional[str] = None
    date: Optional[str] = None
