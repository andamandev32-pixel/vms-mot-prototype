// visitor-overstay-alert — Flex Message แจ้งเตือน Visitor ว่าอยู่เกินเวลา

import { getFlexTemplateFromDB } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface VisitorOverstayAlertParams {
  checkinAt: string;
  expectedCheckout: string;
  overstayDuration: string;
  purposeName: string;
  departmentName: string;
  location: string;
}

export async function buildVisitorOverstayAlertMessage(
  params: VisitorOverstayAlertParams,
  options?: BuildFlexOptions
): Promise<LineFlexMessage> {
  const template = (await getFlexTemplateFromDB("visitor-overstay-alert"))!;
  return buildFlexMessage(
    template,
    { ...params },
    `⏰ คุณอยู่เกินเวลานัดแล้ว ${params.overstayDuration}`,
    options
  );
}
