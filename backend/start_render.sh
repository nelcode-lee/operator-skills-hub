#!/bin/bash

# Render startup script
echo "Starting Operator Skills Hub on Render..."

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Start the application
exec python -m uvicorn app.main_railway:app --host 0.0.0.0 --port $PORT
