import { Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  content: string;
  isUserMessage: boolean;
}

const ChatMessage = ({ content, isUserMessage }: ChatMessageProps) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({
      description: "Message copied to clipboard",
    });
  };

  const handleFeedback = (isPositive: boolean) => {
    toast({
      description: `Thank you for your ${isPositive ? 'positive' : 'negative'} feedback`,
    });
  };

  return (
    <div
      className={cn(
        "message-bubble relative p-3 md:p-4 rounded-lg max-w-[80%] shadow-sm mb-4",
        isUserMessage
          ? "user-message bg-blue-500 text-white ml-auto rounded-br-sm"
          : "ai-message bg-gray-100 dark:bg-slate-800 dark:text-white mr-auto rounded-bl-sm"
      )}
    >
      {!isUserMessage && (
        <div className="flex items-start">
          <div className="text-primary mr-2 text-xl">🤖</div>
          <div className="flex-1">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              >
                {content}
              </ReactMarkdown>
            </div>
            
            <div className="mt-2 flex justify-end">
              <div className="flex text-xs space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full" 
                  onClick={() => handleFeedback(true)}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full" 
                  onClick={() => handleFeedback(false)}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full" 
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isUserMessage && (
        <p className="text-white">{content}</p>
      )}
    </div>
  );
};

export default ChatMessage;
