#!/bin/bash

# Start Operator Skills Hub in LOCAL mode with full functionality
echo "🚀 Starting Operator Skills Hub in LOCAL mode..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Start backend with full functionality
echo "📦 Starting backend with full functionality..."
cd backend
./start_local.sh &
BACKEND_PID=$!

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "✅ Services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo "Mode: LOCAL (full functionality)"

# Wait for user to stop services
echo "Press Ctrl+C to stop all services"
wait
