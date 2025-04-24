import os
import sys
import uvicorn

# Add app directory to the Python path
app_dir = os.path.abspath("app")
if app_dir not in sys.path:
    sys.path.append(app_dir)

if __name__ == "__main__":
    # Start the FastAPI server
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )