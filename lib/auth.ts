// ===== eVMS Auth Library =====
// JWT-based authentication with cookie session
// รองรับ login ด้วย username หรือ email
// ใช้ Prisma query MariaDB จริง

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { AppRole } from "./auth-config";

// ===== Types =====

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  name: string;
  nameEn: string;
  role: AppRole;
  departmentId: number | null;
  departmentName: string | null;
  refId?: number | null;
  avatar?: string;
}

export interface UserRecord extends AuthUser {
  passwordHash: string;
  status: "active" | "inactive" | "locked";
}

// ===== JWT Config =====

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "evms-dev-secret-key-change-in-production"
);
const JWT_EXPIRES = "8h";
const COOKIE_NAME = "evms_session";

export const SALT_ROUNDS = 10;

// ===== Auth Functions =====

/** ค้นหา user จาก username หรือ email (query จาก MariaDB) */
export async function findUser(usernameOrEmail: string): Promise<UserRecord | null> {
  const input = usernameOrEmail.toLowerCase().trim();

  const user = await prisma.userAccount.findFirst({
    where: {
      OR: [
        { email: { equals: input } },
        { username: { equals: input } },
      ],
    },
  });

  if (!user) return null;

  // Lookup department from staff table (for staff/admin/supervisor users)
  let departmentId: number | null = null;
  let departmentName: string | null = null;
  let nameEn = `${user.firstName} ${user.lastName}`;

  if (user.userType === "staff" && user.refId) {
    const staffRecord = await prisma.staff.findUnique({
      where: { id: user.refId },
      include: { department: { select: { id: true, name: true } } },
    });
    if (staffRecord) {
      departmentId = staffRecord.departmentId;
      departmentName = staffRecord.department?.name ?? null;
      if (staffRecord.nameEn) nameEn = staffRecord.nameEn;
    }
  }

  return {
    id: user.id,
    username: user.username ?? user.email.split("@")[0],
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    nameEn,
    role: user.role as AppRole,
    departmentId,
    departmentName,
    refId: user.refId ?? null,
    passwordHash: user.passwordHash,
    status: user.isActive ? "active" : "inactive",
  };
}

/** ตรวจสอบรหัสผ่าน (async) */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Hash รหัสผ่าน */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** สร้าง JWT token */
export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    sub: String(user.id),
    username: user.username,
    email: user.email,
    name: user.name,
    nameEn: user.nameEn,
    role: user.role,
    departmentId: user.departmentId,
    departmentName: user.departmentName,
    refId: user.refId ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(JWT_SECRET);
}

/** ถอดรหัส JWT token → AuthUser */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: Number(payload.sub),
      username: payload.username as string,
      email: payload.email as string,
      name: payload.name as string,
      nameEn: payload.nameEn as string,
      role: payload.role as AppRole,
      departmentId: (payload.departmentId as number) ?? null,
      departmentName: (payload.departmentName as string) ?? null,
      refId: (payload.refId as number) ?? null,
    };
  } catch {
    return null;
  }
}

/** อ่าน session จาก cookie (server-side) */
export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Update last_login_at */
export async function updateLastLogin(userId: number): Promise<void> {
  await prisma.userAccount.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

/** ชื่อ cookie สำหรับใช้ใน API routes */
export const SESSION_COOKIE = COOKIE_NAME;
