# ---- Base image ----
# Every Dockerfile starts FROM an existing image rather than an empty
# machine. "python:3.11-slim" is an official image that already has
# Python 3.11 installed on a minimal (slim = smaller download, fewer
# extras) Debian Linux base. Matches your requirements.txt, which was
# built against modern package versions compatible with 3.11+.
FROM python:3.11-slim

# ---- Working directory ----
# Sets the "current folder" for every instruction below, INSIDE the
# container's own filesystem (this has nothing to do with folders on
# your Windows machine). Everything from here on happens inside /app.
WORKDIR /app

# ---- System-level dependencies ----
# psycopg2-binary usually doesn't need this, but some of your other
# packages (cryptography, bcrypt) compile native code during install
# and need a C compiler present. Installing this now, before copying
# your actual code, means Docker can cache this expensive step and
# skip it on every future rebuild unless requirements.txt itself
# changes.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# ---- Install Python dependencies ----
# Copying ONLY requirements.txt first (not your whole app) is
# deliberate: Docker caches each instruction as a "layer". If your
# app code changes but requirements.txt doesn't, Docker reuses the
# cached "pip install" layer instead of redownloading every package
# from scratch — this is what makes rebuilds fast in day-to-day use.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- Copy application code ----
# Now that dependencies are installed and cached, copy your actual
# FastAPI app in. This is the layer that changes most often, which is
# exactly why it's placed LAST — Docker only re-runs steps from here
# down when your code changes, not the expensive pip install above it.
COPY app/ ./app/

# ---- Expose the port ----
# Documents that this container listens on port 8000. This line is
# informational for humans/tools reading the Dockerfile — it does NOT
# actually publish the port to your machine. That happens separately,
# in docker-compose.yml.
EXPOSE 8000

# ---- Start command ----
# What actually runs when the container starts. --host 0.0.0.0 is
# required here (not optional) — 127.0.0.1 would only accept
# connections from inside the container itself, making it unreachable
# from outside. No --reload here, unlike your local dev command:
# --reload is a development convenience that watches for file changes,
# which has no purpose in a built container image.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]