#!/usr/bin/env python3
"""
Railway deployment server runner
Handles port configuration and starts the server
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def main():
    """Main function to start the server"""
    # Get port from environment variable or use default
    port_str = os.environ.get('PORT', '8000')
    
    # Handle Railway's PORT variable properly
    try:
        port = int(port_str)
    except (ValueError, TypeError):
        print(f"⚠️  Invalid PORT value: '{port_str}', using default 8000")
        port = 8000
    
    print(f"🚀 Starting Operator Skills Hub on port {port}")
    print(f"🌍 Environment: {os.environ.get('RAILWAY_ENVIRONMENT', 'development')}")
    print(f"🔧 PORT variable: '{port_str}' -> {port}")
    
    # Import and run the FastAPI app
    try:
        import uvicorn
        from app.main import app
        
        print("✅ FastAPI app imported successfully")
        print(f"🌐 Starting server on http://0.0.0.0:{port}")
        
        # Start the server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            log_level="info",
            access_log=True
        )
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Installing missing dependencies...")
        os.system("pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
