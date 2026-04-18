import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { trpc } from "@/providers/trpc";
import { Send, Paperclip, Loader2 } from "lucide-react";

export default function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    currentSessionId,
    setCurrentSessionId,
    isLoading,
    setIsLoading,
  } = useChatStore();

  const utils = trpc.useUtils();

  const createSession = trpc.chat.createSession.useMutation({
    onSuccess: (data) => {
      setCurrentSessionId(data.id);
    },
  });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ sessionId: currentSessionId! });
      utils.chat.listSessions.invalidate();
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");

    let sessionId = currentSessionId;

    // Create new session if none exists
    if (!sessionId) {
      const result = await createSession.mutateAsync({});
      sessionId = result.id;
    }

    // Small delay to let session state update
    await new Promise((resolve) => setTimeout(resolve, 50));

    sendMessage.mutate({
      sessionId: sessionId!,
      message,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-indigo-300 transition-all duration-200"
        >
          {/* Attachment Button */}
          <button
            type="button"
            className="shrink-0 p-3 text-gray-400 hover:text-gray-600 transition-colors"
            title="Attach file (coming soon)"
          >
            <Paperclip size={18} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 py-3 max-h-[120px] bg-transparent border-none outline-none resize-none text-[15px] text-gray-800 placeholder:text-gray-400"
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`shrink-0 m-1.5 p-2 rounded-full transition-all duration-200 ${
              input.trim() && !isLoading
                ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm hover:shadow-md"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-400 mt-2">
          AI-generated responses may be inaccurate. Please verify important information.
        </p>
      </div>
    </div>
  );
}
