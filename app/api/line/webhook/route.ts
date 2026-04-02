import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────
// POST /api/line/webhook — LINE Webhook Handler (Stub)
// ─────────────────────────────────────────────────────
// ⚠️ Stub implementation — logs events but does not process them
// Production: validate X-Line-Signature, parse events, route to handlers
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-line-signature");
    const body = await request.json();

    // Log webhook event
    const events = body.events || [];
    console.log(`[LINE Webhook] Received ${events.length} event(s)`, {
      signature: signature ? `${signature.slice(0, 20)}...` : "none",
      destination: body.destination,
      events: events.map((e: { type: string; source?: { userId?: string } }) => ({
        type: e.type,
        userId: e.source?.userId,
      })),
    });

    // TODO: Production implementation
    // 1. Validate X-Line-Signature with crypto.createHmac("sha256", channelSecret)
    // 2. Parse event types: follow, unfollow, message, postback
    // 3. Route to appropriate handler:
    //    - follow → assign rich menu, send welcome flex
    //    - postback → handle approve/reject actions
    //    - message → route to LIFF or reply

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[LINE Webhook] Error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
