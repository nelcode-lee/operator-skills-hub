#!/bin/bash

# Script to start and monitor both frontend and backend services
# This ensures services stay running and can be easily restarted

echo "🚀 Starting Operator Skills Hub Services..."

# Function to start backend
start_backend() {
    echo "📡 Starting Backend (FastAPI)..."
    cd /Users/admin/OperatorSkillsHub/backend
    source venv/bin/activate
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend (Next.js)..."
    cd /Users/admin/OperatorSkillsHub/frontend
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
}

# Function to check if service is running
check_service() {
    local pid=$1
    local name=$2
    if ! kill -0 $pid 2>/dev/null; then
        echo "❌ $name (PID: $pid) is not running"
        return 1
    else
        echo "✅ $name (PID: $pid) is running"
        return 0
    fi
}

# Function to restart service
restart_service() {
    local pid=$1
    local name=$2
    echo "🔄 Restarting $name..."
    kill $pid 2>/dev/null
    sleep 2
    if [ "$name" = "Backend" ]; then
        start_backend
    else
        start_frontend
    fi
}

# Start services
start_backend
start_frontend

# Wait a moment for services to start
sleep 5

# Check initial status
echo "🔍 Checking service status..."
check_service $BACKEND_PID "Backend"
check_service $FRONTEND_PID "Frontend"

echo ""
echo "🎉 Services started successfully!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Monitor services
while true; do
    sleep 10
    
    if ! check_service $BACKEND_PID "Backend"; then
        restart_service $BACKEND_PID "Backend"
        BACKEND_PID=$!
    fi
    
    if ! check_service $FRONTEND_PID "Frontend"; then
        restart_service $FRONTEND_PID "Frontend"
        FRONTEND_PID=$!
    fi
done

# Cleanup on exit
trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT TERM
