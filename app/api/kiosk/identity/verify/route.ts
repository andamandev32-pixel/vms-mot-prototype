import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// POST /api/kiosk/identity/verify — Verify identity + blocklist + upsert visitor
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const body = await request.json();
    const { idNumber, fullNameTh, fullNameEn, dateOfBirth, documentType, photo } = body as {
      servicePointId?: number;
      documentType?: string;
      idNumber?: string;
      fullNameTh?: string;
      fullNameEn?: string;
      dateOfBirth?: string;
      address?: string;
      issueDate?: string;
      expiryDate?: string;
      photo?: string;
    };

    if (!idNumber?.trim()) return err("MISSING_FIELDS", "กรุณาระบุ idNumber");
    if (!fullNameTh?.trim()) return err("MISSING_FIELDS", "กรุณาระบุ fullNameTh");

    // Check blocklist first
    const blocked = await prisma.blocklist.findFirst({
      where: {
        OR: [
          { visitor: { idNumber: idNumber.trim() } },
          {
            firstName: fullNameTh.split(" ")[0] || "",
            lastName: fullNameTh.split(" ").slice(1).join(" ") || "",
          },
        ],
        isActive: true,
      },
    });

    if (blocked) {
      return ok({
        status: "blocked",
        isBlocked: true,
        blockReason: blocked.reason || "อยู่ในรายการบล็อค",
        blockedAt: blocked.addedAt?.toISOString(),
        message: "ผู้เยี่ยมชมอยู่ในรายการที่ถูกบล็อค",
      });
    }

    // Parse name parts
    const nameParts = fullNameTh.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const namePartsEn = (fullNameEn || "").trim().split(/\s+/);
    const firstNameEn = namePartsEn[0] || "";
    const lastNameEn = namePartsEn.slice(1).join(" ") || "";

    // Upsert visitor
    let visitor = await prisma.visitor.findFirst({ where: { idNumber: idNumber.trim() } });
    const isNewVisitor = !visitor;

    if (visitor) {
      visitor = await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          name: fullNameTh.trim(),
          nameEn: fullNameEn?.trim() || visitor.nameEn,
          firstName,
          lastName,
          firstNameEn: firstNameEn || visitor.firstNameEn,
          lastNameEn: lastNameEn || visitor.lastNameEn,
          idType: documentType || visitor.idType,
          ...(photo && { photo }),
          lastVerifiedAt: new Date(),
        },
      });
    } else {
      visitor = await prisma.visitor.create({
        data: {
          idNumber: idNumber.trim(),
          idType: documentType || "thai-id-card",
          name: fullNameTh.trim(),
          nameEn: fullNameEn?.trim() || "",
          firstName,
          lastName,
          firstNameEn,
          lastNameEn,
          phone: "",
          ...(photo && { photo }),
          lastVerifiedAt: new Date(),
        },
      });
    }

    // Count previous visits
    const previousVisitCount = await prisma.visitEntry.count({
      where: { visitorId: visitor.id },
    });

    const lastEntry = await prisma.visitEntry.findFirst({
      where: { visitorId: visitor.id },
      orderBy: { checkinAt: "desc" },
      select: { checkinAt: true },
    });

    // Mask ID number
    const masked = idNumber.length > 6
      ? idNumber[0] + "-xxxx-xxxxx-" + idNumber.slice(-3)
      : idNumber;

    return ok({
      status: "ok",
      visitorId: visitor.id,
      isNewVisitor,
      isBlocked: false,
      previousVisitCount,
      lastVisitDate: lastEntry?.checkinAt?.toISOString().split("T")[0] || null,
      maskedIdNumber: masked,
      verifiedData: {
        fullNameTh: visitor.name,
        fullNameEn: visitor.nameEn,
        idNumber: visitor.idNumber,
        dateOfBirth: dateOfBirth || null,
      },
    });
  } catch (error) {
    console.error("POST /api/kiosk/identity/verify error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
