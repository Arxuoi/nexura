import { create } from "zustand";
import type { ChatSession, ChatMessage } from "@db/schema";

interface ChatStore {
  // Sessions
  sessions: ChatSession[];
  currentSessionId: number | null;
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSessionId: (id: number | null) => void;
  addSession: (session: ChatSession) => void;
  removeSession: (id: number) => void;
  updateSessionTitle: (id: number, title: string) => void;

  // Messages
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  streamingText: string;
  setStreamingText: (text: string) => void;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  currentSessionId: null,
  setSessions: (sessions) => set({ sessions }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSessionId:
        state.currentSessionId === id ? null : state.currentSessionId,
    })),
  updateSessionTitle: (id, title) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, title } : s
      ),
    })),

  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  streamingText: "",
  setStreamingText: (text) => set({ streamingText: text }),
  isStreaming: false,
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
}));
