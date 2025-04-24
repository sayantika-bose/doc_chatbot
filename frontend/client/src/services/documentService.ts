import { Document, UploadResponse } from "@/types";

class DocumentService {
  private apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  async uploadDocument(file: File): Promise<UploadResponse> {
    try {
      console.log(`Uploading document to ${this.apiUrl}/upload`);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${this.apiUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload response not OK:", errorText);
        throw new Error(errorText || "Failed to upload document");
      }

      const result = await response.json();
      console.log("Upload successful, received:", result);
      return result;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  }

  // Fetch documents from the backend API
  async getDocuments(): Promise<Document[]> {
    try {
      console.log(`Fetching documents from ${this.apiUrl}/documents`);
      
      // First try to get documents from the backend API
      try {
        const response = await fetch(`${this.apiUrl}/documents`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Retrieved documents from API:", data);
        
        if (data.documents && Array.isArray(data.documents)) {
          // Also update localStorage with the latest documents
          localStorage.setItem("documents", JSON.stringify(data.documents));
          return data.documents;
        }
      } catch (apiError) {
        console.warn("Error fetching from API, falling back to localStorage:", apiError);
      }
      
      // Fallback to localStorage if API fails
      const storedDocuments = localStorage.getItem("documents");
      
      if (storedDocuments) {
        const documents = JSON.parse(storedDocuments);
        console.log("Retrieved documents from localStorage:", documents);
        return documents;
      }
      
      console.log("No documents found in storage or API");
      return [];
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
  }
}

export const documentService = new DocumentService();
