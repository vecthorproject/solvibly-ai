from flask import Flask, jsonify
from flask_cors import CORS

# 2. Create the Flask app instance
app = Flask(__name__)

# 3. Enable CORS to allow requests from the frontend
CORS(app)

# 4. Define a test route/endpoint
@app.route('/api/test', methods=['GET'])
def test_connection():
    # This function runs when the endpoint is accessed
    return jsonify({'message': 'Backend server is running correctly!'})

# 5. Run the server when the script is executed
if __name__ == '__main__':
    app.run(debug=True, port=5000)
    