# syntax=docker/dockerfile:1

FROM python:3.14-slim

LABEL org.opencontainers.image.title="red-de-flujo" \
      org.opencontainers.image.description="Aplicación Flask para generar y visualizar redes de flujo aleatorias"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    FLASK_APP=app.py

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN useradd --create-home --uid 1000 --shell /usr/sbin/nologin appuser
COPY --chown=appuser:appuser . .
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5000/', timeout=3)"]

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
