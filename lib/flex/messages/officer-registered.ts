// officer-registered — Flex Message ยืนยันลงทะเบียน Officer สำเร็จ

import { getFlexTemplate } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface OfficerRegisteredParams {
  officerName: string;
  position: string;
  department: string;
  date: string;
}

export function buildOfficerRegisteredMessage(
  params: OfficerRegisteredParams,
  options?: BuildFlexOptions
): LineFlexMessage {
  const template = getFlexTemplate("officer-registered")!;
  return buildFlexMessage(
    template,
    { ...params, userType: "Officer" },
    `ลงทะเบียน Officer สำเร็จ — ${params.officerName}`,
    options
  );
}
