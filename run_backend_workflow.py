import os
import sys
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

try:
    # Load environment variables from .env file if present
    from dotenv import load_dotenv
    load_dotenv()

    # Check if GOOGLE_API_KEY is set
    google_api_key = os.environ.get("GOOGLE_API_KEY")
    if not google_api_key:
        logger.warning("GOOGLE_API_KEY environment variable is not set. The application may not function correctly.")
    else:
        logger.info("GOOGLE_API_KEY is set. Ready to use Google Generative AI.")

    # Import uvicorn separately to run the app
    import uvicorn

    # Start the FastAPI server - import app at runtime to avoid settings issues
    if __name__ == "__main__":
        logger.info("Starting RAG Chatbot backend server on http://0.0.0.0:8000")
        # Run uvicorn directly on the module path, this avoids loading app before runtime
        uvicorn.run("app.api.main:app", host="0.0.0.0", port=8000)
except Exception as e:
    logger.error(f"Error starting the application: {str(e)}")
    import traceback
    logger.error(traceback.format_exc())
    sys.exit(1)