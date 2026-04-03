import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// GET /api/blocklist — รายการบุคคลต้องห้าม (admin/supervisor)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { company: { contains: search } },
        { reason: { contains: search } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const [blocklist, total] = await Promise.all([
      prisma.blocklist.findMany({
        where,
        skip,
        take: limit,
        include: {
          visitor: {
            select: { id: true, firstName: true, lastName: true, name: true, idNumber: true, company: true, phone: true },
          },
          addedByStaff: {
            select: { id: true, name: true, nameEn: true },
          },
        },
        orderBy: { addedAt: "desc" },
      }),
      prisma.blocklist.count({ where }),
    ]);

    return ok({
      blocklist,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/blocklist error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/blocklist — เพิ่มรายการบุคคลต้องห้าม (admin/supervisor)
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
    const { visitorId, reason, type, expiryDate, blockedBy, firstName, lastName, company } = body as {
      visitorId?: number;
      reason?: string;
      type?: string;
      expiryDate?: string;
      blockedBy?: number;
      firstName?: string;
      lastName?: string;
      company?: string;
    };

    if (!reason?.trim() || !type?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอกเหตุผลและประเภทการบล็อก");
    }

    // Resolve names from visitor if visitorId provided
    let resolvedFirstName = firstName?.trim() || "";
    let resolvedLastName = lastName?.trim() || "";
    let resolvedCompany = company?.trim() || null;

    if (visitorId) {
      const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
      if (!visitor) {
        return err("VISITOR_NOT_FOUND", "ไม่พบข้อมูลผู้เยี่ยมชม", 404);
      }
      resolvedFirstName = resolvedFirstName || visitor.firstName;
      resolvedLastName = resolvedLastName || visitor.lastName;
      resolvedCompany = resolvedCompany || visitor.company || null;
    }

    if (!resolvedFirstName || !resolvedLastName) {
      return err("MISSING_FIELDS", "กรุณาระบุชื่อและนามสกุล");
    }

    // Lookup staff id from user account's refId
    let staffId = blockedBy;
    if (!staffId) {
      const userAccount = await prisma.userAccount.findUnique({ where: { id: user.id }, select: { refId: true } });
      staffId = userAccount?.refId ?? user.id;
    }
    const addedBy = staffId;

    const blockEntry = await prisma.blocklist.create({
      data: {
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        company: resolvedCompany,
        visitorId: visitorId || null,
        reason: reason.trim(),
        type: type.trim(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        addedBy,
      },
      include: {
        visitor: {
          select: { id: true, firstName: true, lastName: true, name: true, idNumber: true },
        },
        addedByStaff: {
          select: { id: true, name: true, nameEn: true },
        },
      },
    });

    // Update visitor.isBlocked if visitorId provided
    if (visitorId) {
      await prisma.visitor.update({
        where: { id: visitorId },
        data: { isBlocked: true },
      });
    }

    return ok({ blockEntry });
  } catch (error) {
    console.error("POST /api/blocklist error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
