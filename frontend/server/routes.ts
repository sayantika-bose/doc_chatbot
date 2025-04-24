import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { nanoid } from "nanoid";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only pdf, txt, and docx files
    const allowedExtensions = ['.pdf', '.txt', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf, .txt, and .docx files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Document upload route
  app.post("/api/v1/upload", upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Generate a unique document ID
      const documentId = `doc_${nanoid(6)}`;
      
      // Here you would typically store the document in a database
      // and process it for your RAG system
      
      return res.status(200).json({ documentId });
    } catch (error) {
      console.error("Error uploading document:", error);
      
      // Check if error is from multer
      if (error instanceof Error && error.message) {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: "Failed to upload document" });
    }
  });
  
  // Chat route
  app.post("/api/v1/chat", async (req, res) => {
    try {
      const { documentId, question } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ message: "Document ID is required" });
      }
      
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      // Here you would typically:
      // 1. Retrieve the document using the documentId
      // 2. Use a RAG system to generate an answer based on the document and question
      // 3. Return the generated answer
      
      // For simplicity, we'll return a mock response
      // In a real implementation, this would be the result from the Gemini Pro model
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let answer = "";
      
      // Generate different responses based on question content for demo purposes
      if (question.toLowerCase().includes("revenue")) {
        answer = "According to the document, the total revenue for 2023 was **$1.45 billion**, which represents a 12% increase from the previous year. This growth was primarily driven by:\n\n- Expansion into new markets (35% of growth)\n- Increased sales of premium products (28% of growth)\n- Recurring subscription revenue (22% of growth)\n\nThe document also notes that this exceeded their projected target of $1.3 billion for the fiscal year.";
      } else if (question.toLowerCase().includes("forecast") || question.toLowerCase().includes("projection")) {
        answer = "The document projects a growth of 8-10% for the upcoming fiscal year. This forecast is based on:\n\n- Planned expansion into APAC region\n- R&D investments in AI technologies\n- Strategic partnerships with 3 major retail chains\n\nHowever, the forecast acknowledges potential challenges from supply chain disruptions and increasing competition in the North American market.";
      } else if (question.toLowerCase().includes("challenge") || question.toLowerCase().includes("risk")) {
        answer = "The document identifies several key challenges for the upcoming year:\n\n1. **Supply Chain Disruptions**: Ongoing global logistics issues expected to impact production\n2. **Competition**: New market entrants with disruptive business models\n3. **Regulatory Changes**: Pending legislation in EU markets that may increase compliance costs\n4. **Talent Acquisition**: Difficulty in hiring specialized technical roles\n\nThe risk mitigation strategy includes diversifying suppliers, accelerating digital transformation initiatives, and strengthening the regulatory affairs team.";
      } else {
        answer = "Based on the document content, I can provide the following information:\n\nThe company's strategic focus for 2024 includes investment in sustainable technologies, reducing carbon footprint by 15%, and improving customer retention rates.\n\nKey performance indicators mentioned include:\n\n- Customer acquisition cost: $42 (down 5% from previous year)\n- Average contract value: $24,500 (up 8%)\n- Employee satisfaction rating: 4.2/5 (up from 3.9)";
      }
      
      return res.status(200).json({ answer });
    } catch (error) {
      console.error("Error processing chat request:", error);
      return res.status(500).json({ message: "Failed to process your question" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
