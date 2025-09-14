#!/bin/bash

# Simple script to stop all services
echo "🛑 Stopping Operator Skills Hub..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Stop services
python3 manage_services.py stop

echo "✅ Services stopped!"
