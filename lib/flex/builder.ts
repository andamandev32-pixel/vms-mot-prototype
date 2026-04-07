// ════════════════════════════════════════════════════
// Flex Message Builder
// แปลง FlexTemplateConfig → LINE Flex Message JSON (Bubble format)
// ════════════════════════════════════════════════════

import type {
  FlexBubble,
  FlexBox,
  FlexText,
  FlexImage,
  FlexSeparator,
  FlexComponent,
  FlexButton,
  FlexAction,
  LineFlexMessage,
} from "./types";

import type {
  FlexTemplateConfig,
  FlexTemplateRow,
  FlexTemplateButton,
  FlexTemplateInfoBox,
} from "@/lib/line-flex-template-data";

import {
  headerVariantColors,
  headerColors,
  statusBadgeColors,
  buttonVariantColors,
  infoBoxColors,
  SEPARATOR_COLOR,
  EVMS_PRIMARY,
} from "./colors";

// ===== Variable Interpolation =====

/** แทนที่ {{variable}} ด้วยค่าจริง — ถ้าไม่มีค่าจะเป็น string ว่าง */
export function interpolate(
  text: string,
  variables: Record<string, string | undefined>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
}

// ===== QR Code URL Generator =====

const QR_API = "https://api.qrserver.com/v1/create-qr-code";

export function qrCodeUrl(data: string, size = 200): string {
  return `${QR_API}?data=${encodeURIComponent(data)}&size=${size}x${size}&format=png`;
}

// ===== Sub-builders =====

function buildHeaderBox(
  template: FlexTemplateConfig,
  vars: Record<string, string | undefined>
): FlexBox {
  const variant = headerVariantColors[template.headerVariant];
  const color = headerColors[template.headerColor];

  const contents: FlexComponent[] = [];

  // eVMS brand line
  contents.push({
    type: "text",
    text: "eVMS — กท.กก.",
    size: "xxs",
    color: variant.text,
    weight: "bold",
  } as FlexText);

  // Title
  if (template.headerTitle) {
    contents.push({
      type: "text",
      text: interpolate(template.headerTitle, vars),
      size: "lg",
      color: color,
      weight: "bold",
      wrap: true,
      margin: "sm",
    } as FlexText);
  }

  // Subtitle
  if (template.headerSubtitle) {
    contents.push({
      type: "text",
      text: interpolate(template.headerSubtitle, vars),
      size: "xs",
      color: variant.text,
      wrap: true,
      margin: "xs",
    } as FlexText);
  }

  return {
    type: "box",
    layout: "vertical",
    contents,
    paddingAll: "16px",
    backgroundColor: variant.bg,
  };
}

function buildStatusBadgeBox(
  template: FlexTemplateConfig
): FlexBox | null {
  if (!template.showStatusBadge || !template.statusBadgeType) return null;

  const badge = statusBadgeColors[template.statusBadgeType] ?? statusBadgeColors.pending;
  const text = template.statusBadgeText ?? template.statusBadgeType;

  return {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text,
        size: "xs",
        color: badge.text,
        weight: "bold",
        align: "center",
      } as FlexText,
    ],
    backgroundColor: badge.bg,
    cornerRadius: "4px",
    paddingAll: "6px",
    margin: "md",
    justifyContent: "center",
    alignItems: "center",
    width: "auto" as string,
  } as FlexBox;
}

function buildBodyRows(
  rows: FlexTemplateRow[],
  vars: Record<string, string | undefined>
): FlexComponent[] {
  const enabledRows = rows
    .filter((r) => r.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (enabledRows.length === 0) return [];

  return enabledRows.map(
    (row): FlexBox => ({
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: row.label,
          size: "sm",
          color: "#6B7280",
          flex: 3,
        } as FlexText,
        {
          type: "text",
          text: vars[row.variable] ?? row.previewValue,
          size: "sm",
          color: "#111827",
          weight: "bold",
          flex: 5,
          wrap: true,
        } as FlexText,
      ],
      margin: "md",
    })
  );
}

