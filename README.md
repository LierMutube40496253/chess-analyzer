# Chess Analyzer

Analyzes chess.com games move-by-move using Stockfish for evaluation and Claude for natural language explanations.

## Structure

```
chess-analyzer/
├── routes/
│   ├── analyze.py     # POST /analyze
│   ├── games.py       # GET /games/:user
│   └── health.py      # GET /health
├── services/
│   ├── chesscom.py    # Fetch PGN from chess.com
│   ├── stockfish.py   # Evaluate moves with Stockfish
│   └── claude.py      # Generate explanations with Claude
├── models/
│   ├── game.py        # Game, Move dataclasses
│   └── analysis.py    # MoveAnalysis dataclass
├── main.py            # App entrypoint
├── config.py          # Env var configuration
├── requirements.txt
└── .env
```

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Install Stockfish and set the path in `.env`.

3. Add your Anthropic API key to `.env`.

4. Run:
   ```bash
   python main.py
   ```

## API

### `GET /health`
Returns `{ "status": "ok" }`.

### `GET /games/<username>?limit=10`
Fetches recent games for a chess.com user.

### `POST /analyze`
Body: `{ "pgn": "<pgn string>" }`

Returns a list of `MoveAnalysis` objects with Stockfish scores and Claude explanations for mistakes/blunders.
