#!/bin/bash

# Production deployment startup script
echo "Starting Operator Skills Hub in PRODUCTION mode..."

# Set production environment
export RENDER="true"

# Install production requirements
echo "Installing production requirements..."
pip install -r requirements-production.txt

# Start the unified application
echo "Starting unified application with core features..."
uvicorn app.main_unified:app --host 0.0.0.0 --port ${PORT:-8000}
