import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { chatService } from "@/services/chatService";
import { ChatState, Message } from "@/types";

// Define initial state
const initialState: ChatState = {
  messages: {},
  currentDocumentId: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (
    { documentId, question }: { documentId: string; question: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      if (!documentId) {
        return rejectWithValue("No document selected. Please select a document first.");
      }

      console.log(`Sending message to chat service with document_id: ${documentId}`);

      // Create user message
      const userMessage: Message = {
        id: nanoid(),
        content: question,
        isUserMessage: true,
        documentId,
        timestamp: Date.now(),
      };

      try {
        // Send message to API
        const response = await chatService.sendMessage(documentId, question);
        
        // Log successful response
        console.log("Chat response received:", response);

        // Create AI message
        const aiMessage: Message = {
          id: nanoid(),
          content: response.answer || "Sorry, I couldn't generate a response.",
          isUserMessage: false,
          documentId,
          timestamp: Date.now(),
        };

        // Return only the AI message since the user message is already added by addUserMessage
        return { aiMessage, documentId };
      } catch (apiError: any) {
        console.error("API error in sendMessage:", apiError);
        
        // Create error message to show in the chat
        const errorMessage: Message = {
          id: nanoid(),
          content: "I'm sorry, I'm unable to answer this question at the moment. Please try again later.",
          isUserMessage: false,
          documentId,
          timestamp: Date.now(),
        };
        
        // Return only the AI error message since the user message is already added by addUserMessage
        return { aiMessage: errorMessage, documentId };
      }
    } catch (error) {
      if (error instanceof Error) {
        // Provide more helpful error message to the user
        let errorMessage = error.message;
        if (errorMessage.includes("document_id")) {
          errorMessage = "There's an issue with the document ID format. Please try selecting a different document.";
        } else if (errorMessage.toLowerCase().includes("network") || errorMessage.includes("fetch")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        }
        
        console.error("Error in sendMessage thunk:", error);
        return rejectWithValue(errorMessage);
      }
      return rejectWithValue("Failed to send message. Please try again later.");
    }
  }
);

// Create slice
const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentDocumentId: (state, action: PayloadAction<string>) => {
      state.currentDocumentId = action.payload;
    },
    clearErrorMessage: (state) => {
      state.error = null;
    },
    clearChatHistory: (state, action: PayloadAction<string>) => {
      if (state.messages[action.payload]) {
        state.messages[action.payload] = [];
      }
    },
    addUserMessage: (state, action: PayloadAction<{documentId: string, content: string}>) => {
      const { documentId, content } = action.payload;
      // Initialize messages array for document if it doesn't exist
      if (!state.messages[documentId]) {
        state.messages[documentId] = [];
      }
      
      // Create user message
      const userMessage: Message = {
        id: nanoid(),
        content: content,
        isUserMessage: true,
        documentId,
        timestamp: Date.now(),
      };
      
      // Add message to chat history
      state.messages[documentId].push(userMessage);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { aiMessage, documentId } = action.payload;
        
        // Initialize messages array for document if it doesn't exist
        if (!state.messages[documentId]) {
          state.messages[documentId] = [];
        }
        
        // Add only the AI message to chat history since user message was already added
        state.messages[documentId].push(aiMessage);
        
        state.isLoading = false;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        
        // Add error message to chat if we have a current document
        if (state.currentDocumentId) {
          const documentId = state.currentDocumentId;
          
          // Initialize messages array if it doesn't exist
          if (!state.messages[documentId]) {
            state.messages[documentId] = [];
          }
          
          // Create and add error message
          const errorMessage: Message = {
            id: nanoid(),
            content: "I'm sorry, I'm unable to answer this question at the moment. Please try again later.",
            isUserMessage: false,
            documentId,
            timestamp: Date.now(),
          };
          
          state.messages[documentId].push(errorMessage);
        }
      });
  },
});

export const { setCurrentDocumentId, clearErrorMessage, clearChatHistory, addUserMessage } = chatSlice.actions;
export default chatSlice.reducer;