function buildQrSection(
  template: FlexTemplateConfig,
  vars: Record<string, string | undefined>
): FlexComponent[] {
  if (!template.showQrCode) return [];

  // ใช้ bookingCode หรือ entryCode เป็น QR data
  const qrData = vars.bookingCode ?? vars.entryCode ?? vars.qrData ?? "EVMS";

  const components: FlexComponent[] = [
    { type: "separator", color: SEPARATOR_COLOR, margin: "lg" } as FlexSeparator,
    {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "image",
          url: qrCodeUrl(qrData),
          size: "lg",
          aspectRatio: "1:1",
          aspectMode: "fit",
        } as FlexImage,
        ...(template.qrLabel
          ? [
              {
                type: "text",
                text: interpolate(template.qrLabel, vars),
                size: "xs",
                color: "#6B7280",
                align: "center",
                margin: "sm",
                wrap: true,
              } as FlexText,
            ]
          : []),
      ],
      margin: "lg",
      alignItems: "center",
    } as FlexBox,
  ];

  return components;
}

function buildInfoBoxComponent(
  infoBox: FlexTemplateInfoBox | undefined,
  vars: Record<string, string | undefined>
): FlexComponent[] {
  if (!infoBox || !infoBox.enabled) return [];

  const colors = infoBoxColors[infoBox.color] ?? infoBoxColors.gray;
  const text = interpolate(infoBox.text, vars);

  return [
    { type: "separator", color: SEPARATOR_COLOR, margin: "lg" } as FlexSeparator,
    {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text,
          size: "xs",
          color: colors.text,
          wrap: true,
        } as FlexText,
      ],
      backgroundColor: colors.bg,
      cornerRadius: "8px",
      paddingAll: "12px",
      margin: "lg",
      borderColor: colors.border,
      borderWidth: "1px",
    } as FlexBox,
  ];
}

function resolveButtonAction(
  btn: FlexTemplateButton,
  vars: Record<string, string | undefined>,
  liffUrl?: string
): FlexAction {
  const label = btn.label;

  // Approve / Reject → Postback action
  if (label === "อนุมัติ" && vars.appointmentId) {
    return {
      type: "postback",
      label,
      data: `action=approve&appointmentId=${vars.appointmentId}`,
      displayText: "อนุมัติแล้ว ✅",
    };
  }
  if (label === "ปฏิเสธ" && vars.appointmentId) {
    return {
      type: "postback",
      label,
      data: `action=reject&appointmentId=${vars.appointmentId}`,
      displayText: "ปฏิเสธแล้ว ❌",
    };
  }

  // Booking button → LIFF booking URL
  if (label.includes("นัดหมาย") && liffUrl) {
    return { type: "uri", label, uri: `${liffUrl}/booking` };
  }

  // QR Code button → LIFF qr-code page
  if (label.includes("QR") && liffUrl) {
    return {
      type: "uri",
      label,
      uri: `${liffUrl}/booking?qr=${vars.bookingCode ?? ""}`,
    };
  }

  // Profile button → LIFF profile
  if (label.includes("ส่วนบุคคล") && liffUrl) {
    return { type: "uri", label, uri: `${liffUrl}/profile` };
  }

  // Request list button → LIFF approve
  if (label.includes("คำขอ") && liffUrl) {
    return { type: "uri", label, uri: `${liffUrl}/approve` };
  }

  // Detail/Slip → LIFF URL
  if ((label.includes("รายละเอียด") || label.includes("Slip")) && liffUrl) {
    return {
      type: "uri",
      label,
      uri: `${liffUrl}/detail?id=${vars.appointmentId ?? vars.entryCode ?? ""}`,
    };
  }

  // Security alert → Message action
  if (label.includes("Security")) {
    return {
      type: "message",
      label,
      text: `แจ้ง Security: ${vars.visitorName ?? "ผู้มาติดต่อ"} overstay ที่ ${vars.location ?? "N/A"}`,
    };
  }

  // Contact visitor → Message action
  if (label.includes("ติดต่อ")) {
    return {
      type: "message",
      label,
      text: `ติดต่อ ${vars.visitorName ?? "ผู้มาติดต่อ"}`,
    };
  }

  // Default: URI if liffUrl, otherwise message
  if (liffUrl) {
    return { type: "uri", label, uri: liffUrl };
  }
  return { type: "message", label, text: label };
}

