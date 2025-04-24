import os
from pathlib import Path

# Define the persistent directory for ChromaDB
CHROMA_PERSIST_DIR = os.path.join(Path.home(), ".chroma_db")

# Ensure the directory exists
os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
