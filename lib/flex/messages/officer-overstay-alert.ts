// officer-overstay-alert — Flex Message แจ้งเตือน Visitor อยู่เกินเวลา

import { getFlexTemplate } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface OfficerOverstayAlertParams {
  visitorName: string;
  timeSlot: string;
  overstayMinutes: string;
  location: string;
}

export function buildOfficerOverstayAlertMessage(
  params: OfficerOverstayAlertParams,
  options?: BuildFlexOptions
): LineFlexMessage {
  const template = getFlexTemplate("officer-overstay-alert")!;
  return buildFlexMessage(
    template,
    { ...params },
    `⚠️ Overstay: ${params.visitorName} เกินเวลา ${params.overstayMinutes}`,
    options
  );
}
