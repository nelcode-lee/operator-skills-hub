#!/bin/bash

# Local development startup script
echo "Starting Operator Skills Hub in LOCAL mode..."

# Install local requirements if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install local requirements
echo "Installing local requirements..."
pip install -r requirements-local.txt

# Start the full application
echo "Starting full application with all features..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
