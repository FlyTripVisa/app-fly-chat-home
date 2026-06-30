import type { ActiveChat, ChatListItem, SetupStatus, Viewer } from "@/lib/chat/types";

// ইভেন্ট নেমগুলো কনস্ট্যান্ট হিসেবে রাখা ভালো প্র্যাকটিস
export const CHAT_BOOTSTRAP_SYNC_EVENT = "eve-chat:bootstrap-sync" as const;
export const CHAT_ROUTE_SYNC_EVENT = "eve-chat:route-sync" as const;

export type ChatBootstrapSyncDetail = {
  readonly chats: readonly ChatListItem[];
  readonly nextCursor: string | null;
  readonly setupStatus: SetupStatus;
  readonly viewer: Viewer | null;
};

export type ChatRouteSyncDetail = {
  readonly activeChat: ActiveChat | null;
  readonly chatId: string | null;
};

// গ্লোবাল উইন্ডো ইভেন্ট ইন্টারফেসের জন্য টাইপ ডেফিনিশন (এটি আপনার প্রজেক্টে এভয়েড করতে সাহায্য করবে টাইপ এরর)
declare global {
  interface WindowEventMap {
    [CHAT_BOOTSTRAP_SYNC_EVENT]: CustomEvent<ChatBootstrapSyncDetail>;
    [CHAT_ROUTE_SYNC_EVENT]: CustomEvent<ChatRouteSyncDetail>;
  }
}
