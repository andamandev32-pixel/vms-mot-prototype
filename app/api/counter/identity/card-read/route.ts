import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// POST /api/counter/identity/card-read — Read card + blocklist + upsert visitor
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const body = await request.json();
    const { idNumber, fullNameTh, fullNameEn, documentType, photo } = body;

    if (!idNumber || !fullNameTh) {
      return err("idNumber and fullNameTh are required");
    }

    // Check blocklist first
    const blocklistEntry = await prisma.blocklist.findFirst({
      where: {
        isActive: true,
        visitor: { idNumber },
      },
    });

    if (blocklistEntry) {
      return ok({
        status: "blocked",
        reason: blocklistEntry.reason,
        blocklistId: blocklistEntry.id,
      });
    }

    // Parse name parts
    const nameParts = fullNameTh.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const namePartsEn = fullNameEn ? fullNameEn.trim().split(/\s+/) : [];
    const firstNameEn = namePartsEn[0] || null;
    const lastNameEn = namePartsEn.slice(1).join(" ") || null;

    // Upsert visitor
    const existingVisitor = await prisma.visitor.findFirst({
      where: { idNumber },
    });

    const isNewVisitor = !existingVisitor;

    const visitor = await prisma.visitor.upsert({
      where: { id: existingVisitor?.id || 0 },
      update: {
        firstName,
        lastName,
        name: fullNameTh,
        nameEn: fullNameEn || undefined,
        firstNameEn: firstNameEn || undefined,
        lastNameEn: lastNameEn || undefined,
        photo: photo || undefined,
        lastVerifiedAt: new Date(),
      },
      create: {
        idNumber,
        idType: documentType || "thai_id",
        firstName,
        lastName,
        name: fullNameTh,
        nameEn: fullNameEn || null,
        firstNameEn: firstNameEn || null,
        lastNameEn: lastNameEn || null,
        phone: "",
        photo: photo || null,
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
        photo: visitor.photo,
        phone: visitor.phone,
      },
    });
  } catch (error) {
    console.error("POST /api/counter/identity/card-read error:", error);
    return err("Internal server error", 500);
  }
}
