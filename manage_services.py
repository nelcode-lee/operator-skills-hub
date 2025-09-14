#!/usr/bin/env python3
"""
Enhanced Service Manager for Operator Skills Hub
Handles frontend and backend services with proper process management
"""

import os
import sys
import time
import signal
import subprocess
import threading
import json
from pathlib import Path
from typing import Dict, Optional, List
import argparse

class ServiceManager:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root / "backend"
        self.frontend_dir = self.project_root / "frontend"
        self.processes: Dict[str, subprocess.Popen] = {}
        self.running = False
        self.status_file = self.project_root / ".service_status.json"
        
    def load_status(self) -> Dict:
        """Load service status from file"""
        if self.status_file.exists():
            try:
                with open(self.status_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def save_status(self, status: Dict):
        """Save service status to file"""
        with open(self.status_file, 'w') as f:
            json.dump(status, f, indent=2)
    
    def kill_existing_processes(self):
        """Kill any existing processes"""
        print("🔄 Stopping existing services...")
        
        # Kill by port
        for port in [3000, 8000]:
            try:
                subprocess.run(f"lsof -ti:{port} | xargs kill -9", shell=True, check=False)
            except:
                pass
        
        # Kill by process name
        for process_name in ["uvicorn", "next", "node"]:
            try:
                subprocess.run(f"pkill -f {process_name}", shell=True, check=False)
            except:
                pass
        
        time.sleep(2)
        print("✅ Existing processes stopped")
    
    def start_backend(self) -> bool:
        """Start the backend service"""
        try:
            print("🚀 Starting Backend (FastAPI)...")
            
            # Check if virtual environment exists
            venv_path = self.backend_dir / "venv" / "bin" / "uvicorn"
            if not venv_path.exists():
                print("❌ Virtual environment not found. Please run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt")
                return False
            
            # Use shell script to properly activate venv
            cmd = f"cd {self.backend_dir} && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level info"
            
            process = subprocess.Popen(
                cmd,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            self.processes['backend'] = process
            
            # Wait for backend to start
            for i in range(30):  # Wait up to 30 seconds
                if self.check_backend_health():
                    print(f"✅ Backend started successfully on http://localhost:8000")
                    return True
                time.sleep(1)
            
            print("❌ Backend failed to start within 30 seconds")
            return False
            
        except Exception as e:
            print(f"❌ Failed to start backend: {e}")
            return False
    
    def start_frontend(self) -> bool:
        """Start the frontend service"""
        try:
            print("🚀 Starting Frontend (Next.js)...")
            
            cmd = ["npm", "run", "dev"]
            
            process = subprocess.Popen(
                cmd,
                cwd=self.frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            self.processes['frontend'] = process
            
            # Wait for frontend to start
            for i in range(45):  # Wait up to 45 seconds (Next.js takes longer)
                if self.check_frontend_health():
                    print(f"✅ Frontend started successfully on http://localhost:3000")
                    return True
                time.sleep(1)
            
            print("❌ Frontend failed to start within 45 seconds")
            return False
            
        except Exception as e:
            print(f"❌ Failed to start frontend: {e}")
            return False
    
    def check_backend_health(self) -> bool:
        """Check if backend is healthy"""
        try:
            import requests
            response = requests.get("http://localhost:8000/health", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def check_frontend_health(self) -> bool:
        """Check if frontend is healthy"""
        try:
            import requests
            response = requests.get("http://localhost:3000", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def start_services(self, services: List[str] = None):
        """Start specified services or all services"""
        if services is None:
            services = ['backend', 'frontend']
        
        self.kill_existing_processes()
        
        success = True
        if 'backend' in services:
            success &= self.start_backend()
        
        if 'frontend' in services:
            success &= self.start_frontend()
        
        if success:
            self.running = True
            self.save_status({
                'running': True,
                'services': services,
                'started_at': time.time()
            })
            print("\n🎉 All services started successfully!")
            print("📱 Frontend: http://localhost:3000")
            print("🔧 Backend: http://localhost:8000")
            print("📚 API Docs: http://localhost:8000/docs")
            print("\nPress Ctrl+C to stop all services")
        else:
            print("❌ Some services failed to start")
            self.stop_services()
    
    def stop_services(self):
        """Stop all services"""
        print("\n🛑 Stopping services...")
        
        for name, process in self.processes.items():
            if process and process.poll() is None:
                print(f"Stopping {name}...")
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
        
        self.processes.clear()
        self.running = False
        self.save_status({'running': False})
        print("✅ All services stopped")
    
    def restart_services(self, services: List[str] = None):
        """Restart specified services or all services"""
        print("🔄 Restarting services...")
        self.stop_services()
        time.sleep(2)
        self.start_services(services)
    
    def status(self):
        """Show service status"""
        print("📊 Service Status:")
        
        backend_healthy = self.check_backend_health()
        frontend_healthy = self.check_frontend_health()
        
        print(f"Backend:  {'✅ Running' if backend_healthy else '❌ Not running'}")
        print(f"Frontend: {'✅ Running' if frontend_healthy else '❌ Not running'}")
        
        if self.processes:
            print("\nProcesses:")
            for name, process in self.processes.items():
                status = "Running" if process and process.poll() is None else "Stopped"
                print(f"  {name}: {status}")
    
    def monitor_services(self):
        """Monitor services and restart if needed"""
        print("👀 Monitoring services...")
        
        while self.running:
            try:
                # Check backend
                if 'backend' in self.processes:
                    process = self.processes['backend']
                    if process.poll() is not None or not self.check_backend_health():
                        print("⚠️  Backend unhealthy, restarting...")
                        self.restart_services(['backend'])
                
                # Check frontend
                if 'frontend' in self.processes:
                    process = self.processes['frontend']
                    if process.poll() is not None or not self.check_frontend_health():
                        print("⚠️  Frontend unhealthy, restarting...")
                        self.restart_services(['frontend'])
                
                time.sleep(10)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Monitor error: {e}")
                time.sleep(5)
        
        self.stop_services()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    print("\n🛑 Received shutdown signal...")
    manager.stop_services()
    sys.exit(0)

def main():
    parser = argparse.ArgumentParser(description="Manage Operator Skills Hub Services")
    parser.add_argument('action', choices=['start', 'stop', 'restart', 'status', 'monitor'],
                       help='Action to perform')
    parser.add_argument('--services', nargs='+', choices=['backend', 'frontend'],
                       help='Specific services to manage')
    
    args = parser.parse_args()
    
    global manager
    manager = ServiceManager()
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        if args.action == 'start':
            manager.start_services(args.services)
            if args.services is None:  # Start all services
                manager.monitor_services()
        elif args.action == 'stop':
            manager.stop_services()
        elif args.action == 'restart':
            manager.restart_services(args.services)
            if args.services is None:  # Restart all services
                manager.monitor_services()
        elif args.action == 'status':
            manager.status()
        elif args.action == 'monitor':
            manager.monitor_services()
            
    except KeyboardInterrupt:
        manager.stop_services()
    except Exception as e:
        print(f"Error: {e}")
        manager.stop_services()
        sys.exit(1)

if __name__ == "__main__":
    main()
