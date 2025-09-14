# Service Management Guide

This document explains how to start, stop, and manage the Operator Skills Hub services.

## Quick Start Commands

### Clean Start Commands (Recommended)

```bash
# Start all services with proper logging
./start_clean.sh

# Stop all services  
./stop_clean.sh
```

### Simple Commands (Alternative)

```bash
# Start all services
./simple_start.sh

# Stop all services  
./simple_stop.sh
```

### Advanced Commands

```bash
# Start services with monitoring
./start.sh

# Stop services gracefully
./stop.sh

# Restart services
./restart.sh

# Check service status
./status.sh
```

## Service Details

### Backend (FastAPI)
- **URL**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Process**: uvicorn with auto-reload

### Frontend (Next.js)
- **URL**: http://localhost:3000
- **Process**: npm run dev with hot reload

## Troubleshooting

### Services Won't Start

1. **Backend Issues**:
   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend Issues**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Port Already in Use

If ports 3000 or 8000 are already in use:

```bash
# Kill processes using these ports
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Virtual Environment Issues

If the backend virtual environment is missing:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Manual Process Management

### Check Running Processes
```bash
ps aux | grep -E "(uvicorn|next)"
```

### Kill Specific Processes
```bash
# Kill by name
pkill -f uvicorn
pkill -f next

# Kill by PID (replace with actual PID)
kill -9 <PID>
```

## Development Workflow

1. **Start services**: `./simple_start.sh`
2. **Make changes**: Edit code in your IDE
3. **Auto-reload**: Services automatically reload on changes
4. **Stop services**: `./simple_stop.sh` (when done)

## Production Deployment

For production deployment, use Docker:

```bash
# Build and start with Docker Compose
docker-compose up -d

# Stop services
docker-compose down
```

## Logs and Debugging

### Backend Logs
Backend logs are displayed in the terminal where you started the service.

### Frontend Logs
Frontend logs are displayed in the terminal where you started the service.

### Check Service Health
```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000
```

## Common Issues and Solutions

### 1. 404 Errors on Course Content
- **Cause**: Missing API endpoints
- **Solution**: The `/api/learning/content/{id}/view` endpoint has been added to fix this

### 2. Services Keep Restarting
- **Cause**: Port conflicts or process issues
- **Solution**: Use `./simple_stop.sh` then `./simple_start.sh`

### 3. Virtual Environment Not Found
- **Cause**: Backend venv directory missing
- **Solution**: Create virtual environment as shown above

### 4. Frontend Build Errors
- **Cause**: Node modules missing or outdated
- **Solution**: Run `cd frontend && npm install`

## File Structure

```
OperatorSkillsHub/
├── simple_start.sh          # Simple start script
├── simple_stop.sh           # Simple stop script
├── start.sh                 # Advanced start script
├── stop.sh                  # Advanced stop script
├── restart.sh               # Restart script
├── status.sh                # Status check script
├── manage_services.py       # Python service manager
├── backend/                 # Backend application
│   ├── venv/               # Virtual environment
│   └── app/                # FastAPI application
└── frontend/               # Frontend application
    └── src/                # Next.js application
```

## Support

If you encounter issues:

1. Check this guide first
2. Try the simple start/stop commands
3. Check the logs in the terminal
4. Verify all dependencies are installed
5. Ensure ports 3000 and 8000 are available
