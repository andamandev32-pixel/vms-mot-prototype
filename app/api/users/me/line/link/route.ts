import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthUser, apiSuccess, apiError } from "@/lib/api-utils";

/**
 * POST /api/users/me/line/link
 * ผูก LINE account กับ user account ปัจจุบัน (เรียกจาก LIFF หลัง register)
 */
export async function POST(request: NextRequest) {
  try {
    const result = await requireAuth(request);
    if (!isAuthUser(result)) return result;
    const user = result;

    const body = await request.json();
    const { lineAccessToken } = body as {
      lineAccessToken?: string;
    };

    if (!lineAccessToken?.trim()) {
      return apiError("MISSING_FIELDS", "กรุณาระบุ lineAccessToken");
    }

    // Verify LINE access token → get LINE profile
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${lineAccessToken.trim()}` },
    });

    if (!profileRes.ok) {
      return apiError("INVALID_LINE_TOKEN", "LINE access token ไม่ถูกต้องหรือหมดอายุ", 401);
    }

    const profile = (await profileRes.json()) as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
    };

    // Check if this LINE account is already linked to another user
    const existingLink = await prisma.userAccount.findFirst({
      where: {
        lineUserId: profile.userId,
        id: { not: user.id },
      },
      select: { id: true, email: true },
    });

    if (existingLink) {
      return apiError("LINE_ALREADY_LINKED", "LINE account นี้ผูกกับผู้ใช้อื่นแล้ว");
    }

    // Check if current user already has a LINE linked
    const currentUser = await prisma.userAccount.findUnique({
      where: { id: user.id },
      select: { id: true, lineUserId: true },
    });

    if (!currentUser) return apiError("USER_NOT_FOUND", "ไม่พบผู้ใช้", 404);

    if (currentUser.lineUserId) {
      return apiError("ALREADY_LINKED", "ผู้ใช้นี้ผูก LINE แล้ว — ต้อง unlink ก่อน");
    }

    // Link LINE account
    const now = new Date();
    await prisma.userAccount.update({
      where: { id: user.id },
      data: {
        lineUserId: profile.userId,
        lineDisplayName: profile.displayName,
        lineLinkedAt: now,
      },
    });

    // Also update Staff table if user is staff type
    if (user.role !== "visitor" && user.refId) {
      await prisma.staff.update({
        where: { id: user.refId },
        data: {
          lineUserId: profile.userId,
          lineDisplayName: profile.displayName,
          lineLinkedAt: now,
        },
      }).catch(() => {
        // Staff record may not exist — ignore
      });
    }

    return apiSuccess({
      linked: true,
      lineUserId: profile.userId,
      lineDisplayName: profile.displayName,
      lineLinkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/users/me/line/link error:", error);
    return apiError("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
