from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import chromadb
from chromadb.utils import embedding_functions
import uuid
from api.config.settings import get_settings
from api.config.chroma_settings import CHROMA_PERSIST_DIR

settings = get_settings()

class IndexerService:
    def __init__(self):
        # Initialize ChromaDB client with persistence
        self.client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        
        # Initialize embeddings
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=settings.GOOGLE_API_KEY,
        )
        
        # Create or get the collection
        self.collection = self.client.get_or_create_collection(
            name="documents",
            embedding_function=embedding_functions.DefaultEmbeddingFunction()        )
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )
        
        # Create vector search index if it doesn't exist
        self._ensure_vector_index()
        
    def _ensure_vector_index(self):
        # ChromaDB handles vector indexing automatically
        # This method is kept for compatibility but doesn't need to do anything
        pass

    async def process_document(self, content: str, metadata: dict = None) -> str:
        # Generate a unique document ID
        document_id = str(uuid.uuid4())
        
        # Split the document into chunks
        chunks = self.text_splitter.split_text(content)
        
        # Process all chunks at once
        ids = [f"{document_id}_{i}" for i in range(len(chunks))]
        embeddings = [await self.embeddings.aembed_query(chunk) for chunk in chunks]
        metadatas = [{
            "document_id": document_id,
            "chunk_id": i,
            **(metadata or {})
        } for i in range(len(chunks))]
        
        # Add documents to ChromaDB
        self.collection.add(
            embeddings=embeddings,
            documents=chunks,
            ids=ids,
            metadatas=metadatas
        )
        
        return document_id

    async def get_relevant_chunks(self, query: str, document_id: str, k: int = 3):
        try:
            # Generate embedding for the query
            query_embedding = await self.embeddings.aembed_query(query)
            
            # Search for similar chunks with the document_id filter
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=k,
                where={"document_id": document_id}
            )
            
            # Return the matching documents
            return results['documents'][0] if results['documents'] else []
        except Exception as e:
            print(f"Error in vector search: {str(e)}")
            return []
