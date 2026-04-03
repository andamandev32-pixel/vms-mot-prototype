"use client";

import React from "react";
import { QrCode, Wifi, Scissors, Stamp } from "lucide-react";
import type { SlipData, ThermalSection } from "@/lib/kiosk/kiosk-types";

interface ThermalSlipPreviewProps {
  data: SlipData;
  scale?: number;
  /** Slip header text from kiosk config */
  headerText?: string;
  /** Slip footer text from kiosk config */
  footerText?: string;
  /** Custom logo image source (URL or data-uri) */
  logoSrc?: string;
  /** Logo display size in px (before scale) */
  logoSize?: number;
  /** Show officer signature & stamp section */
  showOfficerSign?: boolean;
  /** Officer sign label TH */
  officerSignLabelTh?: string;
  /** Officer sign label EN */
  officerSignLabelEn?: string;
  /** Stamp label */
  stampLabel?: string;
  /** Dynamic sections config — when provided, controls visibility and order */
  sections?: ThermalSection[];
}

/** Default section order when no sections prop is provided */
const defaultSectionOrder = [
  "header", "slipNumber", "visitor", "host", "time", "extras", "wifi", "qrCode", "officerSign", "footer",
];

/**
 * 80mm thermal printer slip preview
 * Actual 80mm = 302px at 96dpi
 */
