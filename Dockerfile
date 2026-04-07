FROM python:3.11-slim

# Install Stockfish from apt (ends up at /usr/games/stockfish)
RUN apt-get update && \
    apt-get install -y --no-install-recommends stockfish && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV STOCKFISH_PATH=/usr/games/stockfish
ENV PORT=5000

EXPOSE 5000

CMD ["python", "main.py"]
