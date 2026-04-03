// ===== eVMS Visitor Auth Library =====
// JWT-based authentication for visitor self-service portal
// แยก session cookie จาก staff (evms_visitor_session)

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// ===== Types =====

export interface VisitorUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string | null;
}

// ===== JWT Config =====

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "evms-dev-secret-key-change-in-production"
);
const JWT_EXPIRES = "24h";
export const VISITOR_COOKIE_NAME = "evms_visitor_session";
const SALT_ROUNDS = 10;

// ===== Auth Functions =====

/** Hash password */
export async function hashVisitorPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verify password */
export async function verifyVisitorPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create JWT for visitor */
export async function createVisitorToken(visitor: VisitorUser): Promise<string> {
  return new SignJWT({
    sub: String(visitor.id),
    firstName: visitor.firstName,
    lastName: visitor.lastName,
    email: visitor.email,
    phone: visitor.phone,
    company: visitor.company,
    role: "visitor",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(JWT_SECRET);
}

/** Verify visitor JWT token */
export async function verifyVisitorToken(token: string): Promise<VisitorUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "visitor") return null;
    return {
      id: Number(payload.sub),
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
      email: payload.email as string,
      phone: payload.phone as string,
      company: (payload.company as string) ?? null,
    };
  } catch {
    return null;
  }
}

/** Read visitor session from cookie (server-side) */
export async function getVisitorSession(): Promise<VisitorUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(VISITOR_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyVisitorToken(token);
}

/** Update visitor last_login_at */
export async function updateVisitorLastLogin(visitorId: number): Promise<void> {
  await prisma.visitor.update({
    where: { id: visitorId },
    data: { lastLoginAt: new Date() },
  });
}