export default function ThermalSlipPreview({
  data, scale = 1, headerText, footerText, logoSrc, logoSize = 40,
  showOfficerSign = true,
  officerSignLabelTh = "ลงชื่อเจ้าหน้าที่ / Officer Signature",
  officerSignLabelEn = "ประทับตรา / Stamp",
  stampLabel = "ประทับตราหน่วยงาน",
  sections,
}: ThermalSlipPreviewProps) {

  // Helper to get field label from sections prop
  const getFieldLabel = (sectionId: string, fieldKey: string, fallback: string): string => {
    if (!sections) return fallback;
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return fallback;
    const field = section.fields.find((f) => f.key === fieldKey);
    return field?.label ?? fallback;
  };

  // Check if a specific field is enabled
  const isFieldEnabled = (sectionId: string, fieldKey: string): boolean => {
    if (!sections) return true;
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return true;
    const field = section.fields.find((f) => f.key === fieldKey);
    return field?.enabled ?? true;
  };

  // Section renderers
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    header: () => (
      <div className="text-center" style={{ marginBottom: 8 * scale }}>
        {isFieldEnabled("header", "orgLogo") && (
          <img
            src={logoSrc || "/images/mot_logo_slip.png"}
            alt="Logo"
            className="mx-auto"
            style={{
              width: logoSize * scale,
              height: logoSize * scale,
              objectFit: "contain",
              marginBottom: 4 * scale,
            }}
          />
        )}
        {isFieldEnabled("header", "orgName") && (
          <p className="font-bold" style={{ fontSize: 13 * scale }}>
            {headerText || getFieldLabel("header", "orgName", "กระทรวงการท่องเที่ยวและกีฬา")}
          </p>
        )}
        {isFieldEnabled("header", "orgNameEn") && (
          <p style={{ fontSize: 9 * scale, color: "#666" }}>
            {getFieldLabel("header", "orgNameEn", "Ministry of Tourism and Sports")}
          </p>
        )}
        {isFieldEnabled("header", "slipTitle") && (
          <p style={{ fontSize: 9 * scale, color: "#999", marginTop: 2 * scale }}>
            {getFieldLabel("header", "slipTitle", "VISITOR PASS")}
          </p>
        )}
      </div>
    ),

    slipNumber: () => (
      <div className="text-center" style={{ margin: `${6 * scale}px 0` }}>
        {isFieldEnabled("slipNumber", "slipNumberLabel") && (
          <p style={{ fontSize: 9 * scale, color: "#999" }}>
            {getFieldLabel("slipNumber", "slipNumberLabel", "เลขที่ / Slip No.")}
          </p>
        )}
        {isFieldEnabled("slipNumber", "slipNumber") && (
          <p className="font-bold" style={{ fontSize: 14 * scale, letterSpacing: 1 }}>
            {data.slipNumber}
          </p>
        )}
      </div>
    ),

    visitor: () => (
      <div style={{ margin: `${6 * scale}px 0` }}>
        {isFieldEnabled("visitor", "visitorName") && (
          <SlipRow label={getFieldLabel("visitor", "visitorName", "ชื่อ / Name")} value={data.visitorName} scale={scale} />
        )}
        {isFieldEnabled("visitor", "visitorNameEn") && data.visitorNameEn && data.visitorName !== data.visitorNameEn && (
          <SlipRow label="" value={data.visitorNameEn} scale={scale} light />
        )}
        {isFieldEnabled("visitor", "idNumber") && (
          <SlipRow label={getFieldLabel("visitor", "idNumber", "เลขบัตร / ID")} value={data.idNumber} scale={scale} />
        )}
        {isFieldEnabled("visitor", "visitPurpose") && (
          <SlipRow label={getFieldLabel("visitor", "visitPurpose", "วัตถุประสงค์ / Purpose")} value={data.visitPurpose} scale={scale} />
        )}
        {isFieldEnabled("visitor", "visitPurposeEn") && data.visitPurposeEn && (
          <SlipRow label="" value={data.visitPurposeEn} scale={scale} light />
        )}
      </div>
    ),

    host: () => (
      <div style={{ margin: `${6 * scale}px 0` }}>
        {isFieldEnabled("host", "hostName") && (
          <SlipRow label={getFieldLabel("host", "hostName", "ผู้รับ / Host")} value={data.hostName} scale={scale} />
        )}
        {isFieldEnabled("host", "department") && (
          <SlipRow label={getFieldLabel("host", "department", "หน่วยงาน / Dept")} value={data.department} scale={scale} />
        )}
        {isFieldEnabled("host", "accessZone") && (
          <SlipRow label={getFieldLabel("host", "accessZone", "พื้นที่ / Zone")} value={data.accessZone} scale={scale} />
        )}
      </div>
    ),

    time: () => (
      <div style={{ margin: `${6 * scale}px 0` }}>
        {isFieldEnabled("time", "visitDate") && (
          <SlipRow label={getFieldLabel("time", "visitDate", "วันที่ / Date")} value={data.date} scale={scale} />
        )}
        {isFieldEnabled("time", "timeIn") && (
          <SlipRow label={getFieldLabel("time", "timeIn", "เข้า / In")} value={data.timeIn} scale={scale} />
        )}
        {isFieldEnabled("time", "timeOut") && data.timeOut && (
          <SlipRow label={getFieldLabel("time", "timeOut", "ออก / Out")} value={data.timeOut} scale={scale} />
        )}
      </div>
    ),

    extras: () => (
      <div style={{ margin: `${6 * scale}px 0` }}>
        {isFieldEnabled("extras", "companions") && data.companions !== undefined && data.companions > 0 && (
          <SlipRow label={getFieldLabel("extras", "companions", "ผู้ติดตาม")} value={`${data.companions} คน`} scale={scale} />
        )}
        {isFieldEnabled("extras", "vehiclePlate") && data.vehiclePlate && (
          <SlipRow label={getFieldLabel("extras", "vehiclePlate", "ทะเบียนรถ")} value={data.vehiclePlate} scale={scale} />
        )}
      </div>
    ),

    wifi: () => {
      if (!data.wifi) return null;
      return (
        <div
          className="rounded text-center"
          style={{
            margin: `${6 * scale}px 0`,
            padding: `${6 * scale}px`,
            background: "#f0f0f0",
          }}
        >
          <div className="flex items-center justify-center gap-1" style={{ marginBottom: 3 * scale }}>
            <Wifi size={12 * scale} />
            <span className="font-bold" style={{ fontSize: 10 * scale }}>Guest WiFi</span>
          </div>
          {isFieldEnabled("wifi", "wifiSsid") && (
            <p style={{ fontSize: 10 * scale }}>SSID: <strong>{data.wifi.ssid}</strong></p>
          )}
          {isFieldEnabled("wifi", "wifiPass") && (
            <p style={{ fontSize: 10 * scale }}>Pass: <strong>{data.wifi.password}</strong></p>
          )}
          {isFieldEnabled("wifi", "wifiExpiry") && (
            <p style={{ fontSize: 8 * scale, color: "#999" }}>
              ใช้ได้ถึง {data.wifi.validUntil}
            </p>
          )}
        </div>
      );
    },

    qrCode: () => (
      <div className="text-center" style={{ margin: `${8 * scale}px 0` }}>
        {isFieldEnabled("qrCode", "qrCode") && (
          <div
            className="mx-auto border-2 border-dashed border-gray-300 flex items-center justify-center"
            style={{
              width: 80 * scale,
              height: 80 * scale,
              borderRadius: 8 * scale,
            }}
          >
            <QrCode size={48 * scale} className="text-gray-400" />
          </div>
        )}
        {isFieldEnabled("qrCode", "qrLabel") && (
          <p style={{ fontSize: 8 * scale, color: "#999", marginTop: 3 * scale }}>
            {getFieldLabel("qrCode", "qrLabel", "สแกนเพื่อ Check-out / Scan to Check-out")}
          </p>
        )}
      </div>
    ),

    officerSign: () => {
      const signLabel = sections
        ? getFieldLabel("officerSign", "officerSignLabel", officerSignLabelTh)
        : officerSignLabelTh;
      const stmpLabelEn = sections
        ? getFieldLabel("officerSign", "stampLabel", officerSignLabelEn)
        : officerSignLabelEn;
      const stmpPlaceholder = sections
        ? getFieldLabel("officerSign", "stampPlaceholder", stampLabel)
        : stampLabel;

      return (
        <div style={{ margin: `${6 * scale}px 0` }}>
          <div className="flex gap-2" style={{ marginBottom: 6 * scale }}>
            {/* Signature area */}
            {isFieldEnabled("officerSign", "officerSignLabel") && (
              <div className="flex-1 text-center">
                <p style={{ fontSize: 8 * scale, color: "#999", marginBottom: 2 * scale }}>
                  {signLabel}
                </p>
                {isFieldEnabled("officerSign", "officerSignLine") && (
                  <>
                    <div
                      className="border-b border-gray-400 mx-auto"
                      style={{ width: "80%", height: 24 * scale, marginBottom: 2 * scale }}
                    />
                    <p style={{ fontSize: 7 * scale, color: "#bbb" }}>
                      (................................................)
                    </p>
                  </>
                )}
              </div>
            )}
            {/* Stamp area */}
            {isFieldEnabled("officerSign", "stampLabel") && (
              <div className="flex-1 text-center">
                <p style={{ fontSize: 8 * scale, color: "#999", marginBottom: 2 * scale }}>
                  {stmpLabelEn}
                </p>
                {isFieldEnabled("officerSign", "stampPlaceholder") && (
                  <>
                    <div
                      className="mx-auto border-2 border-dashed border-gray-300 rounded flex items-center justify-center"
                      style={{
                        width: 44 * scale,
                        height: 44 * scale,
                      }}
                    >
                      <Stamp size={18 * scale} className="text-gray-300" />
                    </div>
                    <p style={{ fontSize: 7 * scale, color: "#bbb", marginTop: 2 * scale }}>
                      {stmpPlaceholder}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      );
    },

    footer: () => (
      <div>
        {isFieldEnabled("footer", "footerTh") && (
          <p className="text-center" style={{ fontSize: 8 * scale, color: "#999", marginTop: 4 * scale }}>
            {footerText || getFieldLabel("footer", "footerTh", "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร")}
          </p>
        )}
        {isFieldEnabled("footer", "footerEn") && (
          <p className="text-center" style={{ fontSize: 8 * scale, color: "#999" }}>
            {getFieldLabel("footer", "footerEn", "Please return this pass when leaving")}
          </p>
        )}
      </div>
    ),
  };

  // Determine section order and visibility
  const orderedSections: { id: string; enabled: boolean }[] = sections
    ? sections.map((s) => ({ id: s.id, enabled: s.enabled }))
    : defaultSectionOrder.map((id) => ({
        id,
        enabled: id === "officerSign" ? showOfficerSign : id === "extras" ? false : true,
      }));

  // Filter to enabled sections that have a renderer
  const visibleSections = orderedSections.filter(
    (s) => s.enabled && sectionRenderers[s.id]
  );

  return (
    <div
      className="bg-white text-black font-mono mx-auto shadow-lg"
      style={{
        width: 302 * scale,
        fontSize: 11 * scale,
        padding: `${12 * scale}px ${10 * scale}px`,
      }}
    >
      {visibleSections.map((section, i) => {
        const content = sectionRenderers[section.id]();
        if (content === null) return null;
        return (
          <React.Fragment key={section.id}>
            {i > 0 && <DashedLine scale={scale} />}
            {content}
          </React.Fragment>
        );
      })}

      {/* Cut line */}
      <div className="flex items-center justify-center gap-1 mt-3" style={{ color: "#ccc", fontSize: 8 * scale }}>
        <Scissors size={10 * scale} />
        <span>{'- '.repeat(18)}</span>
      </div>
    </div>
  );
}

function SlipRow({ label, value, scale = 1, light }: { label: string; value: string; scale?: number; light?: boolean }) {
  return (
    <div
      className="flex justify-between gap-2"
      style={{ marginBottom: 2 * scale, fontSize: (light ? 9 : 10) * scale }}
    >
      {label && <span style={{ color: "#666", whiteSpace: "nowrap" }}>{label}</span>}
      <span
        className={label ? "text-right" : ""}
        style={{
          fontWeight: light ? "normal" : 600,
          color: light ? "#888" : "#000",
          wordBreak: "break-all",
          flex: label ? undefined : 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function DashedLine({ scale = 1 }: { scale?: number }) {
  return (
    <div
      className="border-t border-dashed border-gray-300"
      style={{ margin: `${4 * scale}px 0` }}
    />
  );
}
