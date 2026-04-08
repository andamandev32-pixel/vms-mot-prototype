import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// POST /api/counter/identity/manual — Manual identity input
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const body = await request.json();
    const { idNumber, titleTh, firstNameTh, lastNameTh, phone, documentType } =
      body;

    if (!idNumber || !firstNameTh || !lastNameTh) {
      return err("idNumber, firstNameTh, and lastNameTh are required");
    }

    const fullNameTh = [titleTh, firstNameTh, lastNameTh]
      .filter(Boolean)
      .join(" ");

    // Check blocklist by name
    const blocklistEntry = await prisma.blocklist.findFirst({
      where: {
        isActive: true,
        firstName: firstNameTh,
        lastName: lastNameTh,
      },
    });

    if (blocklistEntry) {
      return ok({
        status: "blocked",
        reason: blocklistEntry.reason,
        blocklistId: blocklistEntry.id,
      });
    }

    // Upsert visitor
    const existingVisitor = await prisma.visitor.findFirst({
      where: { idNumber },
    });

    const isNewVisitor = !existingVisitor;

    const visitor = await prisma.visitor.upsert({
      where: { id: existingVisitor?.id || 0 },
      update: {
        firstName: firstNameTh,
        lastName: lastNameTh,
        name: fullNameTh,
        phone: phone || undefined,
        lastVerifiedAt: new Date(),
      },
      create: {
        idNumber,
        idType: documentType || "thai_id",
        firstName: firstNameTh,
        lastName: lastNameTh,
        name: fullNameTh,
        phone: phone || "",
        registeredChannel: "counter",
        lastVerifiedAt: new Date(),
      },
    });

    return ok({
      status: "ok",
      visitorId: visitor.id,
      isNewVisitor,
      visitor: {
        id: visitor.id,
        name: visitor.name,
        nameEn: visitor.nameEn,
        idNumber: visitor.idNumber,
        idType: visitor.idType,
        phone: visitor.phone,
      },
    });
  } catch (error) {
    console.error("POST /api/counter/identity/manual error:", error);
    return err("Internal server error", 500);
  }
}
