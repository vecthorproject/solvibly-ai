from flask import Flask
from flask_cors import CORS
from controller import predict

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # To change before release!
app.route('/api/predict', methods=['POST'])(predict)

# --- RUN SERVER ---

if __name__ == '__main__':
    app.run(debug=True, port=5000)
