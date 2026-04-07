// officer-overstay-alert — Flex Message แจ้งเตือน Visitor อยู่เกินเวลา

import { getFlexTemplateFromDB } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface OfficerOverstayAlertParams {
  visitorName: string;
  timeSlot: string;
  overstayMinutes: string;
  location: string;
}

export async function buildOfficerOverstayAlertMessage(
  params: OfficerOverstayAlertParams,
  options?: BuildFlexOptions
): Promise<LineFlexMessage> {
  const template = (await getFlexTemplateFromDB("officer-overstay-alert"))!;
  return buildFlexMessage(
    template,
    { ...params },
    `⚠️ Overstay: ${params.visitorName} เกินเวลา ${params.overstayMinutes}`,
    options
  );
}
