import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { buildWelcomeMessage } from "@/lib/flex/messages/welcome";
import { buildApprovalResultMessage } from "@/lib/flex/messages/approval-result";

// ─────────────────────────────────────────────────────
// POST /api/line/webhook — LINE Webhook Handler
// ─────────────────────────────────────────────────────

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";
const LINE_PROFILE_URL = "https://api.line.me/v2/bot/profile";

// ── Helpers ──────────────────────────────────────────

async function getLineConfig() {
  const dbConfig = await prisma.lineOaConfig.findFirst();
  return {
    channelSecret:
      dbConfig?.channelSecret || process.env.LINE_CHANNEL_SECRET || "",
    channelAccessToken:
      dbConfig?.channelAccessToken ||
      process.env.LINE_CHANNEL_ACCESS_TOKEN ||
      "",
  };
}

function verifySignature(
  rawBody: string,
  signature: string,
  channelSecret: string
): boolean {
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(rawBody)
    .digest("base64");
  // Use timing-safe comparison to prevent timing attacks
  try {
    const a = Buffer.from(hash);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function replyMessage(
  replyToken: string,
  messages: unknown[],
  accessToken: string
) {
  const res = await fetch(LINE_REPLY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[LINE replyMessage] Error:", err);
  }
  return res;
}

async function getProfile(userId: string, accessToken: string) {
  const res = await fetch(`${LINE_PROFILE_URL}/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{
    displayName: string;
    userId: string;
    pictureUrl?: string;
  }>;
}

// ── Event Handlers ───────────────────────────────────

interface LineEvent {
  type: string;
  replyToken?: string;
  source?: { type: string; userId?: string; groupId?: string };
  message?: { type: string; text?: string; id?: string };
  postback?: { data: string };
}

async function handleMessageEvent(event: LineEvent, accessToken: string) {
  const { message, replyToken, source } = event;
  if (!replyToken || !message) return;

  if (message.type === "text") {
    const userText = (message.text || "").trim().toLowerCase();

    if (userText === "myid" || userText === "id") {
      await replyMessage(
        replyToken,
        [
          {
            type: "text",
            text: `🆔 Your LINE User ID:\n${source?.userId || "ไม่พบ"}`,
          },
        ],
        accessToken
      );
    } else if (userText === "สวัสดี" || userText === "hello") {
      const profile = source?.userId
        ? await getProfile(source.userId, accessToken)
        : null;
      const name = profile?.displayName || "คุณ";
      await replyMessage(
        replyToken,
        [
          {
            type: "text",
            text: `สวัสดีครับ ${name} 👋\nยินดีต้อนรับสู่ระบบ eVMS\nพิมพ์ "help" เพื่อดูคำสั่งที่ใช้ได้ครับ`,
          },
        ],
        accessToken
      );
    } else if (userText === "help" || userText === "ช่วยเหลือ") {
      await replyMessage(
        replyToken,
        [
          {
            type: "text",
            text: "📋 คำสั่งที่ใช้ได้:\n• สวัสดี — ทักทาย\n• help — แสดงเมนูนี้\n• เวลา — แสดงเวลาปัจจุบัน\n• สถานะ — ตรวจสอบสถานะการลงทะเบียน\n• myid — แสดง LINE User ID ของคุณ",
          },
        ],
        accessToken
      );
    } else if (userText === "เวลา") {
      const now = new Date().toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
      });
      await replyMessage(
        replyToken,
        [{ type: "text", text: `🕐 เวลาปัจจุบัน: ${now}` }],
        accessToken
      );
    } else if (userText === "สถานะ") {
      // ตรวจสอบว่า LINE user นี้ link กับระบบหรือยัง
      const userId = source?.userId;
      if (userId) {
        const visitor = await prisma.visitor.findFirst({
          where: { lineUserId: userId },
        });
        if (visitor) {
          await replyMessage(
            replyToken,
            [
              {
                type: "text",
                text: `✅ คุณลงทะเบียนแล้ว\nชื่อ: ${visitor.firstName} ${visitor.lastName}\nโทร: ${visitor.phone}`,
              },
            ],
            accessToken
          );
        } else {
          await replyMessage(
            replyToken,
            [
              {
                type: "text",
                text: "⚠️ คุณยังไม่ได้ลงทะเบียนในระบบ eVMS\nกรุณาลงทะเบียนผ่าน Rich Menu ด้านล่างครับ",
              },
            ],
            accessToken
          );
        }
      }
    } else {
      await replyMessage(
        replyToken,
        [
          {
            type: "text",
            text: `พิมพ์ "help" เพื่อดูคำสั่งที่ใช้ได้ครับ`,
          },
        ],
        accessToken
      );
    }
  } else if (message.type === "image") {
    await replyMessage(
      replyToken,
      [{ type: "text", text: "📷 ได้รับรูปภาพแล้วครับ" }],
      accessToken
    );
  } else if (message.type === "sticker") {
    await replyMessage(
      replyToken,
      [{ type: "sticker", packageId: "446", stickerId: "1988" }],
      accessToken
    );
  }
}

async function handleFollowEvent(event: LineEvent, accessToken: string) {
  if (!event.replyToken) return;

  // ส่งข้อความต้อนรับจาก Flex Message factory
  const welcomeMsg = buildWelcomeMessage();
  await replyMessage(event.replyToken, [welcomeMsg], accessToken);
}

async function handleUnfollowEvent(event: LineEvent) {
  console.log(`[LINE Unfollow] userId: ${event.source?.userId}`);
}

async function handlePostbackEvent(event: LineEvent, accessToken: string) {
  if (!event.replyToken || !event.postback) return;

  const params = new URLSearchParams(event.postback.data);
  const action = params.get("action");

  if (action === "approve" || action === "reject") {
    const appointmentId = params.get("appointmentId");
    const status = action === "approve" ? "approved" : "rejected";
    const statusText = action === "approve" ? "✅ อนุมัติแล้ว" : "❌ ปฏิเสธแล้ว";

    if (appointmentId) {
      try {
        const now = new Date();
        const appointment = await prisma.appointment.update({
          where: { id: parseInt(appointmentId) },
          data: {
            status,
            ...(action === "approve"
              ? { approvedAt: now }
              : { rejectedAt: now }),
          },
          include: {
            visitor: true,
            hostStaff: true,
          },
        });

        // Reply to officer
        await replyMessage(
          event.replyToken,
          [
            {
              type: "text",
              text: `${statusText}\nนัดหมาย #${appointmentId} ได้รับการ${action === "approve" ? "อนุมัติ" : "ปฏิเสธ"}เรียบร้อยแล้ว`,
            },
          ],
          accessToken
        );

        // Send Flex Message to visitor via push
        if (appointment.visitor?.lineUserId) {
          const officerName = event.source?.userId
            ? (await getProfile(event.source.userId, accessToken))?.displayName || "เจ้าหน้าที่"
            : "เจ้าหน้าที่";

          const flexMsg = await buildApprovalResultMessage({
            approved: action === "approve",
            bookingCode: appointment.bookingCode || `#${appointmentId}`,
            dateTime: `${appointment.dateStart?.toLocaleDateString("th-TH") || ""} | ${appointment.timeStart || ""} - ${appointment.timeEnd || ""}`,
            approverName: officerName,
            approvedAt: now.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
          });

          await fetch(LINE_PUSH_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              to: appointment.visitor.lineUserId,
              messages: [flexMsg],
            }),
          }).catch((err) =>
            console.error("[LINE Postback] Push to visitor failed:", err)
          );
        }
      } catch (error) {
        console.error("[LINE Postback] DB error:", error);
        await replyMessage(
          event.replyToken,
          [{ type: "text", text: "⚠️ เกิดข้อผิดพลาด กรุณาลองใหม่ครับ" }],
          accessToken
        );
      }
    }
  } else {
    await replyMessage(
      event.replyToken,
      [
        {
          type: "text",
          text: `📩 ได้รับคำสั่ง: ${event.postback.data}`,
        },
      ],
      accessToken
    );
  }
}

