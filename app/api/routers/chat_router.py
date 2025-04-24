from fastapi import APIRouter, UploadFile, File, HTTPException
from api.models.schemas import DocumentUploadResponse, ChatRequest, ChatResponse
from api.services.chat_service import ChatService
from api.services.indexer_service import IndexerService
from typing import Dict

router = APIRouter()

chat_service = ChatService()
indexer_service = IndexerService()

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        # Try different encodings to handle various file types
        try:
            # First try UTF-8
            content_text = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                # If UTF-8 fails, try Latin-1 (which can decode any byte value)
                content_text = content.decode("latin-1")
            except Exception:
                # If all fails, use errors='replace' to substitute invalid characters
                content_text = content.decode("utf-8", errors="replace")
        
        # Process and index the document
        document_id = await indexer_service.process_document(
            content_text,
            metadata={"filename": file.filename}
        )
        
        return DocumentUploadResponse(
            document_id=document_id,
            message="Document uploaded and indexed successfully"
        )
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in upload_document: {error_details}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = await chat_service.get_response(
            document_id=request.document_id,
            question=request.question
        )
        
        return ChatResponse(
            answer=response,
            sources=[]  # In a full implementation, you might want to track and return source chunks
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health", response_model=Dict[str, str])
async def health_check():
    return {"status": "healthy", "message": "API is up and running"}
