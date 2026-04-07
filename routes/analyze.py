from dataclasses import asdict

from flask import Blueprint, jsonify, request

from services.llm import enrich_with_explanations
from services.stockfish import evaluate_game

analyze_bp = Blueprint("analyze", __name__)


@analyze_bp.route("/analyze", methods=["POST"])
def analyze():
    body = request.get_json()
    if not body or "pgn" not in body:
        return jsonify({"error": "pgn is required"}), 400

    pgn = body["pgn"]
    try:
        analyses = evaluate_game(pgn)
        analyses = enrich_with_explanations(analyses, pgn)
        return jsonify([asdict(a) for a in analyses]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
