import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, SESSION_COOKIE, type AuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userType,
      email,
      username,
      password,
      firstName,
      lastName,
      phone,
      // Visitor fields
      company,
      idNumber,
      idType,
      // Staff fields
      employeeId,
      departmentId,
      position,
    } = body as {
      userType?: string;
      email?: string;
      username?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      company?: string;
      idNumber?: string;
      idType?: string;
      employeeId?: string;
      departmentId?: number;
      position?: string;
    };

    // ===== Validate common required fields =====
    if (!userType || !["visitor", "staff"].includes(userType)) {
      return apiError("INVALID_USER_TYPE", "ประเภทผู้ใช้ไม่ถูกต้อง (visitor หรือ staff เท่านั้น)");
    }
    if (!email?.trim()) {
      return apiError("MISSING_EMAIL", "กรุณากรอกอีเมล");
    }
    if (!password?.trim()) {
      return apiError("MISSING_PASSWORD", "กรุณากรอกรหัสผ่าน");
    }
    if (password.length < 8) {
      return apiError("WEAK_PASSWORD", "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    }
    if (!firstName?.trim() || !lastName?.trim()) {
      return apiError("MISSING_NAME", "กรุณากรอกชื่อและนามสกุล");
    }
    if (!phone?.trim()) {
      return apiError("MISSING_PHONE", "กรุณากรอกเบอร์โทรศัพท์");
    }

    // ===== Validate visitor-specific fields =====
    if (userType === "visitor") {
      if (!idNumber?.trim()) {
        return apiError("MISSING_ID_NUMBER", "กรุณากรอกเลขบัตรประชาชน/พาสปอร์ต");
      }
      if (!idType || !["thai-id", "passport"].includes(idType)) {
        return apiError("INVALID_ID_TYPE", "ประเภทบัตรไม่ถูกต้อง (thai-id หรือ passport)");
      }
    }

    // ===== Validate staff-specific fields =====
    if (userType === "staff") {
      if (!employeeId?.trim()) {
        return apiError("MISSING_EMPLOYEE_ID", "กรุณากรอกรหัสพนักงาน");
      }
      if (!departmentId) {
        return apiError("MISSING_DEPARTMENT", "กรุณาเลือกแผนก");
      }
      if (!position?.trim()) {
        return apiError("MISSING_POSITION", "กรุณากรอกตำแหน่ง");
      }
    }

    // ===== Check email uniqueness =====
    const existingEmail = await prisma.userAccount.findFirst({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingEmail) {
      return apiError("EMAIL_EXISTS", "อีเมลนี้ถูกใช้งานแล้ว");
    }

    // ===== Check phone uniqueness =====
    const existingPhone = await prisma.userAccount.findFirst({
      where: { phone: phone.trim() },
    });
    if (existingPhone) {
      return apiError("PHONE_EXISTS", "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว");
    }

    // ===== Check username uniqueness (if provided) =====
    if (username?.trim()) {
      const existingUsername = await prisma.userAccount.findFirst({
        where: { username: username.trim() },
      });
      if (existingUsername) {
        return apiError("USERNAME_EXISTS", "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว");
      }
    }

    // ===== Hash password =====
    const passwordHash = await hashPassword(password);

    // ===== Create records based on userType =====
    let refId: number;
    let departmentName: string | null = null;
    const role = userType; // default role = userType

    if (userType === "visitor") {
      // Create Visitor record first
      const visitor = await prisma.visitor.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          idNumber: idNumber!.trim(),
          idType: idType!,
          company: company?.trim() || null,
          phone: phone.trim(),
          email: email.toLowerCase().trim(),
        },
      });
      refId = visitor.id;
    } else {
      // Staff: find existing or create Staff record
      const existingStaff = await prisma.staff.findUnique({
        where: { employeeId: employeeId!.trim() },
        include: { department: { select: { id: true, name: true } } },
      });

      if (existingStaff) {
        // Staff already in DB (from seed/HR import) — link to this record
        refId = existingStaff.id;
        departmentName = existingStaff.department?.name ?? null;
      } else {
        // New staff — create record
        const staff = await prisma.staff.create({
          data: {
            employeeId: employeeId!.trim(),
            name: `${firstName.trim()} ${lastName.trim()}`,
            nameEn: `${firstName.trim()} ${lastName.trim()}`,
            position: position!.trim(),
            departmentId: departmentId!,
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            role: role,
            status: "active",
          },
          include: { department: { select: { id: true, name: true } } },
        });
        refId = staff.id;
        departmentName = staff.department?.name ?? null;
      }
    }

    // ===== Create UserAccount =====
    const userAccount = await prisma.userAccount.create({
      data: {
        email: email.toLowerCase().trim(),
        username: username?.trim() || null,
        passwordHash,
        userType,
        role,
        refId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      },
    });

    // ===== Auto-login: create JWT & set cookie =====
    const authUser: AuthUser = {
      id: userAccount.id,
      username: userAccount.username ?? userAccount.email.split("@")[0],
      email: userAccount.email,
      name: `${userAccount.firstName} ${userAccount.lastName}`,
      nameEn: `${userAccount.firstName} ${userAccount.lastName}`,
      role: role as AuthUser["role"],
      departmentId: userType === "staff" ? departmentId! : null,
      departmentName,
    };

    const token = await createToken(authUser);

    const response = NextResponse.json({
      success: true,
      data: { user: authUser },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return apiError("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
