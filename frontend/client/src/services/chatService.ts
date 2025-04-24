import { ChatResponse } from "@/types";

class ChatService {
  private apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  async sendMessage(documentId: string, question: string): Promise<ChatResponse> {
    try {
      console.log(`Sending message to ${this.apiUrl}/chat with document_id: ${documentId}`);
      
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: documentId, // Changed from camelCase to snake_case to match backend
          question,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send message");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
