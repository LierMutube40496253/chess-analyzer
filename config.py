import os

from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
STOCKFISH_PATH: str = os.getenv("STOCKFISH_PATH", "/usr/bin/stockfish")
PORT: int = int(os.getenv("PORT", "5000"))
DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

# LLM provider: "gemini" (free) | "groq" (free) | "anthropic" (paid) | "ollama" (local)
LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
