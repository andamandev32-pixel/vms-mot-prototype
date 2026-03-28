/**
 * Kiosk Config Resolver — แปลงค่าตั้งค่าจาก Web App Settings → Kiosk Runtime Config
 *
 * ตัวกลางระหว่างข้อมูลตั้งค่า (mock-data.ts) กับ Kiosk UI
 * อ่านค่าจาก: servicePoints, visitPurposeConfigs, identityDocumentTypes,
 *              businessHoursRules, notificationTemplates, visitSlipTemplates
 *
 * Flutter dev: แปลงเป็น KioskConfigRepository ที่อ่านจาก API
 */

import {
  servicePoints,
  visitPurposeConfigs,
  identityDocumentTypes,
  businessHoursRules,
  departments,
  notificationTemplates,
  type ServicePoint,
  type VisitPurposeConfig,
  type DepartmentRule,
} from "@/lib/mock-data";
import type { VisitPurposeOption, IdMethod } from "./kiosk-types";

// ===== RESOLVED CONFIG TYPE =====

export interface ResolvedKioskConfig {
  /** Service point ที่ kiosk ใช้งาน */
  servicePoint: ServicePoint;

  /** วัตถุประสงค์ที่แสดงบน kiosk (กรองตาม allowedPurposeIds + purpose.showOnKiosk + isActive) */
  purposes: VisitPurposeOption[];

  /** purpose ID → department IDs ที่ kiosk นี้แสดง (กรองเฉพาะ acceptFromKiosk=true) */
  purposeDepartmentMap: Record<number, number[]>;

  /** ID methods ที่ kiosk นี้รับ (กรองจาก allowedDocumentIds → map เป็น IdMethod) */
  allowedIdMethods: { id: IdMethod; docId: number; name: string; nameEn: string; icon: string }[];

  /** Timeout config per screen */
  timeouts: NonNullable<ServicePoint["timeoutConfig"]>;

  /** WiFi config */
  wifi: NonNullable<ServicePoint["wifiConfig"]>;

  /** สถานะเปิด/ปิดตามเวลาทำการ */
  businessHours: {
    followBusinessHours: boolean;
    isOpen: boolean;
    currentRule: string;
    openTime: string;
    closeTime: string;
    allowKiosk: boolean;
  };

  /** PDPA config */
  pdpa: {
    requireScroll: boolean;
    retentionDays: number;
  };

  /** ข้อมูลสำหรับ requirePhoto per purpose */
  purposeRequirePhoto: Record<number, boolean>;

  /** Slip config (header/footer text) */
  slip: {
    headerText: string;
    footerText: string;
  };

  /** Notification triggers ที่จะเกิดเมื่อ check-in สำเร็จ */
  notificationTriggers: { id: number; name: string; channel: string }[];

  /** Access zone ที่ได้จาก department mapping */
  accessZoneLabel: string;

  /** ID masking pattern */
  idMaskingPattern: string;
}

// ===== DOC ID → IdMethod MAPPING =====

const docIdToIdMethod: Record<number, IdMethod> = {
  1: "thai-id-card",   // บัตรประชาชน
  2: "passport",       // Passport
  5: "thai-id-app",    // ThaiID App
};

// ===== DEFAULT TIMEOUTS =====

const DEFAULT_TIMEOUTS: NonNullable<ServicePoint["timeoutConfig"]> = {
  pdpaConsent: 120,
  selectIdMethod: 60,
  idVerification: 60,
  dataPreview: 120,
  selectPurpose: 60,
  faceCapture: 60,
  qrScan: 60,
  appointmentPreview: 120,
  successRedirect: 10,
};

const DEFAULT_WIFI: NonNullable<ServicePoint["wifiConfig"]> = {
  ssid: "MOTS-Guest",
  passwordPattern: "mots{year}",
  validityMode: "business-hours-close",
  fixedDurationMinutes: 480,
};

// ===== CHECK BUSINESS HOURS =====

