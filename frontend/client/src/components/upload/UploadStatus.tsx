import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadStatusProps {
  isUploading: boolean;
  success: boolean;
  error: string | null;
  documentId?: string;
  onGoToChat: () => void;
}

const UploadStatus = ({ 
  isUploading, 
  success, 
  error, 
  documentId, 
  onGoToChat 
}: UploadStatusProps) => {
  return (
    <div className="fade-in mt-6">
      {/* Loading state */}
      {isUploading && (
        <div className="flex items-center p-4 mb-4 bg-primary/10 rounded-md">
          <Loader2 className="h-5 w-5 text-primary animate-spin mr-3" />
          <span className="text-primary-dark">Uploading document...</span>
        </div>
      )}
      
      {/* Success state */}
      {success && (
        <div className="p-4 mb-4 bg-success-light/10 rounded-md border-l-4 border-green-500">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p className="text-green-700 font-medium">Upload successful!</p>
              <p className="text-neutral-600 mt-1">
                Your document ID is: <span className={cn("font-mono bg-neutral-100 px-2 py-1 rounded")}>{documentId}</span>
              </p>
              <p className="text-sm text-neutral-500 mt-1">Use this ID when chatting with the document.</p>
              <Button 
                onClick={onGoToChat} 
                className="mt-3"
              >
                Start Chatting
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="p-4 mb-4 bg-red-50 rounded-md border-l-4 border-red-500">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-red-700 font-medium">Upload failed</p>
              <p className="text-neutral-600 mt-1">{error}</p>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadStatus;
