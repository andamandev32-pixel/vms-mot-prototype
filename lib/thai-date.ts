// ===== VMS THAI DATE UTILITY =====
// Thai Buddhist Era (พุทธศักราช) date formatting
// All dates in the VMS use พ.ศ. (BE = CE + 543)

const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"] as const;
const THAI_DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."] as const;

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
] as const;

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
] as const;

const THAI_MONTHS_ABBR = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
] as const;

/**
 * Convert CE year to Buddhist Era
 */
export function toBuddhistYear(ceYear: number): number {
  return ceYear + 543;
}

/**
 * Convert Buddhist Era year to CE
 */
export function toCEYear(beYear: number): number {
  return beYear - 543;
}

/**
 * Get Thai day name from a Date object
 */
export function getThaiDay(date: Date, short = false): string {
  const day = date.getDay();
  return short ? THAI_DAYS_SHORT[day] : THAI_DAYS[day];
}

/**
 * Get Thai month name from a month number (0-indexed)
 */
export function getThaiMonth(month: number, short = false): string {
  return short ? THAI_MONTHS_SHORT[month] : THAI_MONTHS[month];
}

/**
 * Format Thai time with น. suffix
 * e.g. "09:00" → "09:00 น.", "14:30" → "14:30 น."
 */
export function formatThaiTime(time: string): string {
  return `${time} น.`;
}

/**
 * Format Thai time range
 * e.g. "09:00", "10:30" → "09:00 – 10:30 น."
 */
export function formatThaiTimeRange(start: string, end: string): string {
  return `${start} – ${end} น.`;
}

/**
 * Format a date string (YYYY-MM-DD) to Thai format
 *
 * Formats:
 * - "full"    → "วันจันทร์ที่ 8 มีนาคม พ.ศ. 2569"
 * - "long"    → "8 มีนาคม 2569"
 * - "medium"  → "8 มี.ค. 2569"
 * - "short"   → "8/3/69"
 *
 * Note: Dates in mock data use พ.ศ. year format (2569 = 2026 CE)
 */
export function formatThaiDate(
  dateStr: string,
  format: "full" | "long" | "medium" | "short" = "medium"
): string {
  // Parse — handle both YYYY-MM-DD and ISO datetime
  const [datePart] = dateStr.split("T");
  const [yearStr, monthStr, dayStr] = datePart.split("-");

  let year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1; // 0-indexed
  const day = parseInt(dayStr);

  // If year looks like CE (< 2500), convert to BE
  if (year < 2500) {
    year = toBuddhistYear(year);
  }

  switch (format) {
    case "full": {
      // Create a CE Date for getDay()
      const ceYear = year >= 2500 ? toCEYear(year) : year;
      const date = new Date(ceYear, month, day);
      return `วัน${getThaiDay(date)}ที่ ${day} ${THAI_MONTHS[month]} พ.ศ. ${year}`;
    }
    case "long":
      return `${day} ${THAI_MONTHS[month]} ${year}`;
    case "medium":
      return `${day} ${THAI_MONTHS_ABBR[month]} ${year}`;
    case "short":
      return `${day}/${month + 1}/${String(year).slice(-2)}`;
  }
}

/**
 * Format a full Thai datetime string
 * e.g. "2569-03-08T09:00:00" → "8 มี.ค. 2569 เวลา 09:00 น."
 */
export function formatThaiDateTime(
  isoStr: string,
  dateFormat: "full" | "long" | "medium" | "short" = "medium"
): string {
  const [, timePart] = isoStr.split("T");
  const time = timePart ? timePart.slice(0, 5) : "00:00";
  return `${formatThaiDate(isoStr, dateFormat)} เวลา ${formatThaiTime(time)}`;
}

/**
 * Get relative time in Thai
 * e.g. "เมื่อ 5 นาทีที่ก่อน", "เมื่อ 2 ชั่วโมงที่ก่อน", "วันนี้", "เมื่อวาน"
 */
export function getRelativeTimeThai(isoStr: string): string {
  // For a static prototype, we return mock relative times
  const timestamp = isoStr.split("T")[1]?.slice(0, 5) || "";
  const date = isoStr.split("T")[0];

  // Simple mock: compare the date portion
  if (date === "2569-03-08") {
    return `วันนี้ ${formatThaiTime(timestamp)}`;
  } else if (date === "2569-03-07") {
    return `เมื่อวาน ${formatThaiTime(timestamp)}`;
  } else {
    return formatThaiDate(date, "medium");
  }
}

/**
 * Format a Thai appointment date summary
 * e.g. "วันจันทร์ที่ 8 มี.ค. 69 | 09:00 – 10:30 น."
 */
export function formatAppointmentSummary(date: string, timeStart: string, timeEnd: string): string {
  const [datePart] = date.split("T");
  const [yearStr, monthStr, dayStr] = datePart.split("-");

  let year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1;
  const day = parseInt(dayStr);

  if (year < 2500) year = toBuddhistYear(year);

  const ceYear = year >= 2500 ? toCEYear(year) : year;
  const dateObj = new Date(ceYear, month, day);
  const dayName = getThaiDay(dateObj);

  return `วัน${dayName}ที่ ${day} ${THAI_MONTHS_ABBR[month]} ${String(year).slice(-2)} | ${timeStart} – ${timeEnd} น.`;
}

/**
 * Get "today" date string in the mock data format
 */
export function getMockToday(): string {
  return "2569-03-08";
}
