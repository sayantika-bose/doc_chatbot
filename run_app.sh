#!/bin/bash

# Start the backend
echo "Starting FastAPI Backend..."
python run_backend.py &
BACKEND_PID=$!

# Wait a moment for the backend to initialize
sleep 2

# Start the frontend
echo "Starting React Frontend..."
./run_frontend.sh &
FRONTEND_PID=$!

# Function to handle the shutdown
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Trap signals to ensure clean shutdown
trap cleanup SIGINT SIGTERM

# Keep the script running
wait