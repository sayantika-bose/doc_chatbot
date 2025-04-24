from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import chromadb
from chromadb.utils import embedding_functions
import uuid
import logging
import os
import traceback
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
        
        try:
            # Initialize ChromaDB client with persistence
            self.client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
            logger.info("ChromaDB client initialized successfully")
            
            # Initialize embeddings
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=settings.GOOGLE_API_KEY,
            )
            logger.info("GoogleGenerativeAIEmbeddings initialized successfully")
            
            # Create or get the collection
            self.collection = self.client.get_or_create_collection(
                name="documents",
                embedding_function=embedding_functions.DefaultEmbeddingFunction()
            )
            logger.info(f"Collection 'documents' created or accessed successfully")
            
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1500,  # Increased from 1000 to 1500
                chunk_overlap=300,  # Increased from 200 to 300
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

    async def process_document(self, content: str, metadata: dict = None) -> str:
        # Generate a unique document ID
        document_id = str(uuid.uuid4())
        logger.info(f"Processing document with ID: {document_id}")
        logger.info(f"Document metadata: {metadata}")
        logger.info(f"Document content length: {len(content)} characters")
        
        try:
            # Split the document into chunks
            chunks = self.text_splitter.split_text(content)
            logger.info(f"Document split into {len(chunks)} chunks")
            
            if len(chunks) == 0:
                logger.warning("Document produced 0 chunks! Content may be empty or invalid.")
                return document_id
            
            # Process all chunks at once
            ids = [f"{document_id}_{i}" for i in range(len(chunks))]
            
            logger.info(f"Generating embeddings for {len(chunks)} chunks...")
            embeddings = []
            for i, chunk in enumerate(chunks):
                try:
                    embedding = await self.embeddings.aembed_query(chunk)
                    embeddings.append(embedding)
                    if i % 5 == 0:  # Log progress every 5 chunks
                        logger.info(f"Generated embeddings for {i+1}/{len(chunks)} chunks")
                except Exception as e:
                    logger.error(f"Error generating embedding for chunk {i}: {str(e)}")
                    # Use a zero embedding as fallback (this is not ideal but prevents complete failure)
                    embeddings.append([0.0] * 768)  # Most embedding models use 768 dimensions
            
            metadatas = [{
                "document_id": document_id,
                "chunk_id": i,
                **(metadata or {})
            } for i in range(len(chunks))]
            
            logger.info(f"Adding {len(chunks)} chunks to ChromaDB...")
            
            # Add documents to ChromaDB
            self.collection.add(
                embeddings=embeddings,
                documents=chunks,
                ids=ids,
                metadatas=metadatas
            )
            
            logger.info(f"Successfully indexed document {document_id} with {len(chunks)} chunks")
            self._log_collection_stats()  # Log updated stats
            
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
