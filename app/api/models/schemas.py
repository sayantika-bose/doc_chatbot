from pydantic import BaseModel
from typing import List, Optional

class DocumentUploadResponse(BaseModel):
    document_id: str
    message: str

class ChatRequest(BaseModel):
    document_id: str
    question: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

class Document(BaseModel):
    document_id: str
    content: str
    metadata: dict
