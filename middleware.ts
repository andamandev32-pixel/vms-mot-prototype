import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "evms-dev-secret-key-change-in-production"
);
const STAFF_COOKIE = "evms_session";
const VISITOR_COOKIE = "evms_visitor_session";

// Routes ที่ต้อง login ก่อนเข้า (staff)
const PROTECTED_PREFIXES = ["/web/dashboard", "/web/appointments", "/web/search", "/web/blocklist", "/web/reports", "/web/settings", "/web/profile"];

// Visitor protected routes (require visitor session)
const VISITOR_PROTECTED_PREFIXES = ["/visitor/booking", "/visitor/history", "/visitor/profile", "/visitor/booking-status"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ═══ Visitor routes ═══
  const isVisitorProtected = VISITOR_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isVisitorProtected) {
    const token = request.cookies.get(VISITOR_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/visitor", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== "visitor") throw new Error("not visitor");
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL("/visitor", request.url));
      response.cookies.set(VISITOR_COOKIE, "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  // ═══ Staff/admin routes ═══
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(STAFF_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/web", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/web", request.url));
    response.cookies.set(STAFF_COOKIE, "", { maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  matcher: ["/web/:path*", "/visitor/:path*"],
};
