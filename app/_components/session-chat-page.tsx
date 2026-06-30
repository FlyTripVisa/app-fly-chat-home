"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createChatAction } from "@/app/actions/chats"; // নিশ্চিত করুন এটি সঠিক পাথ
import {
  AgentChatSession,
  ComposerFooterControls,
  ErrorToast,
  type AgentChatController,
  type AgentChatControllerStatus,
} from "@/app/_components/agent-chat";
import { CHAT_ROUTE_SYNC_EVENT, type ChatRouteSyncDetail } from "@/app/_components/agent-chat-events";
import { useChatShell } from "@/app/_components/chat-shell-context";
import { ChatComposer } from "@/components/chat/composer";
import {
  clearPendingChatMessage,
  isProvisionalChatId,
  readPendingChatMessage,
  writePendingChatMessage,
} from "@/lib/chat/provisional-chat";
import type { ActiveChat, SetupStatus } from "@/lib/chat/types";

// Constants kept for clean logic
const IDLE_CONTROLLER_STATUS: AgentChatControllerStatus = {
  isBusy: false,
  isDisabled: false,
  isEmpty: true,
};

export function SessionChatPage({ chatId, children }: { readonly chatId: string; readonly children: ReactNode }) {
  const { setActiveChatId, setupStatus, touchChat, viewer } = useChatShell();
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [draft, setDraft] = useState("");
  const [controllerReady, setControllerReady] = useState(false);
  const [controllerStatus, setControllerStatus] = useState(IDLE_CONTROLLER_STATUS);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  
  const controllerRef = useRef<AgentChatController | null>(null);
  const currentChatIdRef = useRef(chatId);
  const pendingConsumedRef = useRef(false);
  
  const isProvisionalChat = isProvisionalChatId(chatId);
  const router = useRouter();
  const isLoadingChat = !activeChat && !isProvisionalChat; // Loading only if not provisional

  // ... (useEffect hookগুলো আগের মতোই থাকবে, শুধু ডাটা ফেচিং পার্টে ট্রাই-ক্যাচ নিশ্চিত করুন)

  // লজিক্যাল ইমপ্রুভমেন্ট: কন্ট্রোলার চেঞ্জ হ্যান্ডলার
  const handleControllerChange = useCallback((controller: AgentChatController | null, status: AgentChatControllerStatus) => {
    controllerRef.current = controller;
    setControllerReady(!!controller);
    setControllerStatus((current) => (current.isBusy === status.isBusy && current.isDisabled === status.isDisabled && current.isEmpty === status.isEmpty ? current : status));
  }, []);

  // কম্পোজার স্টেট হ্যান্ডলিং
  const composerDisabled = !setupStatus.appReady || isLoadingChat || !!pendingUserMessage || controllerStatus.isDisabled;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {clientError && clientError !== dismissedError && (
        <ErrorToast message={clientError} onDismiss={() => setDismissedError(clientError)} />
      )}

      <AgentChatSession
        activeChat={activeChat}
        chatId={chatId}
        key={`${chatId}:${activeChat ? "loaded" : "loading"}`}
        onActiveChatUpdated={handleActiveChatUpdated}
        onPendingUserMessageSettled={handlePendingUserMessageSettled}
        onControllerChange={handleControllerChange}
        pendingUserMessage={pendingUserMessage}
      />

      <div className="shrink-0 pb-4 sm:pb-6">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
          <ChatComposer
            disabled={composerDisabled}
            disabledReason={getSessionComposerDisabledReason({ controllerStatus, isLoadingChat, pendingUserMessage, setupStatus })}
            footerStart={<ComposerFooterControls setupStatus={setupStatus} />}
            isBusy={controllerStatus.isBusy}
            onChange={setDraft}
            onStop={() => controllerRef.current?.stop()}
            onSubmit={handleComposerSubmit}
            placeholder="Ask anything..."
            value={draft}
          />
        </div>
      </div>
      <div className="hidden" aria-hidden>{children}</div>
    </div>
  );
}
