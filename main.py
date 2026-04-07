from flask import Flask
from flask_cors import CORS

from config import DEBUG, PORT
from routes.analyze import analyze_bp
from routes.games import games_bp
from routes.health import health_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(health_bp)
app.register_blueprint(games_bp)
app.register_blueprint(analyze_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
