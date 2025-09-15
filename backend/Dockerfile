FROM python:3.11-slim

WORKDIR /app

# Install system dependencies in one layer
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create python symlink for compatibility
RUN ln -s /usr/local/bin/python3 /usr/local/bin/python

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip cache purge

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start command - use simplified main for Railway
CMD ["python", "-m", "uvicorn", "app.main_railway:app", "--host", "0.0.0.0", "--port", "8000"]