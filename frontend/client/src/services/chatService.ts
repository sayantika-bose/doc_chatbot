import { ChatResponse } from "@/types";

class ChatService {
  private apiUrl = "/api/v1";

  async sendMessage(documentId: string, question: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
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
