// ===== eVMS API Utilities =====
// Shared helpers for API routes: auth checks, pagination, standard responses

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, type AuthUser } from "./auth";
import { getScope, type AppRole, type Action } from "./auth-config";

// ===== Standard Responses =====

/** สร้าง success response มาตรฐาน */
export function apiSuccess(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** สร้าง error response มาตรฐาน */
export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

// ===== Auth Helpers =====

/** ดึง AuthUser จาก cookie หรือ Authorization header — คืน 401 response ถ้าไม่มี session */
export async function requireAuth(
  request: NextRequest
): Promise<AuthUser | NextResponse> {
  let token = request.cookies.get("evms_session")?.value;

  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
  }

  const user = await verifyToken(token);
  if (!user) {
    return apiError("UNAUTHORIZED", "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่", 401);
  }

  return user;
}

/** ตรวจสอบว่า user มี role ที่กำหนด — คืน null ถ้าผ่าน หรือ 403 response ถ้าไม่ผ่าน */
export function requireRole(
  user: AuthUser,
  ...roles: AppRole[]
): NextResponse | null {
  if (roles.includes(user.role as AppRole)) {
    return null; // OK — user has required role
  }
  return apiError(
    "FORBIDDEN",
    "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
    403
  );
}

// ===== Pagination =====

/** แปลง query params เป็น pagination object */
export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// ===== Helpers =====

/** Helper: ตรวจสอบว่า requireAuth คืน user หรือ error response */
export function isAuthUser(
  result: AuthUser | NextResponse
): result is AuthUser {
  return !(result instanceof NextResponse);
}
