import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileIcon, PlusIcon } from "lucide-react";
import { Document } from "@/types";
import { setCurrentDocumentId } from "@/store/chatSlice";
import { selectDocument } from "@/store/documentsSlice";

interface DocumentSelectorProps {
  documents: Document[];
  currentDocumentId: string | null;
}

const DocumentSelector = ({ documents, currentDocumentId }: DocumentSelectorProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleDocumentSelect = (documentId: string) => {
    dispatch(setCurrentDocumentId(documentId));
    dispatch(selectDocument(documentId));
  };
  
  const handleUploadNew = () => {
    navigate('/');
  };
  
  return (
    <div className="mb-4">
      {/* Document List */}
      {documents.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-neutral-600 mb-3">Your Documents</h4>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-3 rounded cursor-pointer transition-all flex items-center ${
                  currentDocumentId === doc.id 
                    ? "bg-blue-50 border border-blue-200" 
                    : "hover:bg-neutral-100 border border-transparent"
                }`}
                onClick={() => handleDocumentSelect(doc.id)}
              >
                <FileIcon className={`h-4 w-4 mr-2 ${
                  currentDocumentId === doc.id ? "text-blue-500" : "text-neutral-400"
                }`} />
                <div className="overflow-hidden">
                  <p className={`text-sm font-medium truncate ${
                    currentDocumentId === doc.id ? "text-blue-700" : "text-neutral-800"
                  }`}>
                    {doc.fileName}
                  </p>
                  <p className="text-neutral-500 text-xs truncate">ID: {doc.id.substring(0, 10)}...</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          <FileIcon className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
          <p className="text-sm">No documents yet</p>
          <p className="text-xs mt-1">Upload a document to get started</p>
        </div>
      )}
      
      <Button
        variant="outline"
        className="w-full mt-4 text-sm font-medium"
        onClick={handleUploadNew}
      >
        <PlusIcon className="h-4 w-4 mr-1" />
        Upload New Document
      </Button>
    </div>
  );
};

export default DocumentSelector;
