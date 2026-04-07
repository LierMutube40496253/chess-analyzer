import requests
from datetime import datetime
from typing import List, Optional

from models.game import Game

CHESS_COM_BASE = "https://api.chess.com/pub"
HEADERS = {"User-Agent": "chess-analyzer/1.0"}


def fetch_recent_games(username: str, limit: int = 10) -> List[Game]:
    now = datetime.utcnow()
    url = f"{CHESS_COM_BASE}/player/{username}/games/{now.year}/{now.month:02d}"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()

    raw_games = response.json().get("games", [])
    games = []
    for raw in raw_games[-limit:]:
        games.append(Game(
            game_id=raw.get("url", "").split("/")[-1],
            white=raw.get("white", {}).get("username", ""),
            black=raw.get("black", {}).get("username", ""),
            pgn=raw.get("pgn", ""),
            winner=_get_winner(raw),
            time_control=raw.get("time_control"),
            date=str(raw.get("end_time", "")),
        ))
    return games


def _get_winner(raw: dict) -> Optional[str]:
    white = raw.get("white", {})
    black = raw.get("black", {})
    if white.get("result") == "win":
        return white.get("username")
    if black.get("result") == "win":
        return black.get("username")
    return None
