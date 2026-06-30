"use client";

import { useState } from "react";
import { createChatAction } from "@/app/actions/chats";
import { useRouter } from "next/navigation";

export default function HomeChatPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateChat = async () => {
    setLoading(true);
    try {
      const newChat = await createChatAction({ pendingUserMessage: "" });
      if (newChat?.id) {
        router.push(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
      // এখানে আপনি একটি টোস্ট নোটিফিকেশন দেখাতে পারেন
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">FlyTripVisa AI Assistant</h1>
      
      <button
        onClick={handleCreateChat}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-400"
      >
        {loading ? "Creating..." : "Start New Consultation"}
      </button>

      <div className="mt-8 text-gray-500 text-sm">
        <p>Your AI travel visa expert is ready to assist.</p>
      </div>
    </div>
  );
}
