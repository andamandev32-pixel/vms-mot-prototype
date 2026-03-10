"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { VisitStatus } from "@/lib/mock-data";
import { statusConfig } from "@/lib/mock-data";

// Mapping from VisitStatus to Badge variant
const statusToBadgeVariant: Record<VisitStatus, string> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  confirmed: "approved",          // reuse green
  "checked-in": "checkedin",
  "checked-out": "checkout",
  "auto-checkout": "checkout",
  overstay: "destructive",
  blocked: "destructive",
  cancelled: "outline",
};

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: VisitStatus;
  /** Show bilingual label (Thai + English) */
  showEnglish?: boolean;
  /** Override size */
  size?: "sm" | "md" | "lg";
  /** Show a dot indicator before the label */
  showDot?: boolean;
}

/**
 * StatusBadge — wraps Badge with VMS visit status semantics.
 * Accepts a VisitStatus and renders the appropriate variant + Thai label.
 */
export function StatusBadge({
  status,
  showEnglish = false,
  size = "md",
  showDot = false,
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const variant = statusToBadgeVariant[status] as
    | "pending"
    | "approved"
    | "rejected"
    | "checkedin"
    | "checkout"
    | "destructive"
    | "outline";

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0",
    md: "text-xs px-2.5 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  // For statuses that don't have a built-in badge variant, use custom styling
  const isCustom = ["confirmed", "auto-checkout", "overstay", "blocked", "cancelled"].includes(status);

  if (isCustom) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-semibold transition-colors",
          sizeClasses[size],
          config.bgColor,
          config.color,
          config.borderColor,
          className
        )}
        {...props}
      >
        {showDot && (
          <span className={cn("inline-block h-1.5 w-1.5 rounded-full", config.color.replace("text-", "bg-"))} />
        )}
        <span>{config.label}</span>
        {showEnglish && (
          <span className="opacity-60 ml-1">({config.labelEn})</span>
        )}
      </div>
    );
  }

  return (
    <Badge
      variant={variant}
      className={cn(sizeClasses[size], showDot && "gap-1", className)}
      {...props}
    >
      {showDot && (
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full", config.color.replace("text-", "bg-"))} />
      )}
      <span>{config.label}</span>
      {showEnglish && (
        <span className="opacity-60 ml-1">({config.labelEn})</span>
      )}
    </Badge>
  );
}
