from fastapi import APIRouter, UploadFile, File, HTTPException
from api.models.schemas import DocumentUploadResponse, ChatRequest, ChatResponse
from api.services.chat_service import ChatService
from api.services.indexer_service import IndexerService
from typing import Dict
import logging
import traceback

# Set up logging configuration
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("router")

router = APIRouter()

chat_service = ChatService()
indexer_service = IndexerService()

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    logger.info(f"Received upload request for file: {file.filename}")
    logger.info(f"File content type: {file.content_type}")
    
    try:
        logger.info("Reading file content...")
        content = await file.read()
        logger.info(f"Read {len(content)} bytes from file")
        
        # Check if file is PDF or text
        if file.filename.lower().endswith('.pdf'):
            logger.info("Processing PDF file")
            content_to_process = content  # Pass bytes directly for PDF
        else:
            # For text files, decode the content
            logger.info("Processing text file")
            try:
                content_to_process = content.decode("utf-8")
            except UnicodeDecodeError:
                content_to_process = content.decode("utf-8", errors="replace")
                logger.info("Decoded text file with replacement characters")
        
        logger.info("Processing document...")
        # Process and index the document
        document_id = await indexer_service.process_document(
            content_to_process,
            metadata={
                "filename": file.filename,
                "content_type": file.content_type
            }
        )
        
        logger.info(f"Document indexed successfully with ID: {document_id}")
        
        return DocumentUploadResponse(
            document_id=document_id,
            message="Document uploaded and indexed successfully"
        )
    except Exception as e:
        # Log the full error for debugging
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        logger.error(f"Error in upload_document: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    logger.info(f"Received chat request for document ID: {request.document_id}")
    logger.info(f"Question: {request.question}")
    
    try:
        logger.info("Calling chat service for response...")
        response = await chat_service.get_response(
            document_id=request.document_id,
            question=request.question
        )
        
        logger.info("Chat response generated successfully")
        
        return ChatResponse(
            answer=response,
            sources=[]  # In a full implementation, you might want to track and return source chunks
        )
    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        logger.error(f"Error in chat endpoint: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health", response_model=Dict[str, str])
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "healthy", "message": "API is up and running"}

@router.get("/documents", response_model=Dict[str, list])
async def list_documents():
    """
    List all documents in the system.
    This is a new endpoint to help frontend fetch all available documents.
    """
    logger.info("List documents endpoint called")
    
    try:
        # Use the collection's metadata to list unique document_ids
        all_metadatas = indexer_service.collection.get()['metadatas']
        document_ids = set()
        documents = []
        
        # Extract unique document_ids and build a document list
        for metadata in all_metadatas:
            if 'document_id' in metadata and metadata['document_id'] not in document_ids:
                document_ids.add(metadata['document_id'])
                doc_info = {
                    'id': metadata['document_id'],
                    'fileName': metadata.get('filename', 'Unknown')
                }
                documents.append(doc_info)
        
        logger.info(f"Found {len(documents)} documents")
        return {"documents": documents}
    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        logger.error(f"Error in list_documents endpoint: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))
