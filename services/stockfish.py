import io
from typing import List

import chess
import chess.engine
import chess.pgn

from config import STOCKFISH_PATH
from models.analysis import MoveAnalysis

DEPTH = 15


def evaluate_game(pgn_text: str) -> List[MoveAnalysis]:
    game = chess.pgn.read_game(io.StringIO(pgn_text))
    if game is None:
        return []

    analyses = []
    with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
        board = game.board()
        move_number = 1
        color = "white"

        for move in game.mainline_moves():
            info = engine.analyse(board, chess.engine.Limit(depth=DEPTH))
            score = _white_score(info)
            best_move_obj = info.get("pv", [None])[0]
            best_move_san = board.san(best_move_obj) if best_move_obj else "?"
            san = board.san(move)

            board.push(move)
            info_after = engine.analyse(board, chess.engine.Limit(depth=DEPTH))
            score_after = _white_score(info_after)

            classification = _classify(score, score_after, color, san == best_move_san)

            analyses.append(MoveAnalysis(
                move=san,
                number=move_number,
                color=color,
                score=score,
                classification=classification,
                best_move=best_move_san,
                explanation="",
                alternatives=[best_move_san] if best_move_san != san else [],
            ))

            if color == "black":
                move_number += 1
            color = "black" if color == "white" else "white"

    return analyses


def _white_score(info: dict) -> float:
    score = info["score"].white()
    if score.is_mate():
        return 10000.0 if (score.mate() or 0) > 0 else -10000.0
    return (score.score() or 0) / 100.0


def _classify(score_before: float, score_after: float, color: str, is_best: bool) -> str:
    if is_best:
        return "best"
    # Delta from the moving side's perspective
    delta = (score_after - score_before) if color == "white" else (score_before - score_after)
    if delta >= -0.1:
        return "good"
    if delta >= -0.5:
        return "inaccuracy"
    if delta >= -1.5:
        return "mistake"
    return "blunder"
