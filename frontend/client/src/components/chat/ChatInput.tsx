import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SendIcon, FileQuestionIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { RootState } from "@/types";
import { sendMessage, addUserMessage } from "@/store/chatSlice";

const formSchema = z.object({
  message: z.string().min(1, "Please enter a question"),
});

type FormData = z.infer<typeof formSchema>;

const ChatInput = () => {
  const dispatch = useDispatch();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState("auto");
  
  const { currentDocumentId, isLoading, error } = useSelector((state: RootState) => state.chat);
  const { currentDocument } = useSelector((state: RootState) => state.documents);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!currentDocumentId) return;
    
    // Store the message content
    const messageContent = data.message;
    
    // Reset the form immediately so the input clears right away
    form.reset();
    setTextareaHeight("auto");
    
    // Add user message to chat history immediately
    dispatch(addUserMessage({
      documentId: currentDocumentId,
      content: messageContent,
    }));
    
    // Then dispatch the action to send the message and get AI response
    await dispatch(sendMessage({
      documentId: currentDocumentId,
      question: messageContent,
    }) as any);
  };

  // Auto-resize textarea based on content
  const handleTextareaChange = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      setTextareaHeight(`${textareaRef.current.scrollHeight}px`);
    }
  };

  // Update textarea height when form value changes
  useEffect(() => {
    handleTextareaChange();
  }, [form.watch("message")]);

  // If no document is selected, show a message
  if (!currentDocumentId) {
    return (
      <div className="pt-4 border-t border-border mt-auto">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <FileQuestionIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
          <h3 className="text-foreground font-medium mb-1">Select a document first</h3>
          <p className="text-sm text-muted-foreground">
            Please select a document from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-border mt-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-grow relative">
                <FormControl>
                  <Textarea
                    {...field}
                    ref={textareaRef}
                    placeholder={`Ask about ${currentDocument?.fileName || 'your document'}...`}
                    className="w-full px-4 py-3 border border-input rounded-lg resize-none"
                    style={{ height: textareaHeight }}
                    rows={2}
                    onChange={(e) => {
                      field.onChange(e);
                      handleTextareaChange();
                    }}
                    onKeyDown={(e) => {
                      // Submit form when user presses Enter without shift key
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (field.value.trim() && !isLoading) {
                          form.handleSubmit(onSubmit)();
                        }
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="rounded-full p-3 h-auto w-auto bg-primary hover:bg-primary/90"
            disabled={isLoading || !form.watch("message")}
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </form>
      </Form>
      <p className="mt-2 text-xs text-muted-foreground">
        Responses are generated based on the content of your document.
      </p>
    </div>
  );
};

export default ChatInput;
