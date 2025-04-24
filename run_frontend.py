import os
import subprocess
import signal
import sys

# Function to run the frontend
def run_frontend():
    print("Starting frontend server...")
    try:
        # Change to the frontend directory
        os.chdir("frontend")
        # Run the npm dev command
        print("Running npm run dev...")
        subprocess.run(["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Frontend process failed: {e}")
    except KeyboardInterrupt:
        print("Frontend process interrupted")

# Handle signals
def signal_handler(sig, frame):
    print("Stopping frontend process...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

if __name__ == "__main__":
    print("Starting RAG Chatbot Frontend")
    print("Frontend URL: http://localhost:5173")
    print("\nPress CTRL+C to stop the frontend\n")
    
    # Start the frontend
    run_frontend()
    
    print("Frontend stopped.")