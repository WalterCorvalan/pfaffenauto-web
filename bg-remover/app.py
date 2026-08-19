import io
import os

from flask import Flask, request, send_file, jsonify
from PIL import Image
from rembg import remove, new_session

app = Flask(__name__)

API_TOKEN = os.environ.get("API_TOKEN", "")
MODEL_NAME = os.environ.get("REMBG_MODEL", "birefnet-general")

# Free tier de Render tiene 512MB de RAM — procesar una foto a resolución
# completa hace OOM. No hace falta full-res: el compaginado final reduce todo
# a 1600x1067 igual, así que redimensionamos antes de pasarla al modelo.
MAX_LADO = 1400


def redimensionar_si_hace_falta(input_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(input_bytes))
    if max(img.size) <= MAX_LADO:
        return input_bytes
    img.thumbnail((MAX_LADO, MAX_LADO), Image.LANCZOS)
    buffer = io.BytesIO()
    img.convert("RGB").save(buffer, format="JPEG", quality=90)
    return buffer.getvalue()

# Carga perezosa: si el modelo se descarga recién al primer /remove, el puerto
# HTTP abre al instante en el boot (Render mata el deploy si no detecta el
# puerto abierto rápido) — la descarga tarda una sola vez, en la primera foto.
_session = None


def get_session():
    global _session
    if _session is None:
        _session = new_session(MODEL_NAME)
    return _session


@app.route("/health")
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME, "cargado": _session is not None})


@app.route("/remove", methods=["POST"])
def remove_bg():
    if API_TOKEN and request.headers.get("X-Api-Token") != API_TOKEN:
        return jsonify({"error": "unauthorized"}), 401

    file = request.files.get("image_file")
    if not file:
        return jsonify({"error": "no image_file in form-data"}), 400

    input_bytes = redimensionar_si_hace_falta(file.read())
    output_bytes = remove(input_bytes, session=get_session())

    return send_file(io.BytesIO(output_bytes), mimetype="image/png")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
