import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/types";
import ChatMessage from "./ChatMessage";
import { Loader2 } from "lucide-react";

const ChatHistory = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, currentDocumentId, isLoading } = useSelector((state: RootState) => state.chat);
  
  // Get messages for current document
  const currentMessages = currentDocumentId ? messages[currentDocumentId] || [] : [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  return (
    <div className="flex-grow overflow-y-auto py-4 space-y-4">
      {currentMessages.length === 0 && !isLoading && (
        <div className="ai-message message-bubble">
          <div className="flex items-start">
            <div className="text-primary mr-2 text-xl">🤖</div>
            <div>
              <p className="text-neutral-800">
                Hello! I'm your document assistant. I can answer questions about your uploaded document. What would you like to know?
              </p>
            </div>
          </div>
        </div>
      )}

      {currentMessages.map((message) => (
        <ChatMessage 
          key={message.id} 
          content={message.content} 
          isUserMessage={message.isUserMessage} 
        />
      ))}
      
      {/* Loading message */}
      {isLoading && (
        <div className="ai-message message-bubble">
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 text-primary animate-spin mr-3" />
            <span className="text-neutral-600">Thinking...</span>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory;
