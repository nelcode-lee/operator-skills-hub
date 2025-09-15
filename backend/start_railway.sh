#!/bin/bash

# Try python3 first, fallback to python
if command -v python3 &> /dev/null; then
    echo "Using python3"
    python3 -m uvicorn app.main_unified:app --host 0.0.0.0 --port ${PORT:-8000}
elif command -v python &> /dev/null; then
    echo "Using python"
    python -m uvicorn app.main_unified:app --host 0.0.0.0 --port ${PORT:-8000}
else
    echo "Error: Neither python nor python3 found"
    exit 1
fi