// officer-checkin-alert — Flex Message แจ้ง Officer ว่า Visitor Check-in แล้ว

import { getFlexTemplate } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface OfficerCheckinAlertParams {
  visitorName: string;
  company: string;
  checkinInfo: string;
  location: string;
}

export function buildOfficerCheckinAlertMessage(
  params: OfficerCheckinAlertParams,
  options?: BuildFlexOptions
): LineFlexMessage {
  const template = getFlexTemplate("officer-checkin-alert")!;
  return buildFlexMessage(
    template,
    { ...params },
    `${params.visitorName} Check-in แล้ว`,
    options
  );
}
