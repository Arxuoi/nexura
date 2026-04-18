import Sidebar from "@/components/chat/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import ChatInput from "@/components/chat/ChatInput";

export default function Home() {
  return (
    <div className="h-screen flex bg-[#F9FAFB] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatArea />
        <ChatInput />
      </main>
    </div>
  );
}
