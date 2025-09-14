#!/bin/bash

# Simple script to check service status
echo "📊 Checking Operator Skills Hub Status..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Install requests if not available
python3 -c "import requests" 2>/dev/null || pip3 install requests

# Check status
python3 manage_services.py status
