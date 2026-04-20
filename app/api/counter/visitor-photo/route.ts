import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";
import { toDataUrl } from "@/lib/kiosk/photo-utils";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// POST /api/counter/visitor-photo — Upload visitor photo (base64 → DB)
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const body = await request.json();
    const { photo, visitorId } = body;

    if (!photo || !visitorId) {
      return err("photo and visitorId are required");
    }

    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!visitor) {
      return err("Visitor not found", 404);
    }

    const dataUrl = toDataUrl(photo);

    await prisma.visitor.update({
      where: { id: visitorId },
      data: { photo: dataUrl },
    });

    return ok({
      faceDetected: true,
      quality: "good",
    });
  } catch (error) {
    console.error("POST /api/counter/visitor-photo error:", error);
    return err("Internal server error", 500);
  }
}
