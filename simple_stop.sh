#!/bin/bash

# Simple manual stop script
echo "🛑 Stopping Operator Skills Hub Services..."

# Kill processes by name
pkill -f "uvicorn" 2>/dev/null && echo "✅ Backend stopped"
pkill -f "next" 2>/dev/null && echo "✅ Frontend stopped"

# Also kill by port
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

sleep 2
echo "✅ All services stopped"
