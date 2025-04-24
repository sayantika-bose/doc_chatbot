from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import DocumentUploadResponse, ChatRequest, ChatResponse
from api.services.chat_service import ChatService
from api.services.indexer_service import IndexerService

router = APIRouter()

chat_service = ChatService()
indexer_service = IndexerService()

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    try:
        content = await file.read()
        content_text = content.decode("utf-8")
        
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
