#!/bin/bash

# Railway deployment startup script
echo "🚀 Starting Operator Skills Hub on Railway"

# Debug environment variables
echo "🔧 Environment variables:"
echo "PORT: '$PORT'"
echo "RAILWAY_ENVIRONMENT: '$RAILWAY_ENVIRONMENT'"

# Set default port if PORT is not set or invalid
if [ -z "$PORT" ] || [ "$PORT" = "\$PORT" ] || [ "$PORT" = '$PORT' ]; then
    echo "⚠️  PORT variable not set or invalid, using default 8000"
    export PORT=8000
fi

# Convert PORT to integer to ensure it's valid
PORT_NUM=$(echo "$PORT" | grep -E '^[0-9]+$' || echo "8000")
if [ "$PORT_NUM" != "$PORT" ]; then
    echo "⚠️  Invalid PORT value '$PORT', using 8000"
    export PORT=8000
fi

echo "🌐 Starting server on port $PORT"

# Start the Python server
exec python run_server.py
