import os
import subprocess
import signal
import sys
import threading
import time

# Global variables to track child processes
frontend_process = None
backend_process = None

# Function to run the backend
def run_backend():
    global backend_process
    print("Starting backend server...")
    try:
        # Run the backend using run_backend_workflow.py
        backend_process = subprocess.Popen(["python", "run_backend_workflow.py"])
        print("Backend server started successfully!")
    except Exception as e:
        print(f"Backend process failed: {e}")

# Function to run the frontend
def run_frontend():
    global frontend_process
    print("Starting frontend server...")
    try:
        # Change to the frontend directory and start the frontend
        os.chdir("frontend")
        frontend_process = subprocess.Popen(["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"])
        # Change back to the root directory
        os.chdir("..")
        print("Frontend server started successfully!")
    except Exception as e:
        print(f"Frontend process failed: {e}")

# Handle signals for graceful shutdown
def signal_handler(sig, frame):
    print("Stopping servers...")
    
    # Stop the frontend process
    if frontend_process:
        frontend_process.terminate()
        try:
            frontend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            frontend_process.kill()
    
    # Stop the backend process
    if backend_process:
        backend_process.terminate()
        try:
            backend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_process.kill()
    
    print("Servers stopped.")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

if __name__ == "__main__":
    print("Starting RAG Chatbot Application")
    print("Backend URL: http://localhost:8000")
    print("Frontend URL: http://localhost:5173")
    print("\nPress CTRL+C to stop all servers\n")
    
    # Start the backend
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Wait a bit for the backend to start before starting the frontend
    time.sleep(2)
    
    # Start the frontend
    frontend_thread = threading.Thread(target=run_frontend)
    frontend_thread.daemon = True
    frontend_thread.start()
    
    # Keep the main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)