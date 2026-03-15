/**
 * Kiosk Device Map — Hardware mapping per state
 *
 * Flutter dev: Use this to control hardware devices
 * → Map to platform channels / device controllers
 */

import type { HardwareDevice, IdMethod, KioskStateType } from "./kiosk-types";

/** Static device mapping: which device is active for each state */
export const staticDeviceMap: Partial<Record<KioskStateType, HardwareDevice | "auto" | null>> = {
  WELCOME: null,
  PDPA_CONSENT: null,
  SELECT_ID_METHOD: null,
  ID_VERIFICATION: "auto",        // depends on idMethod
  DATA_PREVIEW: null,
  SELECT_PURPOSE: null,
  FACE_CAPTURE: "camera",
  WIFI_OFFER: null,
  SUCCESS: "printer",
  QR_SCAN: "qr-reader",
  APPOINTMENT_PREVIEW: null,
  APPOINTMENT_VERIFY_ID: "auto",  // depends on idMethod
  ERROR: null,
  TIMEOUT: null,
};

/** Resolve "auto" to specific device based on IdMethod */
export function resolveDevice(method: IdMethod): HardwareDevice {
  switch (method) {
    case "thai-id-card": return "id-reader";
    case "passport": return "passport-reader";
    case "thai-id-app": return "qr-reader";
  }
}

/** Get the active device for a given state */
export function getActiveDevice(
  stateType: KioskStateType,
  idMethod?: IdMethod
): HardwareDevice | null {
  const mapped = staticDeviceMap[stateType];
  if (mapped === "auto" && idMethod) return resolveDevice(idMethod);
  if (mapped === "auto") return null;
  return mapped ?? null;
}

/** Device display info */
export interface DeviceInfo {
  id: HardwareDevice;
  name: string;
  nameEn: string;
  icon: string;
  position: "top" | "right-1" | "right-2" | "right-3" | "right-4";
  flutterPlugin: string;
  description: string;
  descriptionEn: string;
}

export const deviceInfoList: DeviceInfo[] = [
  {
    id: "camera",
    name: "กล้องบันทึกภาพ",
    nameEn: "Camera",
    icon: "📷",
    position: "top",
    flutterPlugin: "camera / opencv",
    description: "กล้อง USB สำหรับถ่ายภาพใบหน้า + Face Detection",
    descriptionEn: "USB camera for face photo + face detection",
  },
  {
    id: "qr-reader",
    name: "QR Code Reader",
    nameEn: "QR Code Reader",
    icon: "📱",
    position: "right-1",
    flutterPlugin: "usb_serial / flutter_barcode_scanner",
    description: "เครื่องอ่าน QR Code แบบ USB HID — ใช้สแกน QR นัดหมาย + ThaiID",
    descriptionEn: "USB HID QR scanner — for appointment QR + ThaiID verification",
  },
  {
    id: "id-reader",
    name: "เครื่องอ่านบัตรประชาชน",
    nameEn: "Thai ID Card Reader",
    icon: "🪪",
    position: "right-2",
    flutterPlugin: "flutter_ccid / smart_card",
    description: "เครื่องอ่านบัตร Smart Card (ISO 7816) — อ่านข้อมูลจากชิปบัตรประชาชน",
    descriptionEn: "Smart Card Reader (ISO 7816) — read data from Thai ID chip",
  },
  {
    id: "passport-reader",
    name: "เครื่องอ่าน Passport",
    nameEn: "Passport Reader",
    icon: "📕",
    position: "right-3",
    flutterPlugin: "flutter_nfc / mrz_parser",
    description: "เครื่องอ่าน MRZ + RFID สำหรับ Passport / Travel Document",
    descriptionEn: "MRZ + RFID reader for Passport / Travel Document",
  },
  {
    id: "printer",
    name: "เครื่องพิมพ์ Visit Slip",
    nameEn: "Thermal Printer",
    icon: "🖨",
    position: "right-4",
    flutterPlugin: "esc_pos_printer / thermal_printer",
    description: "เครื่องพิมพ์ thermal 80mm สำหรับพิมพ์ Visit Slip",
    descriptionEn: "80mm thermal printer for Visit Slip printing",
  },
];

/** Get device info by ID */
export function getDeviceInfo(deviceId: HardwareDevice): DeviceInfo | undefined {
  return deviceInfoList.find((d) => d.id === deviceId);
}
