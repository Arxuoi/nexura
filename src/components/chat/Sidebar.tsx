import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { trpc } from "@/providers/trpc";
import {
  MessageSquarePlus,
  Search,
  Trash2,
  Settings,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { format } from "date-fns";
import type { ChatSession } from "@db/schema";

export default function Sidebar() {
  const {
    sessions,
    currentSessionId,
    setSessions,
    setCurrentSessionId,
    removeSession,
    isSidebarOpen,
    toggleSidebar,
  } = useChatStore();

  const utils = trpc.useUtils();

  const { data: sessionsData } = trpc.chat.listSessions.useQuery();

  const createSession = trpc.chat.createSession.useMutation({
    onSuccess: (data) => {
      utils.chat.listSessions.invalidate();
      setCurrentSessionId(data.id);
    },
  });

  const deleteSession = trpc.chat.deleteSession.useMutation({
    onSuccess: (_, variables) => {
      removeSession(variables.sessionId);
      utils.chat.listSessions.invalidate();
    },
  });

  useEffect(() => {
    if (sessionsData) {
      setSessions(sessionsData);
    }
  }, [sessionsData, setSessions]);

  const handleNewChat = () => {
    createSession.mutate({});
  };

  // Group sessions by date
  const today = new Date();
  const grouped = sessions.reduce<{
    today: ChatSession[];
    yesterday: ChatSession[];
    previous: ChatSession[];
  }>(
    (groups, session) => {
      const sessionDate = new Date(session.updatedAt);
      const isToday = sessionDate.toDateString() === today.toDateString();
      const isYesterday =
        sessionDate.toDateString() ===
        new Date(today.getTime() - 86400000).toDateString();

      if (isToday) {
        groups.today.push(session);
      } else if (isYesterday) {
        groups.yesterday.push(session);
      } else {
        groups.previous.push(session);
      }
      return groups;
    },
    { today: [], yesterday: [], previous: [] }
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[280px] bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:opacity-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Sparkles size={16} className="text-white" />
            </div>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Aura Chat</h1>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <MessageSquarePlus size={16} />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin">
          {grouped.today.length > 0 && (
            <div>
              <h3 className="px-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                Today
              </h3>
              {grouped.today.map((session: ChatSession) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={currentSessionId === session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  onDelete={() =>
                    deleteSession.mutate({ sessionId: session.id })
                  }
                />
              ))}
            </div>
          )}

          {grouped.yesterday.length > 0 && (
            <div>
              <h3 className="px-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                Yesterday
              </h3>
              {grouped.yesterday.map((session: ChatSession) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={currentSessionId === session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  onDelete={() =>
                    deleteSession.mutate({ sessionId: session.id })
                  }
                />
              ))}
            </div>
          )}

          {grouped.previous.length > 0 && (
            <div>
              <h3 className="px-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                Previous
              </h3>
              {grouped.previous.map((session: ChatSession) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={currentSessionId === session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  onDelete={() =>
                    deleteSession.mutate({ sessionId: session.id })
                  }
                />
              ))}
            </div>
          )}

          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No conversations yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-400">Powered by Gemini</span>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function SessionItem({
  session,
  isActive,
  onClick,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? "bg-indigo-50 border-l-[3px] border-indigo-500"
          : "hover:bg-gray-50 border-l-[3px] border-transparent"
      }`}
    >
      <MessageSquarePlus
        size={14}
        className={`shrink-0 ${isActive ? "text-indigo-500" : "text-gray-400"}`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate ${
            isActive ? "text-gray-900 font-medium" : "text-gray-600"
          }`}
        >
          {session.title}
        </p>
        <p className="text-[11px] text-gray-400">
          {format(new Date(session.updatedAt), "HH:mm")}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
