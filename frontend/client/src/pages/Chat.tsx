import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types";
import ChatHistory from "@/components/chat/ChatHistory";
import ChatInput from "@/components/chat/ChatInput";
import DocumentSelector from "@/components/chat/DocumentSelector";
import { fetchDocuments } from "@/store/documentsSlice";
import { clearErrorMessage } from "@/store/chatSlice";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { currentDocumentId, error } = useSelector((state: RootState) => state.chat);
  const { documents, currentDocument } = useSelector((state: RootState) => state.documents);

  useEffect(() => {
    // Fetch documents on component mount
    const fetchDocs = async () => {
      console.log("Fetching documents on Chat component mount");
      await dispatch(fetchDocuments() as any);
    };
    
    fetchDocs();
    
    // Set up interval to refresh documents list every 30 seconds
    const intervalId = setInterval(() => {
      console.log("Refreshing documents list");
      dispatch(fetchDocuments() as any);
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [dispatch]);

  useEffect(() => {
    // Show error toast if there's an error
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
      dispatch(clearErrorMessage());
    }
  }, [error, toast, dispatch]);

  return (
    <div className="fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document Info Panel (1/4 on large screens) */}
        <div className="bg-card rounded-lg shadow-md p-4 h-fit lg:col-span-1">
          <h3 className="text-lg font-medium text-foreground mb-4">Document</h3>
          <DocumentSelector 
            documents={documents}
            currentDocumentId={currentDocumentId}
          />
        </div>
        
        {/* Chat Interface (3/4 on large screens) */}
        <div className="bg-card rounded-lg shadow-md p-4 lg:p-6 lg:col-span-3 flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-medium text-foreground">Chat</h3>
                <p className="text-sm text-muted-foreground">
                  Ask questions about document: <span className="font-medium">
                    {currentDocument?.fileName || "No document selected"}
                  </span>
                </p>
              </div>
            </div>
            
            <ChatHistory />
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
