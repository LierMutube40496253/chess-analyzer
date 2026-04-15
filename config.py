import os

from dotenv import load_dotenv

load_dotenv()

# Fix OpenMP conflict between conda and pip torch builds
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
STOCKFISH_PATH: str = os.getenv("STOCKFISH_PATH", "/usr/bin/stockfish")
PORT: int = int(os.getenv("PORT", "5000"))
DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

# LLM provider: "gemini" (free) | "groq" (free) | "anthropic" (paid) | "ollama" (local)
LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
HF_TOKEN: str = os.getenv("HF_TOKEN", "")
HF_CHESS_MODEL: str = "NAKSTStudio/chess-gemma-commentary"
