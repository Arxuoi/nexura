import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { trpc } from "@/providers/trpc";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";

const SUGGESTED_PROMPTS = [
  "Explain quantum computing in simple terms",
  "Write a Python function to sort a list",
  "What are the best practices for React?",
  "Help me plan a healthy meal for today",
  "Explain how neural networks work",
  "Write a creative short story",
];

export default function ChatArea() {
  const {
    currentSessionId,
    messages,
    setMessages,
    isStreaming,
    streamingText,
  } = useChatStore();

  const { data: messagesData } = trpc.chat.getMessages.useQuery(
    { sessionId: currentSessionId! },
    { enabled: !!currentSessionId }
  );

  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData);
    }
  }, [messagesData, setMessages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  if (!currentSessionId) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {messages.map((msg, index) => (
          <div key={msg.id || index}>
            {msg.role === "assistant" ? (
              <AIMessage content={msg.content} createdAt={msg.createdAt} />
            ) : (
              <UserMessage content={msg.content} createdAt={msg.createdAt} />
            )}
          </div>
        ))}

        {isStreaming && streamingText && (
          <AIMessage
            content={streamingText}
            createdAt={new Date()}
            isStreaming
          />
        )}

        {isStreaming && !streamingText && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function EmptyState() {
  const { setCurrentSessionId } = useChatStore();
  const createSession = trpc.chat.createSession.useMutation({
    onSuccess: (data) => {
      setCurrentSessionId(data.id);
    },
  });

  const utils = trpc.useUtils();
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate();
      utils.chat.listSessions.invalidate();
    },
  });

  const handlePromptClick = async (prompt: string) => {
    const session = await createSession.mutateAsync({});
    sendMessage.mutate({
      sessionId: session.id,
      message: prompt,
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* AI Avatar */}
        <div className="relative mb-6 mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-indigo-500 blur-lg opacity-40 animate-pulse" />
          <div className="relative w-full h-full rounded-full bg-white shadow-xl flex items-center justify-center overflow-hidden border-2 border-indigo-100">
            <img
              src="/ai-avatar.jpg"
              alt="AI Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Hello! How can I help you today?
        </h2>
        <p className="text-gray-500 mb-8">
          Start a conversation or try one of these suggestions
        </p>

        {/* Suggested Prompts */}
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handlePromptClick(prompt)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Sparkles size={12} className="text-indigo-500" />
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIMessage({
  content,
  createdAt,
  isStreaming,
}: {
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 max-w-[85%]">
      {/* Avatar */}
      <div className="relative shrink-0 w-8 h-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 blur-sm opacity-30" />
        <div className="relative w-full h-full rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border border-indigo-100">
          <img
            src="/ai-avatar.jpg"
            alt="AI"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] text-gray-800 leading-relaxed">
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-code:text-indigo-600 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
          {isStreaming && (
            <span className="inline-block w-[2px] h-4 bg-indigo-500 ml-0.5 animate-blink align-text-bottom" />
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          {format(new Date(createdAt), "HH:mm")}
        </p>
      </div>
    </div>
  );
}

function UserMessage({
  content,
  createdAt,
}: {
  content: string;
  createdAt: Date;
}) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%]">
        <div className="bg-indigo-50 rounded-[18px] rounded-br rounded-tl-[4px] px-[18px] py-[14px]">
          <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
        <p className="text-[11px] text-gray-400 mt-1 text-right">
          {format(new Date(createdAt), "HH:mm")}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="relative shrink-0 w-8 h-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 blur-sm opacity-50 animate-spin-slow" />
        <div className="relative w-full h-full rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border border-indigo-100">
          <img
            src="/ai-avatar.jpg"
            alt="AI"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-typing-bounce" />
        <span
          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-typing-bounce"
          style={{ animationDelay: "0.16s" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-typing-bounce"
          style={{ animationDelay: "0.32s" }}
        />
      </div>
    </div>
  );
}
