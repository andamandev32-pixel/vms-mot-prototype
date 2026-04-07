// ════════════════════════════════════════════════════
// Color Constants for LINE Flex Messages
// Map จาก Tailwind / App theme → HEX colors สำหรับ LINE Flex
// ════════════════════════════════════════════════════

import type { HeaderVariant, HeaderColor, ButtonVariant } from "@/lib/line-flex-template-data";

// ===== Header Variant Colors =====
// Map headerVariant → background + text + accent colors

export interface VariantColors {
  bg: string;
  text: string;
  accent: string;
  border: string;
}

export const headerVariantColors: Record<HeaderVariant, VariantColors> = {
  standard:           { bg: "#FFFFFF",  text: "#1B4965", accent: "#1B4965", border: "#F3F4F6" },
  reminder:           { bg: "#FFFBEB",  text: "#B45309", accent: "#F59E0B", border: "#FDE68A" },
  checkin:            { bg: "#EFF6FF",  text: "#1D4ED8", accent: "#3B82F6", border: "#BFDBFE" },
  wifi:               { bg: "#ECFEFF",  text: "#0E7490", accent: "#06B6D4", border: "#A5F3FC" },
  slip:               { bg: "#F0F4FF",  text: "#1B4965", accent: "#1B4965", border: "#D1DAE8" },
  checkout:           { bg: "#F0FDF4",  text: "#15803D", accent: "#22C55E", border: "#BBF7D0" },
  "auto-cancelled":   { bg: "#FFF7ED",  text: "#C2410C", accent: "#EA580C", border: "#FED7AA" },
  "officer-request":  { bg: "#FFFBEB",  text: "#B45309", accent: "#F59E0B", border: "#FDE68A" },
  "officer-approved": { bg: "#F0FDF4",  text: "#15803D", accent: "#22C55E", border: "#BBF7D0" },
  "officer-checkin":  { bg: "#EFF6FF",  text: "#1D4ED8", accent: "#3B82F6", border: "#BFDBFE" },
  "officer-overstay": { bg: "#FEF2F2",  text: "#B91C1C", accent: "#EF4444", border: "#FECACA" },
};

// ===== Header Color → Primary color =====

export const headerColors: Record<HeaderColor, string> = {
  primary: "#1B4965",
  green:   "#16A34A",
  orange:  "#EA580C",
  red:     "#DC2626",
  blue:    "#2563EB",
};

// ===== Status Badge Colors =====

export interface BadgeColors {
  bg: string;
  text: string;
}

export const statusBadgeColors: Record<string, BadgeColors> = {
  pending:        { bg: "#FEF3C7", text: "#92400E" },
  approved:       { bg: "#D1FAE5", text: "#065F46" },
  rejected:       { bg: "#FEE2E2", text: "#991B1B" },
  confirmed:      { bg: "#DBEAFE", text: "#1E40AF" },
  cancelled:      { bg: "#F3F4F6", text: "#4B5563" },
  expired:        { bg: "#F3F4F6", text: "#6B7280" },
  "checked-in":   { bg: "#DBEAFE", text: "#1E40AF" },
  "checked-out":  { bg: "#D1FAE5", text: "#065F46" },
  "auto-checkout":{ bg: "#FEF3C7", text: "#92400E" },
  overstay:       { bg: "#FEE2E2", text: "#991B1B" },
};

// ===== Button Variant Colors =====

export interface ButtonColors {
  style: "primary" | "secondary" | "link";
  color: string;
}

export const buttonVariantColors: Record<ButtonVariant, ButtonColors> = {
  green:   { style: "primary", color: "#16A34A" },
  primary: { style: "primary", color: "#1B4965" },
  outline: { style: "secondary", color: "#6B7280" },
  red:     { style: "primary", color: "#DC2626" },
};

// ===== Info Box Colors =====

export interface InfoBoxColors {
  bg: string;
  text: string;
  border: string;
}

export const infoBoxColors: Record<string, InfoBoxColors> = {
  green:  { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  orange: { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" },
  blue:   { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" },
  red:    { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  gray:   { bg: "#F9FAFB", text: "#4B5563", border: "#E5E7EB" },
};

// ===== Separator =====

export const SEPARATOR_COLOR = "#E5E7EB";

// ===== eVMS Branding =====

export const EVMS_PRIMARY = "#1B4965";
export const EVMS_LOGO_URL = "https://evms.mots.go.th/images/evms-logo.png";
