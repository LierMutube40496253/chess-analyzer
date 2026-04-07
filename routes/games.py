from dataclasses import asdict

from flask import Blueprint, jsonify, request

from services.chesscom import fetch_recent_games

games_bp = Blueprint("games", __name__)


@games_bp.route("/games/<username>", methods=["GET"])
def get_games(username: str):
    limit = request.args.get("limit", 10, type=int)
    try:
        games = fetch_recent_games(username, limit=limit)
        return jsonify([asdict(g) for g in games]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
