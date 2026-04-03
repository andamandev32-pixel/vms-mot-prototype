// ═══════════════════════════════════════════════════════════
// Event Invitation Email Template
// ═══════════════════════════════════════════════════════════

export interface EventEmailVars {
  eventName: string;
  eventNameEn?: string;
  description?: string;
  dateStart: string;
  dateEnd?: string;
  timeStart: string;
  timeEnd: string;
  location?: string;
  visitorName: string;
  bookingCode: string;
  organizerName: string;
  departmentName: string;
}

export function renderEventInvitationEmail(vars: EventEmailVars): string {
  const dateDisplay = vars.dateEnd
    ? `${vars.dateStart} — ${vars.dateEnd}`
    : vars.dateStart;

  const locationDisplay = vars.location || "ตามที่ระบุในกิจกรรม";

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6A0DAD,#4B0082);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">
                แจ้งเตือนกิจกรรม / Event Notification
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
                เรียน <strong>${vars.visitorName}</strong>,
              </p>
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 24px;">
                คุณได้รับเชิญเข้าร่วมกิจกรรมดังรายละเอียดด้านล่าง
                <br/>
                <span style="color:#666;font-size:13px;">You are invited to the following event.</span>
              </p>

              <!-- Event Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f5ff;border-radius:8px;border-left:4px solid #6A0DAD;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h2 style="color:#6A0DAD;font-size:18px;margin:0 0 4px;">
                      ${vars.eventName}
                    </h2>
                    ${vars.eventNameEn ? `<p style="color:#888;font-size:13px;margin:0 0 12px;">${vars.eventNameEn}</p>` : ""}
                    ${vars.description ? `<p style="color:#555;font-size:14px;margin:0 0 12px;">${vars.description}</p>` : ""}

                    <table cellpadding="0" cellspacing="0" style="font-size:14px;color:#444;">
                      <tr>
                        <td style="padding:4px 12px 4px 0;font-weight:600;white-space:nowrap;">วันที่ / Date:</td>
                        <td style="padding:4px 0;">${dateDisplay}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 12px 4px 0;font-weight:600;white-space:nowrap;">เวลา / Time:</td>
                        <td style="padding:4px 0;">${vars.timeStart} — ${vars.timeEnd}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 12px 4px 0;font-weight:600;white-space:nowrap;">สถานที่ / Location:</td>
                        <td style="padding:4px 0;">${locationDisplay}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 12px 4px 0;font-weight:600;white-space:nowrap;">ผู้จัด / Organizer:</td>
                        <td style="padding:4px 0;">${vars.organizerName} (${vars.departmentName})</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Booking Code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff8e1;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 24px;text-align:center;">
                    <p style="color:#666;font-size:12px;margin:0 0 4px;">รหัสนัดหมาย / Booking Code</p>
                    <p style="color:#D4AF37;font-size:22px;font-weight:800;margin:0;letter-spacing:2px;">${vars.bookingCode}</p>
                    <p style="color:#888;font-size:11px;margin:4px 0 0;">กรุณานำรหัสนี้มาแสดงเมื่อเข้าพื้นที่</p>
                  </td>
                </tr>
              </table>

              <p style="color:#666;font-size:13px;line-height:1.5;">
                กรุณาเตรียมบัตรประจำตัวสำหรับการลงทะเบียนเข้าพื้นที่
                <br/>
                <span style="font-size:12px;color:#888;">Please bring a valid ID for registration upon arrival.</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f8fa;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:11px;margin:0;">
                ส่งโดยระบบ eVMS — อีเมลนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
