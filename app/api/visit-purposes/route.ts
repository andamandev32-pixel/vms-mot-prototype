import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { verifyVisitorToken, VISITOR_COOKIE_NAME } from "@/lib/visitor-auth";
import { prisma } from "@/lib/prisma";

// ===== Inline response helpers =====
const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ===== Helper: ดึง authenticated user จาก cookie (staff หรือ visitor) =====
async function getAuthUser(request: NextRequest) {
  const staffToken = request.cookies.get("evms_session")?.value;
  if (staffToken) return await verifyToken(staffToken);
  const visitorToken = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
  if (visitorToken) {
    const v = await verifyVisitorToken(visitorToken);
    if (v) {
      return {
        id: v.id,
        username: v.email,
        email: v.email,
        name: `${v.firstName} ${v.lastName}`,
        nameEn: `${v.firstName} ${v.lastName}`,
        role: "visitor" as const,
        departmentId: null,
        departmentName: null,
      };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────
// GET /api/visit-purposes — รายการวัตถุประสงค์การเข้าเยี่ยม (any authenticated user)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const visitPurposes = await prisma.visitPurpose.findMany({
      include: {
        departmentRules: {
          include: {
            department: { select: { id: true, name: true, nameEn: true } },
          },
        },
        channelConfigs: {
          include: {
            channelDocuments: {
              include: {
                identityDocumentType: { select: { id: true, name: true, nameEn: true } },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return ok({ visitPurposes });
  } catch (error) {
    console.error("GET /api/visit-purposes error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/visit-purposes — สร้างวัตถุประสงค์ใหม่ (admin only)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const body = await request.json();
    const {
      name, nameEn, icon, allowedEntryModes,
      showOnLine, showOnWeb, showOnKiosk, showOnCounter,
      sortOrder, isActive,
    } = body as {
      name?: string;
      nameEn?: string;
      icon?: string;
      allowedEntryModes?: string;
      showOnLine?: boolean;
      showOnWeb?: boolean;
      showOnKiosk?: boolean;
      showOnCounter?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    };

    if (!name?.trim() || !nameEn?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอก name และ nameEn");
    }

    // Determine next sortOrder if not provided
    let order = sortOrder;
    if (order === undefined) {
      const last = await prisma.visitPurpose.findFirst({ orderBy: { sortOrder: "desc" } });
      order = (last?.sortOrder ?? 0) + 1;
    }

    const visitPurpose = await prisma.visitPurpose.create({
      data: {
        name: name.trim(),
        nameEn: nameEn.trim(),
        icon: icon?.trim() || null,
        allowedEntryModes: allowedEntryModes ?? "single",
        showOnLine: showOnLine ?? true,
        showOnWeb: showOnWeb ?? true,
        showOnKiosk: showOnKiosk ?? true,
        showOnCounter: showOnCounter ?? true,
        sortOrder: order,
        isActive: isActive ?? true,
      },
    });

    return ok({ visitPurpose });
  } catch (error) {
    console.error("POST /api/visit-purposes error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
