import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupPersonnel } from "@/lib/mock-data";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

/**
 * GET /api/staff/lookup?query=xxx
 * ค้นหาข้อมูลพนักงานด้วยรหัสพนักงาน หรือ เลขบัตรประชาชน
 * สำหรับ LIFF registration (ไม่ต้อง auth — เรียกจาก LIFF ก่อน login)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();
    // Support legacy params
    const employeeId = searchParams.get("employeeId")?.trim();
    const nationalId = searchParams.get("nationalId")?.trim();

    const searchValue = query || employeeId || nationalId;

    if (!searchValue) {
      return err("MISSING_FIELDS", "กรุณาระบุ query (รหัสพนักงาน หรือ เลขบัตรประชาชน)");
    }

    // 1. Lookup from personnel database (mock — มี nationalId)
    const personnel = lookupPersonnel(searchValue);

    if (personnel) {
      // Found in personnel DB → check if already has user account
      const existingAccount = await prisma.userAccount.findFirst({
        where: { refId: personnel.id, userType: "staff" },
        select: { id: true, lineUserId: true },
      });

      return ok({
        staff: {
          id: personnel.id,
          employeeId: personnel.employeeId,
          name: `${personnel.firstName} ${personnel.lastName}`,
          nameEn: `${personnel.firstNameEn} ${personnel.lastNameEn}`,
          position: personnel.position,
          departmentId: personnel.departmentId,
          departmentName: personnel.departmentName,
        },
        hasAccount: !!existingAccount,
        hasLineLinked: !!existingAccount?.lineUserId,
      });
    }

    // 2. Fallback: lookup from staff table by employeeId
    const staff = await prisma.staff.findFirst({
      where: {
        employeeId: searchValue,
        status: "active",
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        nameEn: true,
        position: true,
        departmentId: true,
        department: {
          select: { id: true, name: true, nameEn: true },
        },
      },
    });

    if (!staff) {
      return err("STAFF_NOT_FOUND", "ไม่พบข้อมูลพนักงาน กรุณาตรวจสอบรหัสอีกครั้ง", 404);
    }

    const existingAccount = await prisma.userAccount.findFirst({
      where: { refId: staff.id, userType: "staff" },
      select: { id: true, lineUserId: true },
    });

    return ok({
      staff: {
        id: staff.id,
        employeeId: staff.employeeId,
        name: staff.name,
        nameEn: staff.nameEn,
        position: staff.position,
        departmentId: staff.departmentId,
        departmentName: staff.department?.name || null,
      },
      hasAccount: !!existingAccount,
      hasLineLinked: !!existingAccount?.lineUserId,
    });
  } catch (error) {
    console.error("GET /api/staff/lookup error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
