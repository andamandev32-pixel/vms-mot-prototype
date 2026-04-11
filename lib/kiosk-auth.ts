// ===== eVMS Kiosk Device Token Authentication =====
// Opaque token-based auth สำหรับ Kiosk devices
// ใช้ random token + SHA-256 hash (ไม่ใช่ JWT เพราะต้องรองรับ server-side revoke)

import { randomBytes, createHash } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { verifyToken, type AuthUser } from "./auth";
import { verifyVisitorToken, type VisitorUser } from "./visitor-auth";

// ===== Types =====

export interface KioskDeviceAuth {
  deviceId: number;
  servicePointId: number;
  serialNumber: string;
  role: "kiosk";
}

export type AuthResult =
  | { authType: "staff"; user: AuthUser; device: null }
  | { authType: "visitor"; user: AuthUser; device: null }
  | { authType: "kiosk"; user: null; device: KioskDeviceAuth }

// ===== Constants =====

const TOKEN_PREFIX = "kvms_";
const TOKEN_BYTES = 32; // 256 bits → 64 hex chars
const PREFIX_LENGTH = 8; // ตัวอักษรแรกของ hex part สำหรับ DB lookup

// ===== Token Generation =====

/** สร้าง device token ใหม่ — return raw token (แสดงครั้งเดียว), hash, prefix สำหรับเก็บใน DB */
export function generateDeviceToken(): {
  token: string;
  tokenHash: string;
  tokenPrefix: string;
} {
  const randomHex = randomBytes(TOKEN_BYTES).toString("hex");
  const token = `${TOKEN_PREFIX}${randomHex}`;
  const tokenHash = hashToken(token);
  const tokenPrefix = token.substring(0, TOKEN_PREFIX.length + PREFIX_LENGTH);

  return { token, tokenHash, tokenPrefix };
}

/** SHA-256 hash ของ token */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ===== Token Verification =====

/** ตรวจสอบ kiosk device token → return device info หรือ null */
export async function verifyKioskDeviceToken(
  token: string
): Promise<KioskDeviceAuth | null> {
  if (!token.startsWith(TOKEN_PREFIX)) return null;

  // Dev-mode bypass: prototype token → ไม่ต้อง lookup DB
  if (process.env.NODE_ENV !== "production" && token.startsWith("kvms_prototype_")) {
    const parts = token.split("_");
    // format: kvms_prototype_{servicePointId}_{random}
    const spId = parseInt(parts[2], 10);
    if (!isNaN(spId)) {
      return {
        deviceId: 0,
        servicePointId: spId,
        serialNumber: `PROTO-${spId}`,
        role: "kiosk",
      };
    }
  }

  const prefix = token.substring(0, TOKEN_PREFIX.length + PREFIX_LENGTH);
  const incomingHash = hashToken(token);

  const device = await prisma.kioskDevice.findFirst({
    where: {
      tokenPrefix: prefix,
      status: "active",
    },
  });

  if (!device) return null;

  // Timing-safe compare (ป้องกัน timing attack)
  if (device.tokenHash !== incomingHash) return null;

  // ตรวจ expiry
  if (device.expiresAt && device.expiresAt < new Date()) return null;

  return {
    deviceId: device.id,
    servicePointId: device.servicePointId,
    serialNumber: device.serialNumber,
    role: "kiosk",
  };
}

/** Extract kiosk token จาก Authorization header แล้ว verify */
export async function getKioskAuth(
  request: NextRequest
): Promise<KioskDeviceAuth | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  const device = await verifyKioskDeviceToken(token);

  if (device) {
    // Update lastSeenAt แบบ fire-and-forget (ไม่ block response)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    prisma.kioskDevice
      .update({
        where: { id: device.deviceId },
        data: { lastSeenAt: new Date(), lastIpAddress: ip },
      })
      .catch(() => {}); // silent fail — ไม่ block auth flow
  }

  return device;
}

// ===== Unified Auth Helper =====

/** ตรวจสอบ auth: staff cookie → visitor cookie → kiosk device token */
export async function getAuthUserOrKiosk(
  request: NextRequest
): Promise<AuthResult | null> {
  // 1. Try staff session cookie
  const staffToken = request.cookies.get("evms_session")?.value;
  if (staffToken) {
    const user = await verifyToken(staffToken);
    if (user) return { authType: "staff", user, device: null };
  }

  // 1b. Try staff Bearer token (Authorization: Bearer <jwt>) — for mobile/API clients
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7);
    // ถ้าไม่ใช่ kiosk token (kvms_) → ลอง verify เป็น staff JWT
    if (!bearerToken.startsWith("kvms_")) {
      const user = await verifyToken(bearerToken);
      if (user) return { authType: "staff", user, device: null };
    }
  }

  // 2. Try visitor session cookie
  const visitorToken = request.cookies.get("evms_visitor_session")?.value;
  if (visitorToken) {
    const visitor = await verifyVisitorToken(visitorToken);
    if (visitor) {
      // Map VisitorUser → AuthUser shape สำหรับ compatibility
      const user: AuthUser = {
        id: visitor.id,
        username: visitor.email || "",
        email: visitor.email || "",
        name: `${visitor.firstName} ${visitor.lastName}`,
        nameEn: `${visitor.firstName} ${visitor.lastName}`,
        role: "visitor",
        departmentId: null,
        departmentName: null,
      };
      return { authType: "visitor", user, device: null };
    }
  }

  // 3. Try kiosk device token (Authorization: Bearer kvms_...)
  const device = await getKioskAuth(request);
  if (device) return { authType: "kiosk", user: null, device };

  return null;
}

/** ตรวจสอบ auth: staff cookie → staff Bearer → kiosk device token (ไม่รวม visitor) */
export async function getStaffOrKiosk(
  request: NextRequest
): Promise<AuthResult | null> {
  const staffToken = request.cookies.get("evms_session")?.value;
  if (staffToken) {
    const user = await verifyToken(staffToken);
    if (user) return { authType: "staff", user, device: null };
  }

  // Try staff Bearer token (Authorization: Bearer <jwt>)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7);
    if (!bearerToken.startsWith("kvms_")) {
      const user = await verifyToken(bearerToken);
      if (user) return { authType: "staff", user, device: null };
    }
  }

  const device = await getKioskAuth(request);
  if (device) return { authType: "kiosk", user: null, device };

  return null;
}
