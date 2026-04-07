// visitor-checkin-kiosk — Flex Message แจ้ง Check-in สำเร็จ

import { getFlexTemplate } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface CheckinParams {
  entryCode: string;
  checkinAt: string;
  checkoutAt: string;
  location: string;
}

export function buildCheckinMessage(
  params: CheckinParams,
  options?: BuildFlexOptions
): LineFlexMessage {
  const template = getFlexTemplate("visitor-checkin-kiosk")!;
  return buildFlexMessage(
    template,
    { ...params },
    `Check-in สำเร็จ — ${params.entryCode}`,
    options
  );
}
