import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { documentService } from "@/services/documentService";
import { Document, DocumentsState } from "@/types";

// Define initial state
const initialState: DocumentsState = {
  documents: [],
  currentDocument: null,
  isUploading: false,
  uploadSuccess: false,
  uploadError: null,
};

// Async thunks
export const uploadDocument = createAsyncThunk(
  "documents/uploadDocument",
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await documentService.uploadDocument(file);
      
      // Create document object
      const document: Document = {
        id: response.documentId,
        fileName: file.name,
      };
      
      return document;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to upload document");
    }
  }
);

export const fetchDocuments = createAsyncThunk(
  "documents/fetchDocuments",
  async (_, { rejectWithValue }) => {
    try {
      // This would normally fetch documents from the API
      // but we'll just return what's in local storage for this example
      const storedDocuments = localStorage.getItem("documents");
      return storedDocuments ? JSON.parse(storedDocuments) : [];
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch documents");
    }
  }
);

// Create slice
const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    resetUploadState: (state) => {
      state.isUploading = false;
      state.uploadSuccess = false;
      state.uploadError = null;
    },
    selectDocument: (state, action: PayloadAction<string>) => {
      state.currentDocument = state.documents.find(doc => doc.id === action.payload) || null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload document
      .addCase(uploadDocument.pending, (state) => {
        state.isUploading = true;
        state.uploadSuccess = false;
        state.uploadError = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        const newDocument = action.payload;
        
        // Add document to documents array if it doesn't exist
        if (!state.documents.find(doc => doc.id === newDocument.id)) {
          state.documents.push(newDocument);
        }
        
        state.currentDocument = newDocument;
        state.isUploading = false;
        state.uploadSuccess = true;
        
        // Save documents to local storage
        localStorage.setItem("documents", JSON.stringify(state.documents));
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadSuccess = false;
        state.uploadError = action.payload as string;
      })
      
      // Fetch documents
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.documents = action.payload;
      });
  },
});

export const { resetUploadState, selectDocument } = documentsSlice.actions;
export default documentsSlice.reducer;
