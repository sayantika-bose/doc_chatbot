import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { uploadDocument } from "@/store/documentsSlice";

const DropZone = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file: File) => {
    dispatch(uploadDocument(file) as any);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed border-neutral-300 rounded-lg p-8 mb-6 text-center cursor-pointer hover:bg-neutral-50 transition-colors",
        isDragActive && "border-primary bg-primary/5"
      )}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center">
        <UploadCloud className="h-12 w-12 text-neutral-400 mb-2" />
        <p className="text-neutral-600 mb-2">Drag and drop your file here or click to browse</p>
        <p className="text-neutral-500 text-sm">Supported formats: PDF, TXT, DOCX</p>
        
        {/* Hidden file input */}
        <input 
          ref={fileInputRef}
          type="file" 
          id="file-input" 
          className="hidden" 
          accept=".pdf,.txt,.docx"
          onChange={handleFileChange}
        />
        
        <Button className="mt-4">
          Select File
        </Button>
      </div>
    </div>
  );
};

export default DropZone;
