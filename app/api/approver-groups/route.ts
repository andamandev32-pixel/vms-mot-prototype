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
// GET /api/approver-groups — รายการกลุ่มผู้อนุมัติทั้งหมด
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const isActive = searchParams.get("isActive");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (departmentId) where.departmentId = parseInt(departmentId, 10);
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;

    const groups = await prisma.approverGroup.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, nameEn: true } },
        members: {
          include: {
            staff: {
              select: { id: true, name: true, nameEn: true, position: true, email: true },
            },
          },
        },
        purposes: {
          include: {
            visitPurpose: { select: { id: true, name: true, nameEn: true } },
          },
        },
        notifyChannels: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ groups });
  } catch (error) {
    console.error("GET /api/approver-groups error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/approver-groups — สร้างกลุ่มผู้อนุมัติใหม่ (admin)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const body = await request.json();
    const { name, nameEn, description, departmentId, isActive } = body as {
      name?: string;
      nameEn?: string;
      description?: string;
      departmentId?: number;
      isActive?: boolean;
    };

    if (!name?.trim() || !nameEn?.trim() || !departmentId) {
      return err("MISSING_FIELDS", "กรุณากรอก name, nameEn และ departmentId");
    }

    const group = await prisma.approverGroup.create({
      data: {
        name: name.trim(),
        nameEn: nameEn.trim(),
        description: description?.trim() || "",
        departmentId,
        isActive: isActive ?? true,
      },
      include: {
        department: { select: { id: true, name: true, nameEn: true } },
        members: true,
      },
    });

    return ok({ group });
  } catch (error) {
    console.error("POST /api/approver-groups error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
