import os
import sys
import uvicorn

# Simple script to run the FastAPI backend
if __name__ == "__main__":
    # Add the current directory to the Python path
    project_root = os.path.dirname(os.path.abspath(__file__))
    sys.path.append(project_root)
    
    print("Starting RAG Chatbot Backend")
    print("API URL: http://localhost:8000")
    print("API Health Endpoint: http://localhost:8000/api/v1/health")
    print("\nPress CTRL+C to stop the server\n")
    
    # Run the FastAPI application directly
    uvicorn.run("app.api.main:app", host="0.0.0.0", port=8000, reload=True)