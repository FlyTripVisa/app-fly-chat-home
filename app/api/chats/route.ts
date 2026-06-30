import { NextResponse } from "next/server";
import { listChatsPageByUser } from "@/lib/db/queries";
import { getServerViewer } from "@/lib/session";
import { getSetupStatus } from "@/lib/setup";

// API ক্যাশিং ডিজেবল করা হয়েছে যাতে লেটেস্ট ডাটা পাওয়া যায়
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const setupStatus = await getSetupStatus();

    // অ্যাপ রেডি না থাকলে খালি রেসপন্স
    if (!setupStatus.appReady) {
      return NextResponse.json({ chats: [], nextCursor: null });
    }

    const viewer = await getServerViewer(setupStatus);

    // ৪০১: আনঅথরাইজড ইউজার
    if (!viewer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // কার্সার প্যারামিটার সংগ্রহ
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    // ডাটাবেজ থেকে পেজিনেটেড ডাটা ফেচ
    const page = await listChatsPageByUser(viewer.id, cursor);

    return NextResponse.json({
      chats: page.items,
      nextCursor: page.nextCursor,
    });
    
  } catch (error) {
    console.error("ListChats API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" }, 
      { status: 500 }
    );
  }
}
