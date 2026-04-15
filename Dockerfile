FROM python:3.11-slim

# Install Stockfish
RUN apt-get update && \
    apt-get install -y --no-install-recommends stockfish && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Use prod requirements — no PyTorch (too large for free tier)
COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

COPY . .

ENV STOCKFISH_PATH=/usr/games/stockfish
ENV PORT=5000
ENV LLM_PROVIDER=groq

EXPOSE 5000

CMD ["python", "main.py"]
