// visitor-auto-cancelled — Flex Message แจ้งยกเลิกอัตโนมัติ (หมดเวลาอนุมัติ)

import { getFlexTemplate } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface AutoCancelledParams {
  bookingCode: string;
  purposeName: string;
  dateTime: string;
  hostName: string;
  timeoutHours: string;
}

export function buildAutoCancelledMessage(
  params: AutoCancelledParams,
  options?: BuildFlexOptions
): LineFlexMessage {
  const template = getFlexTemplate("visitor-auto-cancelled")!;
  return buildFlexMessage(
    template,
    { ...params },
    `นัดหมาย ${params.bookingCode} ถูกยกเลิกอัตโนมัติ`,
    options
  );
}
