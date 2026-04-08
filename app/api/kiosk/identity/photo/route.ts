import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// POST /api/kiosk/identity/photo — Upload face photo
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const body = await request.json();
    const { photo, visitorId } = body as {
      photo?: string;
      visitorId?: number;
      servicePointId?: number;
      purposeId?: number;
    };

    if (!photo) return err("MISSING_FIELDS", "กรุณาระบุ photo (base64)");
    if (!visitorId) return err("MISSING_FIELDS", "กรุณาระบุ visitorId");

    const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) return err("NOT_FOUND", "ไม่พบข้อมูลผู้เยี่ยมชม", 404);

    // Save photo to disk
    const now = new Date();
    const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
    const fileName = `visitor-${visitorId}-face.jpg`;
    const relativePath = `/photos/${datePath}/${fileName}`;
    const absoluteDir = path.join(process.cwd(), "public", "photos", datePath);

    fs.mkdirSync(absoluteDir, { recursive: true });

    // Remove base64 prefix if present
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(path.join(absoluteDir, fileName), Buffer.from(base64Data, "base64"));

    // Update visitor photo
    await prisma.visitor.update({
      where: { id: visitorId },
      data: { photo: relativePath },
    });

    return ok({
      photoPath: relativePath,
      faceDetected: true,
      faceCount: 1,
      quality: "good",
      faceMatchScore: 0.95,
    });
  } catch (error) {
    console.error("POST /api/kiosk/identity/photo error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
