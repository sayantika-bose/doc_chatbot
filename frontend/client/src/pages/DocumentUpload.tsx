import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import DropZone from "@/components/upload/DropZone";
import UploadStatus from "@/components/upload/UploadStatus";
import { RootState } from "@/types";
import { resetUploadState } from "@/store/documentsSlice";
import { setCurrentDocumentId } from "@/store/chatSlice";

const DocumentUpload = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isUploading, uploadSuccess, uploadError, currentDocument } = useSelector(
    (state: RootState) => state.documents
  );

  // Reset upload state when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetUploadState());
    };
  }, [dispatch]);

  // When a document is successfully uploaded, set it as the current document in chat
  useEffect(() => {
    if (uploadSuccess && currentDocument?.id) {
      dispatch(setCurrentDocumentId(currentDocument.id));
    }
  }, [uploadSuccess, currentDocument, dispatch]);

  const handleGoToChat = () => {
    navigate('/chat');
  };

  return (
    <div className="fade-in">
      <Card className="bg-card rounded-lg shadow-md p-2 max-w-2xl mx-auto">
        <CardContent className="p-6">
          <h2 className="text-2xl font-medium text-foreground mb-6">Upload Document</h2>
          
          <DropZone />
          
          {(isUploading || uploadSuccess || uploadError) && (
            <UploadStatus 
              isUploading={isUploading}
              success={uploadSuccess}
              error={uploadError}
              documentId={currentDocument?.id}
              onGoToChat={handleGoToChat}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
