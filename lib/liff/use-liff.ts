"use client";

// ════════════════════════════════════════════════════
// useLiff() — Hook สำหรับเข้าถึง LIFF Context
// ════════════════════════════════════════════════════

import { useContext } from "react";
import { LiffContext, type LiffContextValue } from "./provider";

export function useLiff(): LiffContextValue {
  const ctx = useContext(LiffContext);
  if (!ctx) {
    throw new Error("useLiff() ต้องใช้ภายใน <LiffProvider>");
  }
  return ctx;
}
