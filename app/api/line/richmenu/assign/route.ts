import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthUser, apiError } from "@/lib/api-utils";

const ok = (data: unknown) => NextResponse.json({ success: true, data });

/**
 * POST /api/line/richmenu/assign
 * กำหนด Rich Menu ให้ผู้ใช้ตามประเภท (new-friend / visitor / officer)
 */
export async function POST(request: NextRequest) {
  try {
    const result = await requireAuth(request);
    if (!isAuthUser(result)) return result;
    const user = result;

    if (user.role !== "admin" && user.role !== "supervisor") {
      return apiError("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);
    }

    const body = await request.json();
    const { lineUserId, menuType } = body as {
      lineUserId?: string;
      menuType?: string;
    };

    if (!lineUserId?.trim()) {
      return apiError("MISSING_FIELDS", "กรุณาระบุ lineUserId");
    }

    const validTypes = ["new-friend", "visitor", "officer"];
    if (!menuType || !validTypes.includes(menuType)) {
      return apiError("INVALID_MENU_TYPE", `menuType ต้องเป็น ${validTypes.join(", ")}`);
    }

    // Get LINE OA config
    const config = await prisma.lineOaConfig.findFirst({ where: { isActive: true } });
    if (!config || !config.channelAccessToken) {
      return apiError("LINE_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า LINE OA");
    }

    // Determine Rich Menu ID from config
    let richMenuId: string | null = null;
    if (menuType === "visitor") {
      richMenuId = config.richMenuVisitorId;
    } else if (menuType === "officer") {
      richMenuId = config.richMenuOfficerId;
    }
    // new-friend uses default rich menu (no explicit assignment needed, or use a separate ID)

    if (!richMenuId && menuType !== "new-friend") {
      return apiError("RICHMENU_NOT_SET", `ยังไม่ได้ตั้งค่า Rich Menu สำหรับ ${menuType}`);
    }

    // Call LINE API to assign rich menu
    if (richMenuId) {
      const response = await fetch(
        `https://api.line.me/v2/bot/user/${lineUserId.trim()}/richmenu/${richMenuId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.channelAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return apiError("LINE_API_ERROR", `LINE API Error: ${response.status} — ${errorText}`, 502);
      }
    } else {
      // For new-friend, unlink any existing rich menu (revert to default)
      const response = await fetch(
        `https://api.line.me/v2/bot/user/${lineUserId.trim()}/richmenu`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${config.channelAccessToken}`,
          },
        }
      );

      // 404 is OK — means no rich menu was linked
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        return apiError("LINE_API_ERROR", `LINE API Error: ${response.status} — ${errorText}`, 502);
      }
    }

    return ok({
      status: "assigned",
      richMenuId: richMenuId || "default",
      menuType,
      lineUserId: lineUserId.trim(),
      assignedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/line/richmenu/assign error:", error);
    return apiError("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
