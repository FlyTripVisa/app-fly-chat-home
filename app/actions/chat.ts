"use server";

import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import {
  appendChatEvent,
  clearChatPendingMessage,
  createChat,
  deleteChatForUser,
  listChatsByUser,
  markChatPendingMessage,
  saveChatSnapshot,
  saveChatSessionState,
  skipChatAuthorization,
} from "@/lib/db/queries";
import { assertChatMessageLength } from "@/lib/chat/limits";
import { RateLimitError, enforceRateLimit } from "@/lib/rate-limit";
import { getServerViewer } from "@/lib/session";

const SEND_LIMIT = 25;
const SEND_WINDOW_SECONDS = 60 * 60;

// Helper to handle errors gracefully
async function requireViewer() {
  const viewer = await getServerViewer();
  if (!viewer) throw new Error("Unauthorized: Please sign in to continue.");
  return viewer;
}

export async function createChatAction(input?: { readonly pendingUserMessage?: string }) {
  try {
    const viewer = await requireViewer();
    if (input?.pendingUserMessage) assertChatMessageLength(input.pendingUserMessage);

    await enforceRateLimit({
      key: viewer.id,
      limit: SEND_LIMIT,
      prefix: "chat:create",
      windowSeconds: SEND_WINDOW_SECONDS,
    });

    return await createChat(viewer.id, {
      pendingUserMessage: input?.pendingUserMessage,
    });
  } catch (error) {
    console.error("Create Chat Action Error:", error);
    throw error; // Let the caller/error boundary handle it
  }
}

export async function checkSendLimitAction(input?: { readonly message?: string }) {
  const viewer = await requireViewer();
  try {
    if (input?.message) assertChatMessageLength(input.message);

    await enforceRateLimit({
      key: viewer.id,
      limit: SEND_LIMIT,
      prefix: "chat:send",
      windowSeconds: SEND_WINDOW_SECONDS,
    });

    return { allowed: true as const };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { allowed: false as const, message: error.message, retryAfter: error.retryAfter };
    }
    throw error;
  }
}

export async function deleteChatAction(chatId: string) {
  const viewer = await requireViewer();
  try {
    await deleteChatForUser(chatId, viewer.id);
    return await listChatsByUser(viewer.id);
  } catch (error) {
    console.error("Delete Chat Action Error:", error);
    throw new Error("Failed to delete chat.");
  }
}

// অন্যান্য ফাংশনগুলো আগের মতোই থাকবে, তবে সেগুলোতেও একইভাবে try-catch যোগ করা ভালো।
export async function saveChatSnapshotAction(input: {
  readonly chatId: string;
  readonly events: readonly HandleMessageStreamEvent[];
  readonly session: SessionState;
}) {
  const viewer = await requireViewer();
  await saveChatSnapshot({ ...input, userId: viewer.id });
  return { ok: true };
}

// ...বাকি ফাংশনগুলোতেও একই প্যাটার্ন অনুসরণ করুন।
