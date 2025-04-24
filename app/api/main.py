import sys
import os

# Add the project root directory to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import chat_router
import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="RAG Chatbot API")

# Configure CORS
origins = [
    "http://localhost:5000",  # Frontend server
    "http://localhost:3000",
    "*"  # Allow all origins for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router.router, prefix="/api/v1", tags=["chat"])

if __name__ == "__main__":
    uvicorn.run(
        "api.main:app",  # Updated import path since we're in the app directory
        host="0.0.0.0",
        port=8000,
        reload=True
    )
