import io
import os

from flask import Flask, request, send_file, jsonify
from rembg import remove, new_session

app = Flask(__name__)

API_TOKEN = os.environ.get("API_TOKEN", "")
MODEL_NAME = os.environ.get("REMBG_MODEL", "birefnet-general")

session = new_session(MODEL_NAME)


@app.route("/health")
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME})


@app.route("/remove", methods=["POST"])
def remove_bg():
    if API_TOKEN and request.headers.get("X-Api-Token") != API_TOKEN:
        return jsonify({"error": "unauthorized"}), 401

    file = request.files.get("image_file")
    if not file:
        return jsonify({"error": "no image_file in form-data"}), 400

    input_bytes = file.read()
    output_bytes = remove(input_bytes, session=session)

    return send_file(io.BytesIO(output_bytes), mimetype="image/png")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
