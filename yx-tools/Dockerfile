FROM python:3.9-slim

WORKDIR /app

# Install system dependencies (curl for healthchecks/downloading)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install Python requirements
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

# Run the application
CMD ["python", "app.py"]
