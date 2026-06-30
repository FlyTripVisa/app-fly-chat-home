import { NextResponse } from "next/server";
import { getChatForUser } from "@/lib/db/queries";
import { getServerViewer } from "@/lib/session";
import { getSetupStatus } from "@/lib/setup";

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ readonly id: string }> },
) {
  try {
    const setupStatus = await getSetupStatus();

    // 503: Service Unavailable যদি অ্যাপ রেডি না থাকে
    if (!setupStatus.appReady) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const viewer = await getServerViewer(setupStatus);

    // 401: Unauthorized যদি ইউজার লগইন করা না থাকে
    if (!viewer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // ভ্যালিডেশন: আইডি অনুপস্থিত থাকলে ৪০০০ এরর
    if (!id) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const chat = await getChatForUser(id, viewer.id);

    // 404: Not Found যদি চ্যাট না পাওয়া যায়
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ chat });
    
  } catch (error) {
    console.error(`Error fetching chat ${ (await params).id }:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
