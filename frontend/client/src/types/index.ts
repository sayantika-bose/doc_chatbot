// API response types
export interface UploadResponse {
  documentId: string;
}

export interface ChatResponse {
  answer: string;
}

// Application state types
export interface Document {
  id: string;
  fileName: string;
}

export interface Message {
  id: string;
  content: string;
  isUserMessage: boolean;
  documentId: string;
  timestamp: number;
}

export interface ChatState {
  messages: Record<string, Message[]>;
  currentDocumentId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface DocumentsState {
  documents: Document[];
  currentDocument: Document | null;
  isUploading: boolean;
  uploadSuccess: boolean;
  uploadError: string | null;
}

export interface RootState {
  chat: ChatState;
  documents: DocumentsState;
}

// Form types
export interface ChatFormData {
  message: string;
}

// Error types
export interface ApiError {
  message: string;
}
