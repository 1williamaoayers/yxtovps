# Multi-architecture support: linux/amd64, linux/arm/v7
FROM python:3.9-slim

# Metadata labels
LABEL org.opencontainers.image.title="Cloudflare Speedtest Tool"
LABEL org.opencontainers.image.description="Cloudflare CDN IP optimization tool with web management interface"
LABEL org.opencontainers.image.source="https://github.com/1williamaoayers/yxtovps"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Install system dependencies (curl for healthchecks/downloading)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Install Python requirements (separate layer for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ /app/
COPY cloudflare_speedtest.py /app/

# Create data directory for persistence
RUN mkdir -p /app/data

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV TZ=Asia/Shanghai

# Expose port
EXPOSE 2028

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:2028/ || exit 1

# Run the application
CMD ["python", "app.py"]
