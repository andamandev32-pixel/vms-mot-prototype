import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBulkEmail } from "@/lib/email-sender";
import { renderEventInvitationEmail } from "@/lib/email-templates/event-invitation";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────
// POST /api/appointments/groups/[id]/send-email — send event invitations
// ─────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role === "visitor") return err("FORBIDDEN", "ไม่อนุญาต", 403);

    const { id } = await params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) return err("INVALID_ID", "ID ไม่ถูกต้อง");

    const body = await request.json().catch(() => ({}));
    const { visitorIds } = body as { visitorIds?: number[] };

    // Load group with appointments and visitors
    const group = await prisma.appointmentGroup.findUnique({
      where: { id: groupId },
      include: {
        createdByStaff: { select: { name: true } },
        department: { select: { name: true } },
        appointments: {
          include: {
            visitor: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!group) return err("NOT_FOUND", "ไม่พบกลุ่มนัดหมาย", 404);

    // Only creator or admin can send emails
    if (user.role !== "admin" && user.role !== "supervisor" && group.createdByStaffId !== user.id) {
      return err("FORBIDDEN", "เฉพาะผู้สร้างหรือผู้ดูแลเท่านั้น", 403);
    }

    // Filter appointments by visitorIds if provided
    let appointments = group.appointments;
    if (visitorIds && visitorIds.length > 0) {
      appointments = appointments.filter((a) => visitorIds.includes(a.visitor.id));
    }

    // Build recipients list (only visitors with email)
    const recipients = appointments
      .filter((a) => a.visitor.email)
      .map((a) => ({
        email: a.visitor.email!,
        name: a.visitor.name,
        bookingCode: a.bookingCode,
      }));

    if (recipients.length === 0) {
      return ok({ sent: 0, skipped: appointments.length, failed: 0, errors: [], message: "ไม่มีผู้เข้าร่วมที่มีอีเมล" });
    }

    // Build location string
    const locationParts = [group.room, group.floor ? `ชั้น ${group.floor}` : null, group.building].filter(Boolean);
    const location = locationParts.join(", ") || undefined;

    const subject = `แจ้งเตือนกิจกรรม: ${group.name}`;

    const result = await sendBulkEmail(
      recipients,
      subject,
      (recipient) => {
        const r = recipients.find((r) => r.email === recipient.email);
        return renderEventInvitationEmail({
          eventName: group.name,
          eventNameEn: group.nameEn || undefined,
          description: group.description || undefined,
          dateStart: formatDate(group.dateStart),
          dateEnd: group.dateEnd ? formatDate(group.dateEnd) : undefined,
          timeStart: formatTime(group.timeStart),
          timeEnd: formatTime(group.timeEnd),
          location,
          visitorName: recipient.name,
          bookingCode: r?.bookingCode || "",
          organizerName: group.createdByStaff.name,
          departmentName: group.department.name,
        });
      }
    );

    return ok({
      ...result,
      totalVisitors: appointments.length,
      withEmail: recipients.length,
    });
  } catch (error) {
    console.error("POST /api/appointments/groups/[id]/send-email error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
