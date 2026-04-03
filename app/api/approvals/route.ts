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
// GET /api/approvals
// คืนรายการนัดหมายที่ต้องอนุมัติ กรองตามกลุ่มผู้อนุมัติ (server-side)
// Query params:
//   approverGroupId - กรอง specific group (optional)
//   status          - pending | approved | rejected | tracking (default: all)
//   dateFrom        - วันเริ่มต้น YYYY-MM-DD
//   dateTo          - วันสิ้นสุด YYYY-MM-DD
//   search          - ค้นหาชื่อ / รหัส / บริษัท
//   page            - หน้า (default 1)
//   limit           - จำนวนต่อหน้า (default 20)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    if (user.role === "visitor") {
      return err("FORBIDDEN", "ผู้เยี่ยมชมไม่สามารถเข้าถึงหน้าอนุมัติได้", 403);
    }

    const { searchParams } = new URL(request.url);
    const approverGroupId = searchParams.get("approverGroupId");
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const staffId = user.refId;
    const isAdminOrSupervisor = user.role === "admin" || user.role === "supervisor";

    // ─── Step 1: Determine which purpose+department pairs this user can approve ───

    type PurposeDeptPair = { visitPurposeId: number; departmentId: number };
    let purposeDepartmentPairs: PurposeDeptPair[] = [];
    let canApproveAll = false;

    if (isAdminOrSupervisor) {
      canApproveAll = true;
    } else if (staffId) {
      // Build pairs from user's approver group memberships
      const memberships = await prisma.approverGroupMember.findMany({
        where: {
          staffId,
          canApprove: true,
          approverGroup: {
            isActive: true,
            ...(approverGroupId ? { id: parseInt(approverGroupId, 10) } : {}),
          },
        },
        include: {
          approverGroup: {
            include: {
              purposes: { select: { visitPurposeId: true } },
            },
          },
        },
      });

      const pairSet = new Set<string>();
      for (const m of memberships) {
        const deptId = m.approverGroup.departmentId;
        for (const p of m.approverGroup.purposes) {
          const key = `${p.visitPurposeId}-${deptId}`;
          if (!pairSet.has(key)) {
            pairSet.add(key);
            purposeDepartmentPairs.push({
              visitPurposeId: p.visitPurposeId,
              departmentId: deptId,
            });
          }
        }
      }

      if (purposeDepartmentPairs.length === 0) {
        // User is not in any approver group → return empty
        return ok({
          appointments: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          stats: { pending: 0, approvedToday: 0, rejected: 0, onSite: 0 },
        });
      }
    } else {
      return ok({
        appointments: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: { pending: 0, approvedToday: 0, rejected: 0, onSite: 0 },
      });
    }

    // For admin/supervisor with specific group filter
    if (isAdminOrSupervisor && approverGroupId) {
      canApproveAll = false;
      const group = await prisma.approverGroup.findUnique({
        where: { id: parseInt(approverGroupId, 10) },
        include: {
          purposes: { select: { visitPurposeId: true } },
        },
      });
      if (group) {
        purposeDepartmentPairs = group.purposes.map(p => ({
          visitPurposeId: p.visitPurposeId,
          departmentId: group.departmentId,
        }));
      }
    }

    // ─── Step 2: Build Prisma where clause ───

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Purpose+Department filter (only if not approveAll without group filter)
    if (!canApproveAll && purposeDepartmentPairs.length > 0) {
      where.OR = purposeDepartmentPairs.map(p => ({
        visitPurposeId: p.visitPurposeId,
        departmentId: p.departmentId,
      }));
    }

    // Status filter
    if (status === "pending") {
      where.status = "pending";
    } else if (status === "approved") {
      where.status = { in: ["approved", "confirmed"] };
    } else if (status === "rejected") {
      where.status = "rejected";
    } else if (status === "tracking") {
      // Approved appointments with at least one checked-in entry
      where.status = { in: ["approved", "confirmed"] };
      where.visitEntries = { some: { status: "checked-in" } };
    }
    // "all" or empty → no status filter (but exclude cancelled/expired for cleaner view)
    if (!status) {
      where.status = { notIn: ["cancelled", "expired"] };
    }

    // Date range filter
    if (dateFrom) {
      where.dateStart = { ...(where.dateStart || {}), gte: new Date(dateFrom) };
    }
    if (dateTo) {
      where.dateStart = { ...(where.dateStart || {}), lte: new Date(dateTo + "T23:59:59") };
    }

    // Search filter
    if (search) {
      const searchConditions = [
        { bookingCode: { contains: search } },
        { purpose: { contains: search } },
        { visitor: { name: { contains: search } } },
        { visitor: { phone: { contains: search } } },
        { hostStaff: { name: { contains: search } } },
      ];

      if (where.OR) {
        // Combine purpose+dept filter with search
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // ─── Step 3: Query appointments + stats ───

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build stats where base (same purpose+dept filter, no status/date/search)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statsWhereBase: any = {};
    if (!canApproveAll && purposeDepartmentPairs.length > 0) {
      statsWhereBase.OR = purposeDepartmentPairs.map(p => ({
        visitPurposeId: p.visitPurposeId,
        departmentId: p.departmentId,
      }));
    }

    const [appointments, total, pendingCount, approvedTodayCount, rejectedCount, onSiteCount] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          visitor: {
            select: {
              id: true, firstName: true, lastName: true, name: true,
              company: true, phone: true, email: true, photo: true,
            },
          },
          hostStaff: {
            select: {
              id: true, name: true, nameEn: true, position: true,
              departmentId: true, email: true, phone: true,
            },
          },
          department: { select: { id: true, name: true, nameEn: true } },
          visitPurpose: { select: { id: true, name: true, nameEn: true } },
          approvedByStaff: { select: { id: true, name: true, nameEn: true } },
          visitEntries: {
            select: {
              id: true, entryCode: true, status: true,
              checkinAt: true, checkoutAt: true, checkinChannel: true,
            },
            orderBy: { checkinAt: "desc" },
            take: 5,
          },
          _count: { select: { visitEntries: true, companions: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointment.count({ where }),
      // Stats: pending count
      prisma.appointment.count({
        where: { ...statsWhereBase, status: "pending" },
      }),
      // Stats: approved today
      prisma.appointment.count({
        where: {
          ...statsWhereBase,
          status: { in: ["approved", "confirmed"] },
          approvedAt: { gte: today, lt: tomorrow },
        },
      }),
      // Stats: rejected count (all time, for context)
      prisma.appointment.count({
        where: { ...statsWhereBase, status: "rejected" },
      }),
      // Stats: currently on-site (checked-in entries)
      prisma.appointment.count({
        where: {
          ...statsWhereBase,
          status: { in: ["approved", "confirmed"] },
          visitEntries: { some: { status: "checked-in" } },
        },
      }),
    ]);

    return ok({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        pending: pendingCount,
        approvedToday: approvedTodayCount,
        rejected: rejectedCount,
        onSite: onSiteCount,
      },
    });
  } catch (error) {
    console.error("GET /api/approvals error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
