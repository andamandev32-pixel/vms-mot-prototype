// visitor-checkin-kiosk — Flex Message แจ้ง Check-in สำเร็จ

import { getFlexTemplateFromDB } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface CheckinParams {
  entryCode: string;
  checkinAt: string;
  checkoutAt: string;
  location: string;
}

export async function buildCheckinMessage(
  params: CheckinParams,
  options?: BuildFlexOptions
): Promise<LineFlexMessage> {
  const template = (await getFlexTemplateFromDB("visitor-checkin-kiosk"))!;
  return buildFlexMessage(
    template,
    { ...params },
    `Check-in สำเร็จ — ${params.entryCode}`,
    options
  );
}
