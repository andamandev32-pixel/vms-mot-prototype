import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import ExcelJS from "exceljs";

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// GET /api/appointments/groups/template — download visitor Excel template
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบ" } }, { status: 401 });
  }
  if (user.role === "visitor") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "ไม่อนุญาต" } }, { status: 403 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Visitors");

  // Column definitions
  const columns = [
    { header: "ชื่อ *", key: "firstName", width: 20 },
    { header: "นามสกุล *", key: "lastName", width: 20 },
    { header: "บริษัท/หน่วยงาน", key: "company", width: 25 },
    { header: "โทรศัพท์", key: "phone", width: 18 },
    { header: "อีเมล", key: "email", width: 28 },
    { header: "เลขบัตรประจำตัว", key: "idNumber", width: 22 },
    { header: "ประเภทบัตร", key: "idType", width: 16 },
  ];
  sheet.columns = columns;

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6A0DAD" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 28;

  // English field names on row 2 (for reference)
  const fieldNameRow = sheet.addRow(["firstName", "lastName", "company", "phone", "email", "idNumber", "idType"]);
  fieldNameRow.font = { italic: true, color: { argb: "FF999999" }, size: 9 };

  // Example rows
  sheet.addRow(["สมชาย", "ใจดี", "บริษัท ABC จำกัด", "081-234-5678", "somchai@example.com", "1234567890123", "thai-id"]);
  sheet.addRow(["สมหญิง", "รักดี", "บริษัท XYZ จำกัด", "089-876-5432", "somying@example.com", "", ""]);

  // Notes row
  const noteRow = sheet.addRow([]);
  sheet.addRow(["หมายเหตุ: * = จำเป็นต้องกรอก, ประเภทบัตร: thai-id, passport, driver-license, other"]);
  const noteCell = sheet.getRow(sheet.rowCount);
  noteCell.font = { italic: true, color: { argb: "FF666666" }, size: 9 };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="visitor-template.xlsx"',
    },
  });
}
