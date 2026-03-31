"use client";

import { Shield, Bell, UserCheck, Wifi, Check, XCircle, CalendarCheck, AlertTriangle, QrCode, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlexTemplateConfig, HeaderVariant } from "@/lib/line-flex-template-data";
import { headerVariantConfig } from "@/lib/line-flex-template-data";

interface FlexMessagePreviewProps {
  template: FlexTemplateConfig;
  scale?: number;
}

const iconMap: Record<string, React.ReactNode> = {
  Shield: <Shield size={16} />,
  Bell: <Bell size={16} />,
  UserCheck: <UserCheck size={16} />,
  Wifi: <Wifi size={16} />,
  Check: <Check size={16} />,
  XCircle: <XCircle size={16} />,
  CalendarCheck: <CalendarCheck size={16} />,
  AlertTriangle: <AlertTriangle size={16} />,
};

export default function FlexMessagePreview({ template, scale = 1 }: FlexMessagePreviewProps) {
  if (template.type === "liff") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <span className="text-2xl">📱</span>
        </div>
        <p className="text-sm font-bold text-text-primary">LIFF App</p>
        <p className="text-xs text-text-muted mt-1">State นี้เปิด LIFF App<br/>ไม่มี Flex Message ที่ส่งจาก Bot</p>
      </div>
    );
  }

  if (template.type === "text") {
    return (
      <div className="p-4">
        <div className="bg-[#7494A5] rounded-xl p-4">
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shadow flex-shrink-0">
              <Shield size={10} className="text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-3 py-2 shadow-sm max-w-[220px]">
              <p className="text-[10px] text-gray-800 whitespace-pre-line leading-relaxed">
                {'ยินดีต้อนรับสู่ eVMES MOT 🙏\nระบบจัดการผู้มาติดต่อ\nกระทรวงการท่องเที่ยวและกีฬา\n\nกรุณากดปุ่ม "Registration Now" ด้านล่าง'}
              </p>
            </div>
          </div>
          <p className="text-[8px] text-white/50 mt-1 ml-9">09:00</p>
        </div>
      </div>
    );
  }

  const variant = headerVariantConfig[template.headerVariant] || headerVariantConfig.standard;
  const enabledRows = template.rows.filter(r => r.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
  const enabledButtons = template.buttons.filter(b => b.enabled).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="p-4">
      <div className="bg-[#7494A5] rounded-xl p-4">
        {/* Bot bubble */}
        <div className="flex items-end gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shadow flex-shrink-0">
            <Shield size={10} className="text-white" />
          </div>
          <div>
            {/* Flex Card */}
            <div className="bg-white rounded-2xl rounded-bl-md shadow-sm overflow-hidden border border-gray-100" style={{ maxWidth: `${240 * scale}px` }}>
              {/* Header */}
              {template.headerVariant === "standard" ? (
                <StandardHeader title={template.headerTitle} subtitle={template.headerSubtitle} color={template.headerColor} />
              ) : (
                <CustomHeader
                  title={template.headerTitle}
                  subtitle={template.headerSubtitle}
                  variant={template.headerVariant}
                />
              )}

              {/* Body */}
              <div className="px-3 py-2.5 space-y-1">
                {/* Status Badge */}
                {template.showStatusBadge && template.statusBadgeType && (
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-text-muted">สถานะ</span>
                    <PreviewStatusBadge type={template.statusBadgeType} customText={template.statusBadgeText} />
                  </div>
                )}

                {/* Rows */}
                {enabledRows.map((row) => (
                  <div key={row.id} className="flex gap-1.5 items-start">
                    <span className="text-text-muted min-w-[45px] text-[9px] flex-shrink-0">{row.label}</span>
                    <span className="font-medium text-text-primary text-[9px]">{row.previewValue}</span>
                  </div>
                ))}
              </div>

              {/* Info Box */}
              {template.infoBox?.enabled && (
                <div className="px-3 pb-1.5">
                  <div className={cn(
                    "rounded-lg p-2 text-center border",
                    template.infoBox.color === "green" && "bg-green-50 border-green-200",
                    template.infoBox.color === "orange" && "bg-orange-50 border-orange-200",
                    template.infoBox.color === "blue" && "bg-primary-50 border-primary-100",
                    template.infoBox.color === "red" && "bg-red-50 border-red-200",
                    template.infoBox.color === "gray" && "bg-gray-50 border-gray-200",
                  )}>
                    <p className={cn(
                      "text-[8px] leading-relaxed whitespace-pre-line",
                      template.infoBox.color === "green" && "text-green-700",
                      template.infoBox.color === "orange" && "text-orange-700",
                      template.infoBox.color === "blue" && "text-primary",
                      template.infoBox.color === "red" && "text-red-700",
                      template.infoBox.color === "gray" && "text-text-muted",
                    )}>{template.infoBox.text.replace(/\{\{.*?\}\}/g, (m) => {
                      const v = m.replace(/[{}]/g, "");
                      return template.rows.find(r => r.variable === v)?.previewValue || "24";
                    })}</p>
                  </div>
                </div>
              )}

              {/* QR Code */}
              {template.showQrCode && (
                <div className="px-3 pb-2 flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center">
                    <QrCode size={32} className="text-gray-400" />
                    <p className="text-[6px] text-gray-400 mt-0.5">{template.qrLabel || "QR Code"}</p>
                  </div>
                  {template.qrLabel && (
                    <p className="text-[7px] text-text-muted mt-1">{template.qrLabel}</p>
                  )}
                </div>
              )}

              {/* Buttons */}
              {enabledButtons.length > 0 && (
                <div className="px-3 pb-2.5 space-y-1.5">
                  {enabledButtons.map((btn) => (
                    <div key={btn.id} className={cn(
                      "w-full font-bold py-2 rounded-lg text-[10px] text-center",
                      btn.variant === "green" && "bg-[#06C755] text-white",
                      btn.variant === "primary" && "bg-primary text-white",
                      btn.variant === "outline" && "bg-white border-2 border-gray-200 text-text-primary",
                      btn.variant === "red" && "bg-red-500 text-white",
                    )}>
                      {btn.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[8px] text-white/50 mt-1 ml-1">09:15</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Sub-components =====

function StandardHeader({ title, subtitle, color = "primary" }: { title: string; subtitle?: string; color?: string }) {
  return (
    <div className="px-3 pt-3 pb-2 text-center border-b border-gray-100">
      <div className="flex items-center justify-center gap-1.5 mb-1.5">
        <div className="w-6 h-6 bg-gradient-to-br from-primary-600 to-primary-800 rounded-md flex items-center justify-center">
          <Shield size={10} className="text-white" />
        </div>
        <div className="text-left">
          <p className="text-[9px] font-extrabold text-primary-800 leading-tight">eVMES MOT</p>
          <p className="text-[6px] text-text-muted leading-tight">Visitor Management System</p>
        </div>
      </div>
      <h3 className={cn(
        "text-[11px] font-bold",
        color === "primary" && "text-primary",
        color === "green" && "text-[#06C755]",
        color === "orange" && "text-orange-500",
        color === "red" && "text-red-500",
        color === "blue" && "text-blue-500",
      )}>{title}</h3>
      {subtitle && <p className="text-[8px] text-text-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}

function CustomHeader({ title, subtitle, variant }: { title: string; subtitle?: string; variant: HeaderVariant }) {
  const config = headerVariantConfig[variant];
  const IconComponent = iconMap[config.icon] || <Shield size={16} />;

  return (
    <div className={cn("px-3 py-2.5 border-b flex items-center gap-2", config.bgClass, config.borderClass)}>
      <span className={config.iconColor}>{IconComponent}</span>
      <div>
        <p className={cn("text-[11px] font-bold", config.textClass)}>{title}</p>
        {subtitle && <p className={cn("text-[8px] opacity-70", config.textClass)}>{subtitle}</p>}
      </div>
    </div>
  );
}

function PreviewStatusBadge({ type, customText }: { type: string; customText?: string }) {
  const configs: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: "รอดำเนินการ", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    approved: { label: "อนุมัติแล้ว", bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
    rejected: { label: "ไม่อนุมัติ", bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    "checked-in": { label: "เข้าพื้นที่แล้ว", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    "checked-out": { label: "ออกแล้ว", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  };
  const c = configs[type] || configs.pending;
  return (
    <span className={cn("px-1.5 py-0.5 rounded-full text-[8px] font-bold border", c.bg, c.text, c.border)}>
      {customText || c.label}
    </span>
  );
}
