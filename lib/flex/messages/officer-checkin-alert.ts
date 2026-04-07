// officer-checkin-alert — Flex Message แจ้ง Officer ว่า Visitor Check-in แล้ว

import { getFlexTemplateFromDB } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface OfficerCheckinAlertParams {
  visitorName: string;
  company: string;
  checkinInfo: string;
  location: string;
}

export async function buildOfficerCheckinAlertMessage(
  params: OfficerCheckinAlertParams,
  options?: BuildFlexOptions
): Promise<LineFlexMessage> {
  const template = (await getFlexTemplateFromDB("officer-checkin-alert"))!;
  return buildFlexMessage(
    template,
    { ...params },
    `${params.visitorName} Check-in แล้ว`,
    options
  );
}
