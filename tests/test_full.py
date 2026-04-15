"""
Full backend test suite.
Run: python tests/test_full.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("STOCKFISH_PATH", "C:/Users/lierm/Desktop/stockfish/stockfish-windows-x86-64-avx2.exe")
from dotenv import load_dotenv
load_dotenv()

SAMPLE_PGN = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 4. O-O *"

passed = failed = 0

def ok(msg):   print(f"  PASS  {msg}")
def fail(msg): print(f"  FAIL  {msg}");

def run(name, fn):
    global passed, failed
    print(f"\n[TEST] {name}")
    try:
        fn()
        passed += 1
    except Exception as e:
        import traceback
        print(f"  FAIL  {e}")
        traceback.print_exc()
        failed += 1

# ── 1. Stockfish ──────────────────────────────────────────────────────────────
def test_stockfish():
    from services.stockfish import evaluate_game
    analyses = evaluate_game(SAMPLE_PGN)
    assert len(analyses) > 0, "No analyses returned"
    for a in analyses:
        assert a.classification in ("best","good","inaccuracy","mistake","blunder")
        assert isinstance(a.score, float)
        assert a.move and a.best_move
    ok(f"Stockfish: {len(analyses)} moves analysed")
    for a in analyses:
        print(f"         {a.number}. {a.color:5} {a.move:6} -> {a.classification:10} ({a.score:+.2f}) best={a.best_move}")

# ── 2. Groq API ───────────────────────────────────────────────────────────────
def test_groq():
    from config import GROQ_API_KEY, GROQ_MODEL
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    res = client.chat.completions.create(
        model=GROQ_MODEL, max_tokens=80,
        messages=[{"role":"user","content":"You are a chess coach. In 2 sentences explain why 1.e4 is strong."}],
    )
    text = res.choices[0].message.content.strip()
    assert len(text) > 20
    ok(f"Groq ({len(text)} chars): {text[:120]}")

# ── 3. Fallback chain (Groq -> HF -> Gemini) ─────────────────────────────────
def test_fallback_chain():
    from services.llm import FALLBACK_CHAIN, LLM_PROVIDER
    assert "groq" in FALLBACK_CHAIN
    assert "huggingface" in FALLBACK_CHAIN
    assert "gemini" in FALLBACK_CHAIN
    start = FALLBACK_CHAIN.index(LLM_PROVIDER) if LLM_PROVIDER in FALLBACK_CHAIN else 0
    ok(f"Fallback chain: {FALLBACK_CHAIN[start:]} (starting from '{LLM_PROVIDER}')")

# ── 4. LLM enrichment (real Groq call on one move) ───────────────────────────
def test_llm_enrichment():
    from services.stockfish import evaluate_game
    from services.llm import enrich_with_explanations
    analyses = evaluate_game(SAMPLE_PGN)
    # Only enrich one move to keep the test fast
    single = [analyses[0]]
    enriched = enrich_with_explanations(single, SAMPLE_PGN)
    assert enriched[0].explanation, "Explanation is empty"
    ok(f"LLM explanation ({len(enriched[0].explanation)} chars):")
    print(f"         {enriched[0].explanation[:300]}")

# ── 5. Chess.com API ──────────────────────────────────────────────────────────
def test_chesscom():
    from services.chesscom import fetch_recent_games
    games = fetch_recent_games("hikaru", limit=2)
    assert len(games) > 0, "No games returned"
    assert games[0].pgn, "Game has no PGN"
    ok(f"Chess.com: {len(games)} games for hikaru")
    print(f"         Latest: {games[-1].white} vs {games[-1].black} ({games[-1].time_control})")

# ── 6. Flask routes ───────────────────────────────────────────────────────────
def test_flask_routes():
    from main import app
    c = app.test_client()

    r = c.get("/health")
    assert r.status_code == 200 and r.get_json()["status"] == "ok"
    ok("GET /health -> 200")

    r = c.get("/games/hikaru?limit=2")
    assert r.status_code == 200
    data = r.get_json()
    assert isinstance(data, list) and len(data) > 0
    ok(f"GET /games/hikaru -> {len(data)} games")

    r = c.post("/analyze", json={"pgn": SAMPLE_PGN})
    assert r.status_code == 200, f"Status {r.status_code}: {r.get_data(as_text=True)[:200]}"
    data = r.get_json()
    assert isinstance(data, list) and len(data) > 0
    has_exp = sum(1 for a in data if a.get("explanation"))
    ok(f"POST /analyze -> {len(data)} analyses, {has_exp} with explanations")
    for a in data:
        print(f"         {a['number']}. {a['color']:5} {a['move']:6} {a['classification']:10} exp={'YES' if a.get('explanation') else 'NO'}")

# ── 7. HuggingFace local model ────────────────────────────────────────────────
def test_huggingface_model():
    import torch
    from transformers import pipeline
    ok(f"torch {torch.__version__} loaded, CUDA={torch.cuda.is_available()}")
    print("         Loading chess-gemma-commentary (downloads ~500MB first time)...")
    pipe = pipeline(
        "text-generation",
        model="NAKSTStudio/chess-gemma-commentary",
        device=-1,
        torch_dtype=torch.float32,
    )
    ok("Model loaded into memory")

    messages = [
        {"role": "system", "content": "Generate professional chess commentary. Return: Commentary, Predicted ELO, Verified Classification."},
        {"role": "user", "content": (
            "LanguageL: English\nLangCode: en\nType: explanation\n"
            "FEN: rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1\n"
            "MoveSAN: e4\nSide: White\nActor: human\nGender: neutral\n"
            "Tag: Best\nBestAlt: e2e4\nCP: 0->+0.3 (Delta=0.3)"
        )},
    ]
    result = pipe(messages, max_new_tokens=150, temperature=0.7, do_sample=True)
    text = result[0]["generated_text"][-1]["content"].strip()
    assert len(text) > 10
    ok(f"HF model inference OK ({len(text)} chars):")
    print(f"         {text[:300]}")


if __name__ == "__main__":
    run("Stockfish evaluation",     test_stockfish)
    run("Groq API",                 test_groq)
    run("Fallback chain config",    test_fallback_chain)
    run("LLM enrichment (Groq)",    test_llm_enrichment)
    run("Chess.com API",            test_chesscom)
    run("Flask routes",             test_flask_routes)
    run("HuggingFace local model",  test_huggingface_model)

    print(f"\n{'='*45}")
    print(f"Results: {passed} passed, {failed} failed")
