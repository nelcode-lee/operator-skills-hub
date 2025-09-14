#!/bin/bash

# Simple manual start script for development
echo "🚀 Starting Operator Skills Hub Services Manually..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Kill any existing processes
echo "🔄 Stopping existing services..."
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
sleep 2

# Start backend
echo "🚀 Starting Backend..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
cd ..

# Start frontend
echo "🚀 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
cd ..

# Wait a moment for services to start
sleep 5

# Check if services are running
echo "🔍 Checking service status..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:8000"
else
    echo "❌ Backend failed to start"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend failed to start"
fi

echo ""
echo "🎉 Services started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "To stop services, run: ./simple_stop.sh"
echo "Or kill PIDs: $BACKEND_PID $FRONTEND_PID"
