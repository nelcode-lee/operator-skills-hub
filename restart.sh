#!/bin/bash

# Simple script to restart all services
echo "🔄 Restarting Operator Skills Hub..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo "❌ Backend virtual environment not found!"
    echo "Please run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Install requests in backend venv if not available
backend/venv/bin/python -c "import requests" 2>/dev/null || backend/venv/bin/pip install requests

# Restart services
python3 manage_services.py restart

echo "✅ Services restarted!"
