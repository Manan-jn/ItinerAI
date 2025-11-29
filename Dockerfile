ARG PYTHON_VERSION=3.13
FROM ghcr.io/astral-sh/uv:python${PYTHON_VERSION}-bookworm-slim AS base

# Keeps Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED=1

# Install build dependencies required for Python packages with native extensions
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency files first for better layer caching
COPY pyproject.toml uv.lock ./

# Install Python dependencies using UV's lock file
RUN uv sync --locked

# Copy all application files
COPY . .

# Pre-download any ML models or files the agent needs
RUN uv run livekit_agent.py download-files

# Run the application
CMD ["uv", "run", "livekit_agent.py", "start"]