import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// POST /api/counter/visitor-photo — Upload visitor photo (base64)
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const body = await request.json();
    const { photo, visitorId } = body;

    if (!photo || !visitorId) {
      return err("photo and visitorId are required");
    }

    // Verify visitor exists
    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!visitor) {
      return err("Visitor not found", 404);
    }

    // Generate file path: /public/photos/YYYY/MM/DD/
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");

    const dirPath = path.join(
      process.cwd(),
      "public",
      "photos",
      year,
      month,
      day
    );
    await mkdir(dirPath, { recursive: true });

    const fileName = `visitor-${visitorId}-${Date.now()}.jpg`;
    const filePath = path.join(dirPath, fileName);
    const photoPath = `/photos/${year}/${month}/${day}/${fileName}`;

    // Decode base64 and save
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    await writeFile(filePath, buffer);

    // Update visitor photo
    await prisma.visitor.update({
      where: { id: visitorId },
      data: { photo: photoPath },
    });

    return ok({
      photoPath,
      faceDetected: true,
      quality: "good",
    });
  } catch (error) {
    console.error("POST /api/counter/visitor-photo error:", error);
    return err("Internal server error", 500);
  }
}
