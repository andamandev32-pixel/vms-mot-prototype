import { NextRequest, NextResponse } from "next/server";
import { verifyToken, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/auth-config";

// ===== Inline response helpers (จนกว่า api-utils จะพร้อม) =====
const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ===== Helper: ดึง authenticated user จาก cookie =====
async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

const VALID_ROLES: AppRole[] = ["visitor", "staff", "supervisor", "security", "admin"];

// ─────────────────────────────────────────────────────
// GET /api/users — รายชื่อผู้ใช้ (admin/supervisor only)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้", 403);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || ""; // "active" | "inactive"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    if (role && VALID_ROLES.includes(role as AppRole)) {
      where.role = role;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      prisma.userAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          userType: true,
          role: true,
          refId: true,
          isActive: true,
          isEmailVerified: true,
          lineUserId: true,
          lineDisplayName: true,
          lineLinkedAt: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.userAccount.count({ where }),
    ]);

    // Enrich staff users with department info
    const staffRefIds = users
      .filter((u) => u.userType === "staff" && u.refId)
      .map((u) => u.refId as number);

    let staffMap: Record<number, { departmentId: number; departmentName: string; position: string }> = {};
    if (staffRefIds.length > 0) {
      const staffRecords = await prisma.staff.findMany({
        where: { id: { in: staffRefIds } },
        include: { department: { select: { id: true, name: true } } },
      });
      staffMap = Object.fromEntries(
        staffRecords.map((s) => [
          s.id,
          {
            departmentId: s.departmentId,
            departmentName: s.department?.name ?? "",
            position: s.position,
          },
        ])
      );
    }

    const data = users.map((u) => {
      const staff = u.refId ? staffMap[u.refId] : null;
      return {
        ...u,
        departmentId: staff?.departmentId ?? null,
        departmentName: staff?.departmentName ?? null,
        position: staff?.position ?? null,
      };
    });

    return ok({
      users: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/users — สร้างผู้ใช้ใหม่ (admin only)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถสร้างผู้ใช้ได้", 403);
    }

    const body = await request.json();
    const { email, username, password, firstName, lastName, phone, userType, role } = body as {
      email?: string;
      username?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      userType?: string;
      role?: string;
    };

    // Validate required fields
    if (!email?.trim() || !password?.trim() || !firstName?.trim() || !lastName?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอก email, รหัสผ่าน, ชื่อ และนามสกุล");
    }

    if (!role || !VALID_ROLES.includes(role as AppRole)) {
      return err("INVALID_ROLE", `บทบาทไม่ถูกต้อง ต้องเป็น: ${VALID_ROLES.join(", ")}`);
    }

    if (!userType || !["staff", "visitor", "external"].includes(userType)) {
      return err("INVALID_USER_TYPE", "ประเภทผู้ใช้ไม่ถูกต้อง ต้องเป็น: staff, visitor, external");
    }

    // Check email uniqueness
    const existing = await prisma.userAccount.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return err("EMAIL_EXISTS", "อีเมลนี้ถูกใช้งานแล้ว");
    }

    // Check username uniqueness (if provided)
    if (username?.trim()) {
      const existingUsername = await prisma.userAccount.findUnique({
        where: { username: username.trim() },
      });
      if (existingUsername) {
        return err("USERNAME_EXISTS", "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว");
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await prisma.userAccount.create({
      data: {
        email: email.toLowerCase().trim(),
        username: username?.trim() || null,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        userType,
        role,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        userType: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return ok({ user: newUser });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
