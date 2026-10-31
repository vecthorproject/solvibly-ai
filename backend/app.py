import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

load_dotenv()

import archive  # noqa: E402  (needs env loaded first)
import db  # noqa: E402
from controller import predict, upload  # noqa: E402

DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def create_app():
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    app = Flask(__name__)
    # Two PDFs of up to 10 MB each plus form fields.
    app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_UPLOAD_MB", "25")) * 1024 * 1024

    origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",") if o.strip()]
    CORS(app, resources={r"/api/*": {"origins": origins}})

    db.init_db()
    auth_problem = archive.init_auth()
    if auth_problem:
        logging.getLogger(__name__).warning(auth_problem)
    app.register_blueprint(archive.bp)

    app.add_url_rule('/api/predict', view_func=predict, methods=['POST'])
    app.add_url_rule('/api/upload', view_func=upload, methods=['POST'])

    @app.get('/api/health')
    def health():
        return jsonify({"status": "ok"})

    @app.errorhandler(413)
    def too_large(_e):
        limit_mb = app.config["MAX_CONTENT_LENGTH"] // (1024 * 1024)
        return jsonify({"error": f"File troppo grande (massimo {limit_mb} MB in totale)."}), 413

    return app


app = create_app()

# --- RUN SERVER ---

if __name__ == '__main__':
    debug = os.getenv("FLASK_DEBUG", "0").lower() in ("1", "true", "yes")
    app.run(debug=debug, host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "5000")))
