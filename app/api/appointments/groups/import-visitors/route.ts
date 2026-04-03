import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import ExcelJS from "exceljs";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// POST /api/appointments/groups/import-visitors — parse Excel file
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role === "visitor") return err("FORBIDDEN", "ไม่อนุญาต", 403);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return err("NO_FILE", "กรุณาอัปโหลดไฟล์ Excel");

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(arrayBuffer as any);

    const sheet = workbook.worksheets[0];
    if (!sheet) return err("EMPTY_FILE", "ไฟล์ Excel ไม่มีข้อมูล");

    // Detect header row — look for firstName/lastName or ชื่อ/นามสกุล
    let dataStartRow = 1;
    const firstRow = sheet.getRow(1);
    const firstCellVal = String(firstRow.getCell(1).value ?? "").toLowerCase();
    if (firstCellVal.includes("ชื่อ") || firstCellVal.includes("firstname") || firstCellVal.includes("first")) {
      // Check if row 2 is also a header (English field names)
      const secondRow = sheet.getRow(2);
      const secondCellVal = String(secondRow.getCell(1).value ?? "").toLowerCase();
      if (secondCellVal === "firstname" || secondCellVal === "first_name") {
        dataStartRow = 3; // Skip both header rows
      } else {
        dataStartRow = 2; // Skip only Thai header
      }
    }

    const visitors: Array<{
      firstName: string;
      lastName: string;
      company?: string;
      phone?: string;
      email?: string;
      idNumber?: string;
      idType?: string;
    }> = [];
    const errors: Array<{ row: number; message: string }> = [];
    let skippedRows = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < dataStartRow) return;

      const firstName = String(row.getCell(1).value ?? "").trim();
      const lastName = String(row.getCell(2).value ?? "").trim();

      // Skip completely empty rows
      if (!firstName && !lastName) {
        skippedRows++;
        return;
      }

      // Skip note/comment rows
      if (firstName.startsWith("หมายเหตุ") || firstName.startsWith("Note")) {
        skippedRows++;
        return;
      }

      if (!firstName) {
        errors.push({ row: rowNumber, message: `แถวที่ ${rowNumber}: ไม่มีชื่อ` });
        return;
      }
      if (!lastName) {
        errors.push({ row: rowNumber, message: `แถวที่ ${rowNumber}: ไม่มีนามสกุล` });
        return;
      }

      visitors.push({
        firstName,
        lastName,
        company: String(row.getCell(3).value ?? "").trim() || undefined,
        phone: String(row.getCell(4).value ?? "").trim() || undefined,
        email: String(row.getCell(5).value ?? "").trim() || undefined,
        idNumber: String(row.getCell(6).value ?? "").trim() || undefined,
        idType: String(row.getCell(7).value ?? "").trim() || undefined,
      });
    });

    return ok({
      visitors,
      totalRows: sheet.rowCount - (dataStartRow - 1),
      validRows: visitors.length,
      skippedRows,
      errors,
    });
  } catch (error) {
    console.error("POST /api/appointments/groups/import-visitors error:", error);
    return err("PARSE_ERROR", "ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์", 500);
  }
}
