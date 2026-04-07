// visitor-registered — Flex Message ยืนยันการลงทะเบียน Visitor สำเร็จ

import { getFlexTemplate } from "@/lib/line-flex-template-data";
import { buildFlexMessage } from "../builder";
import type { LineFlexMessage } from "../types";
import type { BuildFlexOptions } from "../builder";

export interface VisitorRegisteredParams {
  visitorName: string;
  company: string;
  phone: string;
  date: string;
}

export function buildVisitorRegisteredMessage(
  params: VisitorRegisteredParams,
  options?: BuildFlexOptions
): LineFlexMessage {
  const template = getFlexTemplate("visitor-registered")!;
  return buildFlexMessage(
    template,
    { ...params, userType: "Visitor" },
    `ลงทะเบียนสำเร็จ — ${params.visitorName}`,
    options
  );
}
