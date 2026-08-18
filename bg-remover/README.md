# Removedor de fondo (rembg) — self-hosted

Reemplaza remove.bg. Recorta el auto (fondo transparente); el compaginado con el
fondo de estudio lo sigue haciendo `lib/removeBg.ts` en el proyecto Next.js.

## Deploy en Render

1. render.com → New → Web Service → conectar este repo de GitHub.
2. **Root Directory**: `bg-remover`
3. **Runtime**: Python 3
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 180 --workers 1`
6. **Environment Variables**:
   - `API_TOKEN`: un texto random largo (protege el endpoint, evita que cualquiera lo use gratis)
   - `REMBG_MODEL`: `birefnet-general` (default, mejor calidad de recorte — mismo modelo que usa BGBye). Es más pesado y lento en CPU que `isnet-general-use` o `u2net`; si en el plan free de Render se hace muy lento o se queda sin memoria, bajar a `isnet-general-use` (más liviano, calidad todavía buena para autos).
7. Plan Free sirve para arrancar — se "duerme" a los 15 min sin uso, la primera request después tarda ~30-50s (carga el modelo). Si eso molesta en producción, pasar a un plan pago (~$7/mes) que no duerme.
8. Al terminar el deploy, copiar la URL pública (`https://tu-servicio.onrender.com`) y cargarla en `.env.local` del proyecto principal como `BG_REMOVER_URL`, junto con `BG_REMOVER_TOKEN` = el mismo valor de `API_TOKEN`.

## Probar local

```bash
cd bg-remover
pip install -r requirements.txt
python app.py
# POST http://localhost:5000/remove con form-data "image_file"
```
