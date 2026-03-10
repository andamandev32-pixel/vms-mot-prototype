"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { X, AlertTriangle, Info, CheckCircle, Trash2 } from "lucide-react";

const modalOverlayVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity",
  {
    variants: {
      open: {
        true: "opacity-100 pointer-events-auto",
        false: "opacity-0 pointer-events-none",
      },
    },
    defaultVariants: {
      open: false,
    },
  }
);

const modalVariants = cva(
  "relative w-full rounded-2xl bg-white shadow-2xl transition-all",
  {
    variants: {
      size: {
        sm: "max-w-sm p-5",
        md: "max-w-md p-6",
        lg: "max-w-lg p-8",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export type ModalVariant = "danger" | "warning" | "info" | "success";

const variantConfig: Record<ModalVariant, {
  iconBg: string;
  icon: React.ReactNode;
  confirmVariant: "destructive" | "primary" | "secondary";
}> = {
  danger: {
    iconBg: "bg-red-100",
    icon: <Trash2 className="h-6 w-6 text-error" />,
    confirmVariant: "destructive",
  },
  warning: {
    iconBg: "bg-amber-100",
    icon: <AlertTriangle className="h-6 w-6 text-warning" />,
    confirmVariant: "primary",
  },
  info: {
    iconBg: "bg-blue-100",
    icon: <Info className="h-6 w-6 text-info" />,
    confirmVariant: "primary",
  },
  success: {
    iconBg: "bg-green-100",
    icon: <CheckCircle className="h-6 w-6 text-success" />,
    confirmVariant: "primary",
  },
};

interface ConfirmModalProps extends VariantProps<typeof modalVariants> {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  variant?: ModalVariant;
  title: string;
  titleEn?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Loading state for confirm button */
  loading?: boolean;
  /** Hide cancel button (info/success alerts) */
  hideCancel?: boolean;
  children?: React.ReactNode;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  variant = "info",
  title,
  titleEn,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  loading = false,
  hideCancel = false,
  size = "md",
  children,
}: ConfirmModalProps) {
  const config = variantConfig[variant];

  // Close on Escape
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cn(modalOverlayVariants({ open: true }))}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={cn(modalVariants({ size }), "animate-in fade-in zoom-in-95")}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1.5 text-text-muted hover:bg-gray-100 hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={cn("rounded-full p-3", config.iconBg)}>
            {config.icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-center text-lg font-semibold text-text-primary mb-1">
          {title}
        </h3>
        {titleEn && (
          <p className="text-center text-sm text-text-muted mb-2">{titleEn}</p>
        )}

        {/* Description */}
        {description && (
          <p className="text-center text-sm text-text-secondary mb-4">
            {description}
          </p>
        )}

        {/* Custom content */}
        {children && <div className="mb-4">{children}</div>}

        {/* Actions */}
        <div className={cn("flex gap-3", hideCancel ? "justify-center" : "justify-center")}>
          {!hideCancel && (
            <Button variant="outline" onClick={onClose} className="min-w-[100px]">
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={config.confirmVariant}
            onClick={onConfirm}
            loading={loading}
            className="min-w-[100px]"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
