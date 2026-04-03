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
// GET /api/approver-groups/my-groups
// คืนกลุ่มผู้อนุมัติที่ user เป็นสมาชิก (canApprove = true)
// พร้อม visitPurposeIds + departmentId สำหรับ filter ด้าน frontend
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    if (user.role === "visitor") {
      return err("FORBIDDEN", "ผู้เยี่ยมชมไม่สามารถเข้าถึงกลุ่มผู้อนุมัติได้", 403);
    }

    // user.refId = Staff.id (from auth token)
    const staffId = user.refId;
    if (!staffId) {
      return ok({ groups: [], purposeDepartmentPairs: [] });
    }

    // Admin/supervisor can approve everything — return empty to signal "no filter needed"
    if (user.role === "admin" || user.role === "supervisor") {
      return ok({ groups: [], purposeDepartmentPairs: [], canApproveAll: true });
    }

    // Find groups where this staff is a member with canApprove = true
    const memberships = await prisma.approverGroupMember.findMany({
      where: {
        staffId,
        canApprove: true,
        approverGroup: { isActive: true },
      },
      include: {
        approverGroup: {
          include: {
            department: { select: { id: true, name: true, nameEn: true } },
            purposes: {
              include: {
                visitPurpose: { select: { id: true, name: true, nameEn: true } },
              },
            },
          },
        },
      },
    });

    const groups = memberships.map(m => ({
      id: m.approverGroup.id,
      name: m.approverGroup.name,
      nameEn: m.approverGroup.nameEn,
      departmentId: m.approverGroup.departmentId,
      department: m.approverGroup.department,
      purposes: m.approverGroup.purposes.map(p => ({
        visitPurposeId: p.visitPurposeId,
        visitPurpose: p.visitPurpose,
      })),
    }));

    // Build unique (visitPurposeId, departmentId) pairs for frontend filter
    const pairSet = new Set<string>();
    const purposeDepartmentPairs: { visitPurposeId: number; departmentId: number }[] = [];
    for (const g of groups) {
      for (const p of g.purposes) {
        const key = `${p.visitPurposeId}-${g.departmentId}`;
        if (!pairSet.has(key)) {
          pairSet.add(key);
          purposeDepartmentPairs.push({
            visitPurposeId: p.visitPurposeId,
            departmentId: g.departmentId,
          });
        }
      }
    }

    return ok({ groups, purposeDepartmentPairs, canApproveAll: false });
  } catch (error) {
    console.error("GET /api/approver-groups/my-groups error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
