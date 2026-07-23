import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupPersonnel, searchPersonnelByName } from "@/lib/mock-data";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body as { query?: string };

    if (!query?.trim()) {
      return apiError("MISSING_QUERY", "กรุณากรอกชื่อ-นามสกุล รหัสพนักงาน หรือเลขบัตรประชาชน");
    }

    // ค้นหาในทำเนียบได้ 3 คีย์: ชื่อ-นามสกุล / รหัสพนักงาน / เลขบัตรประชาชน
    // (ชื่อซ้ำจะได้หลายคน — ให้ผู้ใช้เลือกเอง)
    const searchTerm = query.trim();
    const byId = lookupPersonnel(searchTerm);
    const byName = searchPersonnelByName(searchTerm);
    const matches = byId
      ? [byId, ...byName.filter((p) => p.id !== byId.id)]
      : byName;

    if (matches.length === 0) {
      return apiError("NOT_FOUND", "ไม่พบข้อมูลพนักงาน กรุณาตรวจสอบข้อมูลอีกครั้ง", 404);
    }

    // ตรวจว่าแต่ละคนมีบัญชี/อีเมลอยู่แล้วหรือไม่
    const candidates = await Promise.all(
      matches.map(async (personnel) => {
        const existingAccount = await prisma.userAccount.findFirst({
          where: { userType: "staff", refId: personnel.id },
          select: { id: true },
        });
        const staffRecord = await prisma.staff.findUnique({
          where: { employeeId: personnel.employeeId },
          select: { email: true, phone: true },
        });
        return {
          id: personnel.id,
          employeeId: personnel.employeeId,
          firstName: personnel.firstName,
          lastName: personnel.lastName,
          firstNameEn: personnel.firstNameEn,
          lastNameEn: personnel.lastNameEn,
          position: personnel.position,
          workGroup: personnel.workGroup,
          departmentId: personnel.departmentId,
          departmentName: personnel.departmentName,
          email: staffRecord?.email || null,
          phone: staffRecord?.phone || null,
          hasAccount: !!existingAccount,
        };
      })
    );

    return apiSuccess({ found: true, candidates });
  } catch (error) {
    console.error("Check staff error:", error);
    return apiError("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