function checkBusinessHours(followBusinessHours: boolean): ResolvedKioskConfig["businessHours"] {
  if (!followBusinessHours) {
    return {
      followBusinessHours: false,
      isOpen: true,
      currentRule: "ไม่จำกัดเวลา (Always Open)",
      openTime: "00:00",
      closeTime: "23:59",
      allowKiosk: true,
    };
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Check holiday / special date first
  const todayStr = `${now.getFullYear() + 543}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const specificRule = businessHoursRules.find(
    (r) => r.isActive && (r.type === "holiday" || r.type === "special") && r.specificDate === todayStr
  );

  if (specificRule) {
    const isOpen =
      specificRule.allowKiosk &&
      specificRule.openTime !== "00:00" &&
      currentTime >= specificRule.openTime &&
      currentTime <= specificRule.closeTime;
    return {
      followBusinessHours: true,
      isOpen,
      currentRule: specificRule.name,
      openTime: specificRule.openTime,
      closeTime: specificRule.closeTime,
      allowKiosk: specificRule.allowKiosk,
    };
  }

  // Check regular schedule
  const regularRule = businessHoursRules.find(
    (r) => r.isActive && r.type === "regular" && r.daysOfWeek?.includes(dayOfWeek)
  );

  if (regularRule) {
    const isClosed = regularRule.openTime === "00:00" && regularRule.closeTime === "00:00";
    const isOpen =
      !isClosed &&
      regularRule.allowKiosk &&
      currentTime >= regularRule.openTime &&
      currentTime <= regularRule.closeTime;
    return {
      followBusinessHours: true,
      isOpen,
      currentRule: regularRule.name,
      openTime: regularRule.openTime,
      closeTime: regularRule.closeTime,
      allowKiosk: regularRule.allowKiosk,
    };
  }

  return {
    followBusinessHours: true,
    isOpen: false,
    currentRule: "ไม่พบกฎเวลาทำการ",
    openTime: "—",
    closeTime: "—",
    allowKiosk: false,
  };
}

// ===== RESOLVE WIFI PASSWORD =====

export function resolveWifiPassword(pattern: string): string {
  const now = new Date();
  return pattern
    .replace("{year}", String(now.getFullYear()))
    .replace("{yearBE}", String(now.getFullYear() + 543));
}

export function resolveWifiValidity(config: NonNullable<ServicePoint["wifiConfig"]>, businessCloseTime: string): string {
  if (config.validityMode === "business-hours-close") {
    return `${businessCloseTime} น.`;
  }
  const now = new Date();
  const expiry = new Date(now.getTime() + (config.fixedDurationMinutes ?? 480) * 60000);
  return `${String(expiry.getHours()).padStart(2, "0")}:${String(expiry.getMinutes()).padStart(2, "0")} น.`;
}

// ===== MAIN RESOLVER =====

export function resolveKioskConfig(servicePointId: number): ResolvedKioskConfig | null {
  const sp = servicePoints.find((s) => s.id === servicePointId);
  if (!sp) return null;

  // 1. Resolve allowed purposes (filtered by SP's allowedPurposeIds + purpose.showOnKiosk + isActive)
  const purposes: VisitPurposeOption[] = [];
  const purposeDeptMap: Record<number, number[]> = {};
  const purposeRequirePhoto: Record<number, boolean> = {};

  for (const config of visitPurposeConfigs) {
    if (!config.isActive) continue;
    if (!config.showOnKiosk) continue;  // ← ระดับวัตถุประสงค์: แสดงบน Kiosk ไหม
    if (!sp.allowedPurposeIds.includes(config.id)) continue;

    // Filter departments that accept from kiosk
    const kioskDeptRules = config.departmentRules.filter(
      (r: DepartmentRule) => r.acceptFromKiosk && r.isActive
    );
    if (kioskDeptRules.length === 0) continue;

    // Determine wifiEnabled: true if ANY dept rule offers wifi
    const wifiEnabled = kioskDeptRules.some((r: DepartmentRule) => r.offerWifi);

    purposes.push({
      id: config.id,
      name: config.name,
      nameEn: config.nameEn,
      icon: config.icon,
      wifiEnabled,
    });

    purposeDeptMap[config.id] = kioskDeptRules.map((r: DepartmentRule) => r.departmentId);
    purposeRequirePhoto[config.id] = config.kioskConfig.requirePhoto;
  }

  // Sort by order
  purposes.sort((a, b) => {
    const oa = visitPurposeConfigs.find((c) => c.id === a.id)?.order ?? 99;
    const ob = visitPurposeConfigs.find((c) => c.id === b.id)?.order ?? 99;
    return oa - ob;
  });

  // 2. Resolve allowed ID methods
  const allowedIdMethods = sp.allowedDocumentIds
    .map((docId) => {
      const method = docIdToIdMethod[docId];
      if (!method) return null;
      const doc = identityDocumentTypes.find((d) => d.id === docId);
      if (!doc) return null;
      return { id: method, docId, name: doc.name, nameEn: doc.nameEn, icon: doc.icon };
    })
    .filter(Boolean) as ResolvedKioskConfig["allowedIdMethods"];

  // 3. Business hours
  const businessHours = checkBusinessHours(sp.followBusinessHours ?? true);

  // 4. WiFi
  const wifi = sp.wifiConfig ?? DEFAULT_WIFI;

  // 5. Timeouts
  const timeouts = sp.timeoutConfig ?? DEFAULT_TIMEOUTS;

  // 6. PDPA config
  const pdpa = {
    requireScroll: sp.pdpaConfig?.requireScroll ?? true,
    retentionDays: sp.pdpaConfig?.retentionDays ?? 90,
  };

  // 7. Slip config
  const slip = {
    headerText: sp.slipConfig?.headerText ?? "กระทรวงการท่องเที่ยวและกีฬา",
    footerText: sp.slipConfig?.footerText ?? "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร",
  };

  // 8. Notification triggers (check-in related)
  const notificationTriggers = notificationTemplates
    .filter((t) => t.isActive && (t.trigger === "checkin-welcome" || t.trigger === "wifi-credentials"))
    .map((t) => ({ id: t.id, name: t.name, channel: t.channel }));

  // 9. Access zone (from first department — simplified)
  const accessZoneLabel = "ตามแผนกที่เลือก";

  // 10. ID masking
  const idMaskingPattern = sp.idMaskingPattern ?? "show-first1-last5";

  return {
    servicePoint: sp,
    purposes,
    purposeDepartmentMap: purposeDeptMap,
    allowedIdMethods,
    timeouts,
    wifi,
    businessHours,
    pdpa,
    purposeRequirePhoto,
    slip,
    notificationTriggers,
    accessZoneLabel,
    idMaskingPattern,
  };
}

/** Get all kiosk-type service points for selection */
export function getKioskServicePoints(): ServicePoint[] {
  return servicePoints.filter((sp) => sp.type === "kiosk");
}

/** Get all service points (kiosk + counter) for selection */
export function getAllServicePoints(): ServicePoint[] {
  return servicePoints;
}

// ===== DEV INFO PER STATE =====

export interface StateConfigInfo {
  title: string;
  rules: string[];
  configSource: string[];
}

export function getStateConfigInfo(
  stateType: string,
  config: ResolvedKioskConfig
): StateConfigInfo {
  const sp = config.servicePoint;
  const bh = config.businessHours;

  switch (stateType) {
    case "WELCOME":
      return {
        title: "หน้าต้อนรับ — เงื่อนไข",
        rules: [
          `Kiosk: ${sp.name} (${sp.serialNumber})`,
          `สถานะ: ${sp.status === "online" ? "🟢 ออนไลน์" : sp.status === "offline" ? "🔴 ออฟไลน์" : "🟡 ปิดปรับปรุง"}`,
          `เปิดตามเวลาทำการ: ${bh.followBusinessHours ? "✅ ใช่" : "❌ ไม่ (เปิดตลอด)"}`,
          bh.followBusinessHours ? `กฎปัจจุบัน: ${bh.currentRule}` : "",
          bh.followBusinessHours ? `เวลาเปิด-ปิด: ${bh.openTime} — ${bh.closeTime}` : "",
          bh.followBusinessHours ? `Kiosk เปิดให้บริการ: ${bh.allowKiosk ? "✅" : "❌"}` : "",
          `สถานะตอนนี้: ${bh.isOpen ? "🟢 เปิดให้บริการ" : "🔴 ปิดให้บริการ"}`,
        ].filter(Boolean),
        configSource: ["servicePoints.status", "servicePoints.followBusinessHours", "businessHoursRules"],
      };

    case "PDPA_CONSENT":
      return {
        title: "PDPA — เงื่อนไข",
        rules: [
          `ต้อง Scroll ก่อนกดยอมรับ: ${config.pdpa.requireScroll ? "✅ บังคับ" : "❌ ไม่บังคับ"}`,
          `ระยะเก็บข้อมูล: ${config.pdpa.retentionDays} วัน`,
          `Timeout: ${config.timeouts.pdpaConsent} วินาที`,
        ],
        configSource: ["servicePoints.pdpaConfig", "servicePoints.timeoutConfig.pdpaConsent"],
      };

    case "SELECT_ID_METHOD":
      return {
        title: "เลือกวิธียืนยันตัวตน — เงื่อนไข",
        rules: [
          `เอกสารที่รับ (${config.allowedIdMethods.length} วิธี):`,
          ...config.allowedIdMethods.map((m) => `  ${m.icon} ${m.name}`),
          `Timeout: ${config.timeouts.selectIdMethod} วินาที`,
        ],
        configSource: ["servicePoints.allowedDocumentIds", "identityDocumentTypes"],
      };

    case "ID_VERIFICATION":
      return {
        title: "ยืนยันตัวตน — เงื่อนไข",
        rules: [
          `ID Masking: ${config.idMaskingPattern}`,
          `Timeout: ${config.timeouts.idVerification} วินาที`,
        ],
        configSource: ["servicePoints.idMaskingPattern", "servicePoints.timeoutConfig"],
      };

    case "DATA_PREVIEW":
      return {
        title: "ตรวจสอบข้อมูล — เงื่อนไข",
        rules: [
          `ID Masking: ${config.idMaskingPattern}`,
          `Timeout: ${config.timeouts.dataPreview} วินาที`,
          "ตรวจ Blocklist ก่อนดำเนินการต่อ",
        ],
        configSource: ["servicePoints.idMaskingPattern", "servicePoints.timeoutConfig"],
      };

    case "SELECT_PURPOSE":
      return {
        title: "เลือกวัตถุประสงค์ — เงื่อนไข",
        rules: [
          `วัตถุประสงค์ที่แสดง (${config.purposes.length} รายการ):`,
          ...config.purposes.map((p) => `  ${p.icon} ${p.name} ${p.wifiEnabled ? "(WiFi ✅)" : ""}`),
          `Timeout: ${config.timeouts.selectPurpose} วินาที`,
          `กรองจาก: purpose.showOnKiosk + allowedPurposeIds + dept.acceptFromKiosk`,
        ],
        configSource: ["visitPurposeConfigs.showOnKiosk", "servicePoints.allowedPurposeIds", "departmentRules.acceptFromKiosk"],
      };

    case "FACE_CAPTURE":
      return {
        title: "ถ่ายภาพใบหน้า — เงื่อนไข",
        rules: [
          `ต้องถ่ายรูป (ตาม purpose):`,
          ...Object.entries(config.purposeRequirePhoto).map(([pid, req]) => {
            const p = config.purposes.find((pp) => pp.id === Number(pid));
            return `  ${p?.icon ?? ""} ${p?.name ?? pid}: ${req ? "✅ บังคับ" : "❌ ข้ามได้"}`;
          }),
          `WiFi SSID: ${config.wifi.ssid}`,
          `WiFi Password: ${resolveWifiPassword(config.wifi.passwordPattern)}`,
          `WiFi หมดอายุ: ${config.wifi.validityMode === "business-hours-close" ? "ตามเวลาปิดทำการ" : `${config.wifi.fixedDurationMinutes} นาที`}`,
          `Timeout: ${config.timeouts.faceCapture} วินาที`,
        ],
        configSource: ["visitPurposeConfigs.kioskConfig.requirePhoto", "servicePoints.wifiConfig"],
      };

    case "SUCCESS":
      return {
        title: "สำเร็จ — เงื่อนไข",
        rules: [
          `Slip Header: ${config.slip.headerText}`,
          `Slip Footer: ${config.slip.footerText}`,
          `Redirect: ${config.timeouts.successRedirect} วินาที`,
          `Notification triggers:`,
          ...config.notificationTriggers.map((n) => `  📲 ${n.name} (${n.channel})`),
        ],
        configSource: ["servicePoints.slipConfig", "notificationTemplates"],
      };

    case "QR_SCAN":
      return {
        title: "สแกน QR — เงื่อนไข",
        rules: [
          `Timeout: ${config.timeouts.qrScan} วินาที`,
          "ไม่มี QR → ไปหน้าเลือกวิธียืนยันตัวตน",
        ],
        configSource: ["servicePoints.timeoutConfig.qrScan"],
      };

    case "APPOINTMENT_PREVIEW":
      return {
        title: "ตรวจสอบนัดหมาย — เงื่อนไข",
        rules: [
          `Timeout: ${config.timeouts.appointmentPreview} วินาที`,
          "ตรวจสอบ booking code + วันเวลา",
        ],
        configSource: ["servicePoints.timeoutConfig.appointmentPreview"],
      };

    default:
      return {
        title: `${stateType} — เงื่อนไข`,
        rules: ["ไม่มีเงื่อนไขเฉพาะ"],
        configSource: [],
      };
  }
}
