from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
from urllib.parse import quote_plus
import os
from dotenv import load_dotenv

# Load the environment variables
load_dotenv()

class Settings(BaseSettings):
    # API Keys
    GOOGLE_API_KEY: str = os.getenv('GOOGLE_API_KEY', '')
    
    # MongoDB Settings (if used)
    MONGODB_USERNAME: str = os.getenv('MONGODB_USERNAME', '')
    MONGODB_PASSWORD: str = os.getenv('MONGODB_PASSWORD', '')
    MONGODB_CLUSTER: str = os.getenv('MONGODB_CLUSTER', '')
    MONGODB_DB_NAME: str = os.getenv('MONGODB_DB_NAME', '')
    MONGODB_COLLECTION_NAME: str = os.getenv('MONGODB_COLLECTION_NAME', '')
    
    # API Settings
    API_HOST: str = os.getenv('API_HOST', '0.0.0.0')
    API_PORT: int = int(os.getenv('API_PORT', '8000'))
    VITE_API_URL: str = os.getenv('VITE_API_URL', 'http://localhost:8000/api/v1')
    
    # Debug mode
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'
    
    @property
    def MONGODB_URI(self) -> str:
        username = quote_plus(self.MONGODB_USERNAME)
        password = quote_plus(self.MONGODB_PASSWORD)
        cluster = self.MONGODB_CLUSTER
        db_name = self.MONGODB_DB_NAME
        # Include the database name in the connection string
        connection_string = f"mongodb+srv://{username}:{password}@{cluster}/?retryWrites=true&w=majority"
        print(f"Connecting to MongoDB cluster: {cluster}")  # Debug line
        print(connection_string)
        return connection_string

    # Use model_config as it's the new Pydantic v2 standard
    model_config = {
        "extra": "allow",  # Allow extra fields to be passed
        "env_file": ".env",
        "env_file_encoding": "utf-8"
    }

@lru_cache()
def get_settings() -> Settings:
    return Settings()
