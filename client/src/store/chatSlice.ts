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
    { rejectWithValue }
  ) => {
    try {
      // Create user message
      const userMessage: Message = {
        id: nanoid(),
        content: question,
        isUserMessage: true,
        documentId,
        timestamp: Date.now(),
      };

      // Send message to API
      const response = await chatService.sendMessage(documentId, question);

      // Create AI message
      const aiMessage: Message = {
        id: nanoid(),
        content: response.answer,
        isUserMessage: false,
        documentId,
        timestamp: Date.now(),
      };

      return { userMessage, aiMessage, documentId };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to send message");
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { userMessage, aiMessage, documentId } = action.payload;
        
        // Initialize messages array for document if it doesn't exist
        if (!state.messages[documentId]) {
          state.messages[documentId] = [];
        }
        
        // Add messages to chat history
        state.messages[documentId].push(userMessage);
        state.messages[documentId].push(aiMessage);
        
        state.isLoading = false;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentDocumentId, clearErrorMessage, clearChatHistory } = chatSlice.actions;
export default chatSlice.reducer;
