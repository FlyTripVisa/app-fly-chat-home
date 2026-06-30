import { NextResponse } from "next/server";
import { listChatsPageByUser } from "@/lib/db/queries";
import { getServerViewer } from "@/lib/session";
import { getSetupStatus } from "@/lib/setup";

// Cache-control for better performance
export const revalidate = 0; 

export async function GET() {
  try {
    const setupStatus = await getSetupStatus();
    
    // Quick circuit breaker if setup is incomplete
    if (!setupStatus.appReady) {
      return NextResponse.json({
        chats: [],
        nextCursor: null,
        setupStatus,
        viewer: null,
      });
    }

    const viewer = await getServerViewer(setupStatus);
    
    // Fetch initial data
    const initialChatsPage = viewer 
      ? await listChatsPageByUser(viewer.id) 
      : { items: [], nextCursor: null };

    return NextResponse.json({
      chats: initialChatsPage.items,
      nextCursor: initialChatsPage.nextCursor,
      setupStatus,
      viewer,
    });
  } catch (error) {
    console.error("Bootstrap API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", chats: [], nextCursor: null },
      { status: 500 }
    );
  }
}
