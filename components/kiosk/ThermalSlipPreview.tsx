"use client";

import { QrCode, Wifi, Scissors } from "lucide-react";
import type { SlipData } from "@/lib/kiosk/kiosk-types";

interface ThermalSlipPreviewProps {
  data: SlipData;
  scale?: number;
  /** Slip header text from kiosk config */
  headerText?: string;
  /** Slip footer text from kiosk config */
  footerText?: string;
}

/**
 * 80mm thermal printer slip preview
 * Actual 80mm = 302px at 96dpi
 */
export default function ThermalSlipPreview({ data, scale = 1, headerText, footerText }: ThermalSlipPreviewProps) {
  return (
    <div
      className="bg-white text-black font-mono mx-auto shadow-lg"
      style={{
        width: 302 * scale,
        fontSize: 11 * scale,
        padding: `${12 * scale}px ${10 * scale}px`,
      }}
    >
      {/* Header — MOTS Logo area */}
      <div className="text-center" style={{ marginBottom: 8 * scale }}>
        <div
          className="mx-auto bg-[#1B2B5E] text-white font-bold flex items-center justify-center"
          style={{
            width: 40 * scale,
            height: 40 * scale,
            borderRadius: 8 * scale,
            fontSize: 18 * scale,
            marginBottom: 4 * scale,
          }}
        >
          🏛️
        </div>
        <p className="font-bold" style={{ fontSize: 13 * scale }}>
          {headerText || "กระทรวงการท่องเที่ยวและกีฬา"}
        </p>
        <p style={{ fontSize: 9 * scale, color: "#666" }}>
          Ministry of Tourism and Sports
        </p>
        <p style={{ fontSize: 9 * scale, color: "#999", marginTop: 2 * scale }}>
          VISITOR PASS
        </p>
      </div>

      {/* Dashed separator */}
      <DashedLine scale={scale} />

      {/* Slip number */}
      <div className="text-center" style={{ margin: `${6 * scale}px 0` }}>
        <p style={{ fontSize: 9 * scale, color: "#999" }}>เลขที่ / Slip No.</p>
        <p className="font-bold" style={{ fontSize: 14 * scale, letterSpacing: 1 }}>
          {data.slipNumber}
        </p>
      </div>

      <DashedLine scale={scale} />

      {/* Visitor info */}
      <div style={{ margin: `${6 * scale}px 0` }}>
        <SlipRow label="ชื่อ / Name" value={data.visitorName} scale={scale} />
        {data.visitorNameEn && data.visitorName !== data.visitorNameEn && (
          <SlipRow label="" value={data.visitorNameEn} scale={scale} light />
        )}
        <SlipRow label="เลขบัตร / ID" value={data.idNumber} scale={scale} />
        <SlipRow label="วัตถุประสงค์ / Purpose" value={data.visitPurpose} scale={scale} />
        {data.visitPurposeEn && (
          <SlipRow label="" value={data.visitPurposeEn} scale={scale} light />
        )}
      </div>

      <DashedLine scale={scale} />

      {/* Host info */}
      <div style={{ margin: `${6 * scale}px 0` }}>
        <SlipRow label="ผู้รับ / Host" value={data.hostName} scale={scale} />
        <SlipRow label="หน่วยงาน / Dept" value={data.department} scale={scale} />
        <SlipRow label="พื้นที่ / Zone" value={data.accessZone} scale={scale} />
      </div>

      <DashedLine scale={scale} />

      {/* Time */}
      <div style={{ margin: `${6 * scale}px 0` }}>
        <SlipRow label="วันที่ / Date" value={data.date} scale={scale} />
        <SlipRow label="เข้า / In" value={data.timeIn} scale={scale} />
        {data.timeOut && <SlipRow label="ออก / Out" value={data.timeOut} scale={scale} />}
      </div>

      {data.companions !== undefined && data.companions > 0 && (
        <SlipRow label="ผู้ติดตาม" value={`${data.companions} คน`} scale={scale} />
      )}
      {data.vehiclePlate && (
        <SlipRow label="ทะเบียนรถ" value={data.vehiclePlate} scale={scale} />
      )}

      {/* WiFi section */}
      {data.wifi && (
        <>
          <DashedLine scale={scale} />
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
            <p style={{ fontSize: 10 * scale }}>SSID: <strong>{data.wifi.ssid}</strong></p>
            <p style={{ fontSize: 10 * scale }}>Pass: <strong>{data.wifi.password}</strong></p>
            <p style={{ fontSize: 8 * scale, color: "#999" }}>
              ใช้ได้ถึง {data.wifi.validUntil}
            </p>
          </div>
        </>
      )}

      <DashedLine scale={scale} />

      {/* QR Code placeholder */}
      <div className="text-center" style={{ margin: `${8 * scale}px 0` }}>
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
        <p style={{ fontSize: 8 * scale, color: "#999", marginTop: 3 * scale }}>
          สแกนเพื่อ Check-out / Scan to Check-out
        </p>
      </div>

      {/* Footer */}
      <DashedLine scale={scale} />
      <p className="text-center" style={{ fontSize: 8 * scale, color: "#999", marginTop: 4 * scale }}>
        {footerText || "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร"}
      </p>
      <p className="text-center" style={{ fontSize: 8 * scale, color: "#999" }}>
        Please return this pass when leaving
      </p>

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
