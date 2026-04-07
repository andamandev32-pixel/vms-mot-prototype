// visitor-slip-line — Digital Visit Slip ส่งทาง LINE + QR Code

import { getFlexTemplate } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface VisitSlipParams {
  entryCode: string;
  visitorName: string;
  idNumber: string;
  purposeName: string;
  department: string;
  location: string;
  checkinAt: string;
  checkoutAt: string;
}

export function buildVisitSlipMessage(
  params: VisitSlipParams,
  options?: BuildFlexOptions
): LineFlexMessage {
  const template = getFlexTemplate("visitor-slip-line")!;
  return buildFlexMessage(
    template,
    { ...params },
    `Visit Slip — ${params.entryCode}`,
    options
  );
}