async function routeEvent(event: LineEvent, accessToken: string) {
  switch (event.type) {
    case "message":
      return handleMessageEvent(event, accessToken);
    case "follow":
      return handleFollowEvent(event, accessToken);
    case "unfollow":
      return handleUnfollowEvent(event);
    case "postback":
      return handlePostbackEvent(event, accessToken);
    default:
      console.log(`[LINE Webhook] Unhandled event type: ${event.type}`);
  }
}

// ── Main Handler ─────────────────────────────────────

const PLACEHOLDER_SECRETS = new Set([
  "placeholder-channel-secret",
  "placeholder-access-token",
  "",
]);

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-line-signature");

    let body: { events?: LineEvent[]; destination?: string };
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.warn("[LINE Webhook] Invalid JSON body", { bodyLength: rawBody.length });
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const events: LineEvent[] = body.events || [];

    // Load config FIRST so we can verify signature even for empty-events (LINE "Verify" button).
    // This ensures a misconfigured Channel Secret shows up as a failure at Verify time
    // instead of silently passing the handshake while real events fail with 403.
    let config: { channelSecret: string; channelAccessToken: string };
    try {
      config = await getLineConfig();
    } catch (dbError) {
      console.error("[LINE Webhook] DB connection failed:", dbError);
      return NextResponse.json(
        { status: "error", message: "Database connection failed" },
        { status: 500 }
      );
    }

    if (!config.channelSecret) {
      console.error("[LINE Webhook] Channel secret not configured (DB + env both empty)");
      return NextResponse.json(
        { status: "error", message: "Channel secret not configured" },
        { status: 500 }
      );
    }

    if (PLACEHOLDER_SECRETS.has(config.channelSecret)) {
      console.error(
        "[LINE Webhook] Channel secret is still the seed placeholder — update via /web/settings/line-oa"
      );
      return NextResponse.json(
        { status: "error", message: "Channel secret is placeholder — not configured" },
        { status: 500 }
      );
    }

    if (!signature) {
      console.warn("[LINE Webhook] Missing x-line-signature header", {
        eventCount: events.length,
        userAgent: request.headers.get("user-agent"),
      });
      return NextResponse.json({ error: "Missing signature" }, { status: 403 });
    }

    if (!verifySignature(rawBody, signature, config.channelSecret)) {
      console.warn("[LINE Webhook] Signature mismatch — check Channel Secret in /web/settings/line-oa matches LINE Console", {
        bodyLength: rawBody.length,
        eventCount: events.length,
        secretLength: config.channelSecret.length,
        secretPreview: `${config.channelSecret.slice(0, 4)}…${config.channelSecret.slice(-2)}`,
        signaturePreview: `${signature.slice(0, 8)}…`,
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // "Verify" button in LINE Console sends POST with events=[] and a real signature.
    // Reaching here means secret matches — respond 200 without further processing.
    if (events.length === 0) {
      console.log("[LINE Webhook] Verify handshake OK (empty events, signature valid)");
      return NextResponse.json({ status: "ok" });
    }

    await Promise.all(events.map((e) => routeEvent(e, config.channelAccessToken)));

    console.log("[LINE Webhook] Processed events", {
      eventCount: events.length,
      types: events.map((e) => e.type),
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[LINE Webhook] Unhandled error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
