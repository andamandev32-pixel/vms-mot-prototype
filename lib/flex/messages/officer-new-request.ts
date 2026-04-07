// officer-new-request — Flex Message แจ้งคำขอนัดหมายใหม่ + ปุ่ม Postback อนุมัติ/ปฏิเสธ

import { getFlexTemplate } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface OfficerNewRequestParams {
  visitorName: string;
  company: string;
  purposeName: string;
  dateTime: string;
  companions: string;
  appointmentId: string;
}

export function buildOfficerNewRequestMessage(
  params: OfficerNewRequestParams,
  options?: BuildFlexOptions
): LineFlexMessage {
  const template = getFlexTemplate("officer-new-request")!;
  return buildFlexMessage(
    template,
    { ...params },
    `คำขอนัดหมายใหม่ — ${params.visitorName}`,
    options
  );
}
