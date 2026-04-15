# Chess Analyzer

A free, self-hosted chess game analyzer inspired by chess.com's Game Review feature. Load any chess.com game by username, step through every move, and get Stockfish evaluations with natural-language coaching explanations — completely free.

---

## Features

- **Move-by-move analysis** — Stockfish evaluates every move at depth 15
- **Animated board** — pieces slide smoothly between squares (powered by chessground, the same engine chess.com/lichess use)
- **Chess.com-style visuals** — colored square highlights and badges per move classification:
  - 🟥 **Blunder (??)** — red highlight + green arrow to the correct move
  - 🟧 **Mistake (?)** — orange highlight + green arrow
  - 🟨 **Inaccuracy (?!)** — yellow highlight + green arrow
  - 🟩 **Good (✓)** — light green highlight
  - 🌟 **Best (★)** — green highlight, no arrow needed
- **Coach card** — concise 1-sentence explanation per move
- **Evaluation bar & graph** — visual advantage tracking across the whole game
- **Accuracy scores** — overall accuracy percentage for both players
- **chess.com game import** — fetch recent games directly by username, no PGN copy-paste needed

---

## How It Works

```
chess.com API
     ↓
   PGN
     ↓
Flask backend → Stockfish (depth 15) → classifies each move
                     ↓
             LLM (HuggingFace / Groq / Gemini fallback)
                     ↓
              JSON analysis results
                     ↓
         React frontend (chessground board)
```

1. You enter a chess.com username and pick a game
2. The PGN is sent to the Flask backend
3. Stockfish analyses every position and classifies each move (best / good / inaccuracy / mistake / blunder)
4. An LLM generates a short coaching comment for each move
5. The frontend renders the animated board with highlights, arrows, and the coach panel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, Flask |
| Chess engine | Stockfish (depth 15) |
| LLM (primary) | HuggingFace `NAKSTStudio/chess-gemma-commentary` (local, free, unlimited) |
| LLM (fallback 1) | Groq — Llama 3.3 70B (43k req/day free) |
| LLM (fallback 2) | Gemini 2.0 Flash (1500 req/day free) |
| Frontend | React 19 + Vite |
| Chess board | chessground (same library as chess.com and lichess) |
| PGN parsing | chess.js |
| Evaluation graph | Recharts |
| Mobile (planned) | Expo / React Native |

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- [Stockfish](https://stockfishchess.org/download/) binary
- [miniforge](https://github.com/conda-forge/miniforge) (recommended on Windows — avoids PyTorch DLL conflicts)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/chess-analyzer.git
cd chess-analyzer
```

### 2. Backend

```bash
# Create and activate conda environment
conda create -n chess python=3.11
conda activate chess

# Install PyTorch via conda (important on Windows — avoids DLL conflicts)
conda install pytorch cpuonly -c pytorch

# Install remaining dependencies
pip install -r requirements.txt
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
STOCKFISH_PATH=C:/path/to/stockfish.exe   # path to your Stockfish binary
LLM_PROVIDER=huggingface                  # huggingface | groq | gemini
GROQ_API_KEY=your_key_here                # optional — get free at console.groq.com
GEMINI_API_KEY=your_key_here              # optional — get free at aistudio.google.com
```

**Getting API keys (all free):**
- **Groq** — [console.groq.com](https://console.groq.com) → Create API key (43,000 req/day free)
- **Gemini** — [aistudio.google.com](https://aistudio.google.com) → Get API key (1,500 req/day free)
- **Stockfish** — [stockfishchess.org/download](https://stockfishchess.org/download/)

> The HuggingFace model runs entirely locally — no API key needed. It downloads automatically (~500MB) on first use.

### 4. Frontend

```bash
cd frontend
npm install
```

---

## Running Locally

**Terminal 1 — Backend:**
```bash
conda activate chess
python main.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## LLM Provider Priority

The app uses a fallback chain so it always works even if one provider is down or rate-limited:

```
HuggingFace (local, unlimited)
    ↓ if unavailable
Groq (43k req/day free)
    ↓ if rate limited
Gemini (1500 req/day free)
```

Set `LLM_PROVIDER` in `.env` to control which provider is tried first.

---

## Project Structure

```
chess-analyzer/
├── main.py                 # Flask app entry point
├── config.py               # Environment variable loading
├── requirements.txt
├── .env.example
├── Dockerfile              # For deployment on Render
├── render.yaml             # Render.com deployment config
│
├── routes/
│   ├── analyze.py          # POST /analyze — runs Stockfish + LLM
│   ├── games.py            # GET /games/:username — fetches from chess.com
│   └── health.py           # GET /health
│
├── services/
│   ├── stockfish.py        # Stockfish engine wrapper + move classification
│   └── llm.py              # LLM fallback chain (HuggingFace / Groq / Gemini)
│
├── models/
│   └── analysis.py         # MoveAnalysis dataclass
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ChessgroundBoard.jsx  # Animated board (chessground wrapper)
│   │   │   ├── CoachCard.jsx         # Move explanation panel
│   │   │   ├── EvalBar.jsx           # Vertical evaluation bar
│   │   │   ├── EvalGraph.jsx         # Evaluation graph
│   │   │   ├── Controls.jsx          # Navigation buttons (⏮ ◀ ▶ ⏭)
│   │   │   ├── GameLoader.jsx        # Username input + game list
│   │   │   └── PlayerCard.jsx        # Player name + accuracy badge
│   │   └── utils/
│   │       └── chess.js              # PGN parsing, FEN utils, classification colors
│   └── package.json
│
├── mobile/                 # Expo React Native app (planned)
│   └── App.tsx
│
└── tests/
    └── test_full.py
```

---

## Move Classification Thresholds

| Classification | Centipawn loss | Visual |
|---|---|---|
| Best | 0 – 10 cp | Green highlight, ★ |
| Good | 10 – 30 cp | Light green, ✓ |
| Inaccuracy | 30 – 100 cp | Yellow highlight, ?! |
| Mistake | 100 – 300 cp | Orange highlight, ? |
| Blunder | 300+ cp | Red highlight, ?? |

---

## Running Tests

```bash
conda activate chess
python -m pytest tests/test_full.py -v
```

---

## Deployment

The backend deploys to [Render.com](https://render.com) free tier using the included `Dockerfile` and `render.yaml`. The planned mobile app points to the deployed backend URL set in `mobile/src/config.ts`.

---

## License

MIT
