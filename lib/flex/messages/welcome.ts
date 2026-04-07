// new-friend — ข้อความต้อนรับเมื่อเพิ่มเพื่อน LINE OA

import type { LineTextMessage } from "../types";

export function buildWelcomeMessage(): LineTextMessage {
  return {
    type: "text",
    text: [
      "สวัสดีค่ะ 🙏 ยินดีต้อนรับสู่ eVMS",
      "ระบบจัดการผู้มาติดต่อ กท.กก.",
      "",
      "กรุณากด 'ลงทะเบียน' ที่เมนูด้านล่าง",
      "เพื่อเริ่มต้นใช้งาน",
    ].join("\n"),
  };
}
