import os
import subprocess
import signal
import sys
import time
import threading

def run_backend():
    """Start the backend server"""
    print("Starting backend server...")
    backend_cmd = ["python", "run_backend_workflow.py"]
    backend_process = subprocess.Popen(backend_cmd)
    return backend_process

def run_frontend():
    """Start the frontend server"""
    print("Starting frontend development server...")
    os.chdir("frontend")
    frontend_cmd = ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
    frontend_process = subprocess.Popen(frontend_cmd)
    os.chdir("..")  # Go back to root
    return frontend_process

def main():
    # Print startup message
    print("\n" + "="*70)
    print(" RAG CHATBOT APPLICATION ".center(70, "="))
    print("="*70)
    print("\nStarting services...")
    
    # Start backend first
    backend_process = run_backend()
    print("Backend starting on http://localhost:8000")
    
    # Wait a moment to let backend initialize
    time.sleep(2)
    
    # Start frontend
    frontend_process = run_frontend()
    print("Frontend starting on http://localhost:5173")
    
    print("\n" + "="*70)
    print(" SERVICES RUNNING ".center(70, "="))
    print("Backend API: http://localhost:8000/api/v1")
    print("Frontend UI: http://localhost:5173")
    print("\nPress Ctrl+C to stop all services")
    print("="*70 + "\n")
    
    # Wait for keyboard interrupt
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down services...")
        
        # Terminate processes
        backend_process.terminate()
        frontend_process.terminate()
        
        # Wait for processes to end
        try:
            backend_process.wait(timeout=5)
            frontend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            print("Force killing services...")
            backend_process.kill()
            frontend_process.kill()
        
        print("All services stopped")

if __name__ == "__main__":
    main()