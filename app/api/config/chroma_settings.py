import os
from pathlib import Path

# Define the persistent directory for ChromaDB relative to this file
CHROMA_PERSIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db"))

# Ensure the directory exists
os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)

# Print the directory for debugging
print(f"ChromaDB directory: {CHROMA_PERSIST_DIR}")
