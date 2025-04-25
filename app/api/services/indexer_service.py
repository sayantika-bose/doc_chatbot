from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import chromadb
from chromadb.utils import embedding_functions
from chromadb.config import Settings as ChromaSettings
import uuid
import logging
import os
import traceback
from io import BytesIO
from PyPDF2 import PdfReader
from api.config.settings import get_settings
from api.config.chroma_settings import CHROMA_PERSIST_DIR

# Set up logging configuration
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("IndexerService")

settings = get_settings()

class IndexerService:
    def __init__(self):
        logger.info(f"Initializing IndexerService with persistence directory: {CHROMA_PERSIST_DIR}")
        
        # Create the persistence directory if it doesn't exist
        os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
        
        try:            # Initialize ChromaDB client with persistence
            self.client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
            logger.info("ChromaDB client initialized successfully")
            
            # Initialize embeddings
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=settings.GOOGLE_API_KEY,
            )
            logger.info("GoogleGenerativeAIEmbeddings initialized successfully")
            
            # Create or get the collection
            self.collection = self.client.get_or_create_collection(name="documents")
            logger.info(f"Collection 'documents' created or accessed successfully")
            
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1500,
                chunk_overlap=300,
            )
            logger.info("Text splitter initialized with chunk_size=1500, chunk_overlap=300")
            
            # Check existing collection stats
            self._log_collection_stats()
            
        except Exception as e:
            logger.error(f"Error initializing IndexerService: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
    def _ensure_vector_index(self):
        logger.info("ChromaDB handles vector indexing automatically")
        
    def _log_collection_stats(self):
        """Log statistics about the current collection"""
        try:
            # Get all document IDs to count them
            all_ids = self.collection.get()['ids']
            unique_doc_ids = set()
            
            # Extract the document_id part from each ID (before the underscore)
            for id in all_ids:
                if '_' in id:
                    doc_id = id.split('_')[0]
                    unique_doc_ids.add(doc_id)
            
            logger.info(f"Collection contains {len(all_ids)} total chunks")
            logger.info(f"Collection contains {len(unique_doc_ids)} unique documents")
            
        except Exception as e:
            logger.error(f"Error getting collection stats: {str(e)}")

    def _clean_document_content(self, content: str) -> str:
        """Clean document content by removing common PDF artifacts and noise."""
        if not content:
            return ""
            
        # Basic cleaning: remove extra whitespace and normalize line endings
        content = " ".join(content.split())
        return content.strip()

    async def process_document(self, file_content, metadata: dict = None) -> str:
        """
        Process a document and index its content.
        Args:
            file_content: Either bytes (for PDFs) or string (for text)
            metadata (dict): Optional metadata for the document
        Returns:
            str: Document ID
        """
        try:
            # Generate a unique document ID
            document_id = str(uuid.uuid4())
            
            # Extract text based on content type
            if isinstance(file_content, bytes) and metadata.get("filename", "").lower().endswith(".pdf"):
                logger.info("Processing PDF document")
                pdf_reader = PdfReader(BytesIO(file_content))
                text_content = ""
                for page in pdf_reader.pages:
                    text_content += page.extract_text() + "\n"
            else:
                logger.info("Processing text document")
                text_content = file_content if isinstance(file_content, str) else file_content.decode('utf-8')

            # Clean the content
            text_content = self._clean_document_content(text_content)
            
            if not text_content.strip():
                raise ValueError("No text content could be extracted from the document")

            # Split text into chunks
            chunks = self.text_splitter.split_text(text_content)
            logger.info(f"Split document into {len(chunks)} chunks")

            # Prepare chunks for indexing
            chunk_ids = [f"{document_id}_{i}" for i in range(len(chunks))]
            
            # Add metadata to each chunk
            chunk_metadata = []
            for _ in chunks:
                chunk_meta = metadata.copy() if metadata else {}
                chunk_meta["document_id"] = document_id
                chunk_metadata.append(chunk_meta)

            # Index the chunks
            embeddings = [self.embeddings.embed_query(chunk) for chunk in chunks]
            
            self.collection.add(
                ids=chunk_ids,
                embeddings=embeddings,
                documents=chunks,
                metadatas=chunk_metadata
            )
            
            logger.info(f"Successfully indexed document with ID: {document_id}")
            return document_id

        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    async def get_relevant_chunks(self, query: str, document_id: str, k: int = 150):
        """
        Retrieve relevant chunks from a document for a given query.
        
        Args:
            query: The user's question
            document_id: The ID of the document to search within
            k: The number of chunks to retrieve (increased to 150 by default)
            
        Returns:
            A list of text chunks related to the query
        """
        logger.info(f"Searching for relevant chunks for query: '{query}'")
        logger.info(f"Document ID filter: {document_id}, k={k}")
        
        try:
            # Generate embedding for the query
            logger.info("Generating embedding for query...")
            query_embedding = await self.embeddings.aembed_query(query)
            
            # Search for similar chunks with the document_id filter
            logger.info("Executing similarity search with document_id filter...")
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=k,
                where={"document_id": document_id}
            )
            
            # Log the results
            num_results = len(results['documents'][0]) if results['documents'] and len(results['documents']) > 0 else 0
            logger.info(f"Search returned {num_results} results")
            
            if num_results == 0:
                logger.warning(f"No chunks found for document_id={document_id}. Verify the document exists.")
                # Double-check if the document exists in the collection
                all_metadatas = self.collection.get()['metadatas']
                matching_docs = [m for m in all_metadatas if m.get('document_id') == document_id]
                if not matching_docs:
                    logger.error(f"Document ID {document_id} not found in collection!")
                else:
                    logger.info(f"Document ID {document_id} exists with {len(matching_docs)} chunks, but none matched the query")
            
            # Return the matching documents
            return results['documents'][0] if results['documents'] and len(results['documents']) > 0 else []
            
        except Exception as e:
            logger.error(f"Error in vector search: {str(e)}")
            logger.error(traceback.format_exc())
            return []
