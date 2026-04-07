import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupPersonnel } from "@/lib/mock-data";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body as { query?: string };

    if (!query?.trim()) {
      return apiError("MISSING_QUERY", "กรุณากรอกรหัสพนักงานหรือเลขบัตรประชาชน");
    }

    // Lookup from personnel database
    const personnel = lookupPersonnel(query.trim());
    if (!personnel) {
      return apiError("NOT_FOUND", "ไม่พบข้อมูลพนักงาน กรุณาตรวจสอบรหัสอีกครั้ง", 404);
    }

    // Check if this employee already has an account
    const existingAccount = await prisma.userAccount.findFirst({
      where: {
        userType: "staff",
        refId: personnel.id,
      },
      select: { id: true, email: true },
    });

    // Lookup email from staff table if available
    const staffRecord = await prisma.staff.findUnique({
      where: { employeeId: personnel.employeeId },
      select: { email: true, phone: true },
    });

    return apiSuccess({
      personnel: {
        id: personnel.id,
        employeeId: personnel.employeeId,
        firstName: personnel.firstName,
        lastName: personnel.lastName,
        firstNameEn: personnel.firstNameEn,
        lastNameEn: personnel.lastNameEn,
        position: personnel.position,
        departmentId: personnel.departmentId,
        departmentName: personnel.departmentName,
        email: staffRecord?.email || null,
        phone: staffRecord?.phone || null,
      },
      hasAccount: !!existingAccount,
    });
  } catch (error) {
    console.error("Check staff error:", error);
    return apiError("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
