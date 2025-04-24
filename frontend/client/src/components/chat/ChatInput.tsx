import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { RootState } from "@/types";
import { sendMessage } from "@/store/chatSlice";

const formSchema = z.object({
  message: z.string().min(1, "Please enter a question"),
});

type FormData = z.infer<typeof formSchema>;

const ChatInput = () => {
  const dispatch = useDispatch();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState("auto");
  
  const { currentDocumentId, isLoading } = useSelector((state: RootState) => state.chat);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!currentDocumentId) return;
    
    await dispatch(sendMessage({
      documentId: currentDocumentId,
      question: data.message,
    }) as any);
    
    form.reset();
    setTextareaHeight("auto");
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

  return (
    <div className="pt-4 border-t border-neutral-200 mt-auto">
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
                    placeholder="Ask a question about your document..."
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg resize-none"
                    style={{ height: textareaHeight }}
                    rows={2}
                    onChange={(e) => {
                      field.onChange(e);
                      handleTextareaChange();
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="rounded-full p-3 h-auto w-auto"
            disabled={!currentDocumentId || isLoading || !form.watch("message")}
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </form>
      </Form>
      <p className="mt-2 text-xs text-neutral-500">
        Responses are generated based on the content of your document.
      </p>
    </div>
  );
};

export default ChatInput;
