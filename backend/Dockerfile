# Search API (FastAPI) over the discovery package.
FROM python:3.12-slim

ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1 PYTHONUNBUFFERED=1
WORKDIR /app

# CPU-only PyTorch first, so sentence-transformers doesn't pull the multi-GB CUDA build.
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu
COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY pyproject.toml ./
COPY src ./src
COPY config ./config
COPY eval ./eval
RUN pip install --no-deps -e . && mkdir -p data/raw data/processed data/index

RUN useradd --create-home --uid 1001 app && chown -R app /app/data
USER app

EXPOSE 8000
HEALTHCHECK --interval=60s --timeout=10s --start-period=20s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')"
CMD ["uvicorn", "discovery.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
