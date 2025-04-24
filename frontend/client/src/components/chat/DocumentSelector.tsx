import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  
  const handleDocumentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCurrentDocumentId(e.target.value));
  };
  
  const handleDocumentSelect = (documentId: string) => {
    dispatch(setCurrentDocumentId(documentId));
    dispatch(selectDocument(documentId));
  };
  
  const handleUploadNew = () => {
    navigate('/');
  };
  
  return (
    <div className="mb-4">
      <div className="mb-4">
        <Label htmlFor="document-id-input" className="block text-sm font-medium text-neutral-500 mb-1">
          Document ID
        </Label>
        <div className="flex">
          <Input
            id="document-id-input"
            className="flex-grow px-3 py-2 border border-neutral-300 rounded-md"
            placeholder="Enter document ID"
            value={currentDocumentId || ""}
            onChange={handleDocumentIdChange}
          />
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Enter the ID of the document you want to chat with
        </p>
      </div>
      
      {/* Recent Documents */}
      {documents.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-600 mb-2">Recent Documents</h4>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-2 hover:bg-neutral-100 rounded cursor-pointer transition-colors flex items-center"
              onClick={() => handleDocumentSelect(doc.id)}
            >
              <FileIcon className="h-4 w-4 text-neutral-400 mr-2" />
              <div>
                <p className="text-neutral-800 text-sm font-medium">{doc.fileName}</p>
                <p className="text-neutral-500 text-xs">{doc.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Button
        variant="outline"
        className="w-full mt-3 text-sm font-medium"
        onClick={handleUploadNew}
      >
        <PlusIcon className="h-4 w-4 mr-1" />
        Upload New Document
      </Button>
    </div>
  );
};

export default DocumentSelector;
