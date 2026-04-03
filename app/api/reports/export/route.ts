import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ─────────────────────────────────────────────────────
// GET /api/reports/export — ส่งออกข้อมูล CSV (admin/supervisor)
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
    const type = searchParams.get("type") || "visits";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entryWhere: any = {};
    if (dateFrom) {
      entryWhere.checkinAt = { ...(entryWhere.checkinAt || {}), gte: new Date(dateFrom) };
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      entryWhere.checkinAt = { ...(entryWhere.checkinAt || {}), lt: endDate };
    }

    if (type === "visits") {
      const entries = await prisma.visitEntry.findMany({
        where: entryWhere,
        include: {
          visitor: {
            select: {
              firstName: true, lastName: true, name: true, company: true,
              phone: true, idNumber: true, nationality: true,
            },
          },
          appointment: { select: { bookingCode: true, type: true, purpose: true } },
          hostStaff: { select: { name: true, employeeId: true } },
          department: { select: { name: true } },
        },
        orderBy: { checkinAt: "desc" },
        take: 10000,
      });

      const headers = [
        "Entry Code", "Booking Code", "Visitor Name", "Company", "Phone",
        "ID Number", "Nationality", "Host", "Department", "Visit Type",
        "Purpose", "Check-in", "Check-out", "Status",
      ];

      const rows = entries.map((e) => [
        escapeCsv(e.entryCode),
        escapeCsv(e.appointment?.bookingCode),
        escapeCsv(e.visitor.name),
        escapeCsv(e.visitor.company),
        escapeCsv(e.visitor.phone),
        escapeCsv(e.visitor.idNumber),
        escapeCsv(e.visitor.nationality),
        escapeCsv(e.hostStaff?.name),
        escapeCsv(e.department?.name),
        escapeCsv(e.visitType),
        escapeCsv(e.purpose || e.appointment?.purpose),
        escapeCsv(e.checkinAt?.toISOString()),
        escapeCsv(e.checkoutAt?.toISOString()),
        escapeCsv(e.status),
      ].join(","));

      const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="visits-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (type === "visitors") {
      const entries = await prisma.visitEntry.findMany({
        where: entryWhere,
        select: {
          visitorId: true,
          checkinAt: true,
          visitor: {
            select: {
              firstName: true, lastName: true, name: true, company: true,
              phone: true, idNumber: true, nationality: true, email: true,
            },
          },
        },
        orderBy: { checkinAt: "desc" },
        take: 10000,
      });

      // Deduplicate by visitor
      const seen = new Set<number>();
      const uniqueEntries = entries.filter((e) => {
        if (seen.has(e.visitorId)) return false;
        seen.add(e.visitorId);
        return true;
      });

      const headers = [
        "Visitor Name", "Company", "Phone", "Email", "ID Number",
        "Nationality", "Visit Count", "Last Visit",
      ];

      // Count visits per visitor
      const visitCounts: Record<number, number> = {};
      for (const e of entries) {
        visitCounts[e.visitorId] = (visitCounts[e.visitorId] || 0) + 1;
      }

      const rows = uniqueEntries.map((e) => [
        escapeCsv(e.visitor.name),
        escapeCsv(e.visitor.company),
        escapeCsv(e.visitor.phone),
        escapeCsv(e.visitor.email),
        escapeCsv(e.visitor.idNumber),
        escapeCsv(e.visitor.nationality),
        String(visitCounts[e.visitorId] || 1),
        escapeCsv(e.checkinAt?.toISOString()),
      ].join(","));

      const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="visitors-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return err("INVALID_TYPE", "ประเภทรายงานไม่ถูกต้อง (visits/visitors)");
  } catch (error) {
    console.error("GET /api/reports/export error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
