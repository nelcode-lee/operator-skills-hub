#!/bin/bash

# Health check script for Operator Skills Hub services

echo "🔍 Checking Operator Skills Hub Services..."
echo "=========================================="

# Check Backend
echo -n "📡 Backend (http://localhost:8000): "
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ HEALTHY"
    # Get version info
    VERSION=$(curl -s http://localhost:8000/health | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "   Version: $VERSION"
else
    echo "❌ UNHEALTHY"
fi

# Check Frontend
echo -n "🎨 Frontend (http://localhost:3000): "
if curl -s -I http://localhost:3000 | grep -q "200 OK"; then
    echo "✅ HEALTHY"
else
    echo "❌ UNHEALTHY"
fi

# Check API Authentication
echo -n "🔐 API Authentication: "
if curl -s -X POST http://localhost:8000/api/auth/token \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=john.doe@example.com&password=password123" \
    | grep -q "access_token"; then
    echo "✅ WORKING"
else
    echo "❌ FAILED"
fi

# Check Video Files
echo -n "🎥 Video Files: "
if curl -s -I http://localhost:3000/videos/construction-hero.mp4 | grep -q "200 OK"; then
    echo "✅ WORKING"
else
    echo "❌ FAILED"
fi

echo ""
echo "📊 Service Summary:"
echo "=================="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Test Credentials:"
echo "Email: john.doe@example.com"
echo "Password: password123"
