import { NextResponse } from "next/server";
import { VISITOR_COOKIE_NAME } from "@/lib/visitor-auth";

export async function POST() {
  const response = NextResponse.json({ success: true, data: { message: "ออกจากระบบสำเร็จ" } });
  response.cookies.set(VISITOR_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return response;
}