function buildFooterButtons(
  buttons: FlexTemplateButton[],
  vars: Record<string, string | undefined>,
  liffUrl?: string
): FlexBox | null {
  const enabledButtons = buttons
    .filter((b) => b.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (enabledButtons.length === 0) return null;

  const btnComponents: FlexButton[] = enabledButtons.map((btn) => {
    const colors = buttonVariantColors[btn.variant];
    return {
      type: "button",
      action: resolveButtonAction(btn, vars, liffUrl),
      style: colors.style,
      color: colors.style === "primary" ? colors.color : undefined,
      height: "sm",
      margin: "sm",
    };
  });

  return {
    type: "box",
    layout: "vertical",
    contents: btnComponents,
    spacing: "xs",
    paddingAll: "16px",
  };
}

// ===== Main Builder =====

export interface BuildFlexOptions {
  /** LIFF base URL สำหรับปุ่ม URI (เช่น https://liff.line.me/1234567890-abcdefgh) */
  liffUrl?: string;
}

/**
 * แปลง FlexTemplateConfig + variables → LINE Flex Bubble JSON
 *
 * @param template - Template config จาก line-flex-template-data.ts
 * @param variables - ค่า variable สำหรับแทน {{var}} ใน template
 * @param options - ตัวเลือกเพิ่มเติม (liffUrl)
 * @returns FlexBubble พร้อมส่งผ่าน LINE Messaging API
 */
export function buildFlexBubble(
  template: FlexTemplateConfig,
  variables: Record<string, string | undefined>,
  options: BuildFlexOptions = {}
): FlexBubble {
  const { liffUrl } = options;

  // Header
  const header = buildHeaderBox(template, variables);

  // Body
  const bodyContents: FlexComponent[] = [];

  // Status badge
  const badge = buildStatusBadgeBox(template);
  if (badge) bodyContents.push(badge);

  // Rows
  const rows = buildBodyRows(template.rows, variables);
  if (rows.length > 0) {
    if (badge) {
      bodyContents.push({
        type: "separator",
        color: SEPARATOR_COLOR,
        margin: "lg",
      } as FlexSeparator);
    }
    bodyContents.push(...rows);
  }

  // QR Code section
  bodyContents.push(...buildQrSection(template, variables));

  // Info box
  bodyContents.push(...buildInfoBoxComponent(template.infoBox, variables));

  const body: FlexBox = {
    type: "box",
    layout: "vertical",
    contents: bodyContents,
    paddingAll: "16px",
  };

  // Footer (buttons)
  const footer = buildFooterButtons(template.buttons, variables, liffUrl);

  const bubble: FlexBubble = {
    type: "bubble",
    size: "mega",
    header,
    body,
    ...(footer ? { footer } : {}),
    styles: {
      header: {
        backgroundColor: headerVariantColors[template.headerVariant].bg,
      },
    },
  };

  return bubble;
}

/**
 * สร้าง LINE Flex Message object พร้อมส่ง (รวม altText + contents)
 */
export function buildFlexMessage(
  template: FlexTemplateConfig,
  variables: Record<string, string | undefined>,
  altText: string,
  options: BuildFlexOptions = {}
): LineFlexMessage {
  return {
    type: "flex",
    altText,
    contents: buildFlexBubble(template, variables, options),
  };
}
