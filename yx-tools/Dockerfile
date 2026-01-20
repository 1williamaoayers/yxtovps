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
    apt-get install -y --no-install-recommends curl tar && \
    rm -rf /var/lib/apt/lists/*

# Download CloudflareST binary based on architecture
RUN ARCH=$(dpkg --print-architecture) && \
    echo "Detected architecture: $ARCH" && \
    if [ "$ARCH" = "amd64" ]; then \
        CLOUDFLARE_ST_URL="https://github.com/byJoey/CloudflareSpeedTest/releases/download/v1.0/CloudflareST_proxy_linux_amd64.tar.gz"; \
        CLOUDFLARE_ST_NAME="CloudflareST_proxy_linux_amd64"; \
    elif [ "$ARCH" = "armhf" ] || [ "$ARCH" = "arm" ]; then \
        CLOUDFLARE_ST_URL="https://github.com/byJoey/CloudflareSpeedTest/releases/download/v1.0/CloudflareST_proxy_linux_arm.tar.gz"; \
        CLOUDFLARE_ST_NAME="CloudflareST_proxy_linux_arm"; \
    elif [ "$ARCH" = "arm64" ]; then \
        CLOUDFLARE_ST_URL="https://github.com/byJoey/CloudflareSpeedTest/releases/download/v1.0/CloudflareST_proxy_linux_arm64.tar.gz"; \
        CLOUDFLARE_ST_NAME="CloudflareST_proxy_linux_arm64"; \
    else \
        echo "Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    echo "Downloading CloudflareST from: $CLOUDFLARE_ST_URL" && \
    echo "Target binary name: $CLOUDFLARE_ST_NAME" && \
    curl -L -o /tmp/cloudflare_st.tar.gz "$CLOUDFLARE_ST_URL" && \
    echo "Download complete, extracting..." && \
    mkdir -p /tmp/cloudflare_st && \
    tar -xzf /tmp/cloudflare_st.tar.gz -C /tmp/cloudflare_st && \
    echo "Extracted files:" && \
    ls -la /tmp/cloudflare_st/ && \
    find /tmp/cloudflare_st -type f -name "CloudflareST_proxy_*" -exec mv {} /app/$CLOUDFLARE_ST_NAME \; && \
    if [ ! -f /app/$CLOUDFLARE_ST_NAME ]; then \
        echo "ERROR: Binary not found after extraction, trying alternative extraction..." && \
        find /tmp/cloudflare_st -type f ! -name "*.txt" ! -name "*.md" -exec mv {} /app/$CLOUDFLARE_ST_NAME \; ; \
    fi && \
    chmod +x /app/$CLOUDFLARE_ST_NAME && \
    rm -rf /tmp/cloudflare_st.tar.gz /tmp/cloudflare_st && \
    ls -lh /app/$CLOUDFLARE_ST_NAME && \
    echo "✓ CloudflareST binary installed successfully: $CLOUDFLARE_ST_NAME"

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
