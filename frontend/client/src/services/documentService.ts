import { UploadResponse } from "@/types";

class DocumentService {
  private apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  async uploadDocument(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${this.apiUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to upload document");
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  }
}

export const documentService = new DocumentService();
